import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { User, MenuItem } from '../models/menu';
import {
  AppAction,
  AuthorizationProfile,
  MenuAssignedAction,
  MenuHabilitation,
  appActionId,
} from '../models/authorization';
import {
  appendRootMenu,
  collectMenuIds,
  flattenMenuItems,
  insertChildMenu,
  removeMenuById,
  replaceMenuById,
} from '../utils/menu-tree';
import { AuthService } from './auth.service';
import { AuditTrailService } from './audit-trail.service';
import { MenusService } from './menus.service';
import { ActionsService } from './actions.service';
import { ProfilsService } from './profils.service';
import { RessourcesService } from './ressources.service';
import { EntitesService } from './entites.service';
import { SpecialitesService } from './specialites.service';
import { ApplicationsService } from './applications.service';
import { JalonsService } from './jalons.service';
import {
  extractApiBody,
  extractApiCreatedAt,
  extractApiCreatedBy,
  extractApiItem,
} from '../utils/api-response.utils';
import type { Entity, Specialty, Application, Jalon } from '../models/settings-catalog';
import {
  buildFullHabilitation,
  defaultActions,
  defaultApplications,
  defaultEntities,
  defaultJalons,
  defaultMenus,
  defaultProfiles,
  defaultSpecialties,
  createDemoUser,
} from '../data/local-app-defaults';

export type Profile = AuthorizationProfile;

export type { Entity, Specialty, Application, Jalon } from '../models/settings-catalog';

export interface EntitySelectOption {
  id: string;
  label: string;
  icon: string;
  active: boolean;
}

export interface JalonSelectOption {
  id: string;
  label: string;
}

function flattenEntitiesForSelect(entities: Entity[], prefix = ''): EntitySelectOption[] {
  const out: EntitySelectOption[] = [];
  for (const e of entities) {
    const label = prefix ? `${prefix} › ${e.name}` : e.name;
    out.push({ id: e.id, label, icon: e.icon, active: e.active });
    if (e.children?.length) {
      out.push(...flattenEntitiesForSelect(e.children, label));
    }
  }
  return out;
}

function flattenJalonsForSelect(jalons: Jalon[], prefix = ''): JalonSelectOption[] {
  const roots = jalons.filter((j) => !j.parentId);
  const out: JalonSelectOption[] = [];

  const walk = (parentId: string | undefined, currentPrefix: string) => {
    const nodes = jalons
      .filter((j) => j.parentId === parentId)
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    for (const j of nodes) {
      const label = currentPrefix ? `${currentPrefix} › ${j.label}` : j.label;
      out.push({ id: j.id, label });
      walk(j.id, label);
    }
  };

  if (roots.length) {
    walk(undefined, prefix);
  }

  return out;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private auth = inject(AuthService);
  private auditTrail = inject(AuditTrailService);
  private menusApi = inject(MenusService);
  private actionsApi = inject(ActionsService);
  private profilsApi = inject(ProfilsService);
  private ressourcesApi = inject(RessourcesService);
  private entitesApi = inject(EntitesService);
  private specialitesApi = inject(SpecialitesService);
  private applicationsApi = inject(ApplicationsService);
  private jalonsApi = inject(JalonsService);

  private menus = signal<MenuItem[]>([]);
  private actions = signal<AppAction[]>([]);
  private habilitation = signal<MenuHabilitation>({});
  /** Actions assignées par menu (actionId = nom affiché côté API). */
  private menuAssignedActions = signal<Record<string, MenuAssignedAction[]>>({});

  private profiles = signal<AuthorizationProfile[]>([]);

  private users = signal<User[]>([]);
  private specialties = signal<Specialty[]>([]);
  private entities = signal<Entity[]>([]);
  private applications = signal<Application[]>([]);
  private jalons = signal<Jalon[]>([]);

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.refreshSettings();
    } else {
      this.loadLocalDefaults();
    }
  }

  /** Charge les référentiels depuis l'API backend. */
  refreshSettings(): void {
    this.loadFromApi().subscribe();
  }

  loadFromApi(): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      this.loadLocalDefaults();
      return of(undefined);
    }

    return forkJoin({
      menus: this.menusApi.list().pipe(catchError(() => of(null))),
      actions: this.actionsApi.list({} as any).pipe(catchError(() => of(null))),
      profils: this.profilsApi.list().pipe(catchError(() => of(null))),
      ressources: this.ressourcesApi.list({} as any).pipe(catchError(() => of(null))),
      entites: this.entitesApi.list({} as any).pipe(catchError(() => of(null))),
      specialites: this.specialitesApi.list({} as any).pipe(catchError(() => of(null))),
      applications: this.applicationsApi.list({} as any).pipe(catchError(() => of(null))),
      jalons: this.jalonsApi.list({} as any).pipe(catchError(() => of(null))),
    }).pipe(
      switchMap((payload) => {
        const menuItems = extractApiBody(payload.menus).map(mapApiMenu);
        const flatMenus = flattenFlatMenus(menuItems);
        const actionItems = extractApiBody(payload.actions).map(mapApiAction);
        return this.enrichFlatMenusFromApi(flatMenus).pipe(
          map((enrichedFlat) => ({ ...payload, menuItems, flatMenus: enrichedFlat, actionItems })),
        );
      }),
      tap(({ menuItems, flatMenus, actionItems, profils, ressources, entites, specialites, applications, jalons }) => {
        this.menus.set(buildMenuTree(menuItems));
        this.actions.set(actionItems);
        this.habilitation.set(buildHabilitationFromMenus(flatMenus));
        this.applyMenuAssignedActionsFromFlat(flatMenus);
        this.profiles.set(extractApiBody(profils).map(mapApiProfile));
        this.users.set(extractApiBody(ressources).map(mapApiUser));
        this.entities.set(buildEntityTree(extractApiBody(entites)));
        this.specialties.set(extractApiBody(specialites).map(mapApiSpecialty));
        this.applications.set(extractApiBody(applications).map(mapApiApplication));
        this.jalons.set(extractApiBody(jalons).map(mapApiJalon));
      }),
      map(() => undefined),
      catchError(() => {
        if (!this.auth.isAuthenticated()) {
          this.loadLocalDefaults();
        }
        return of(undefined);
      }),
    );
  }

  /** Données paramétrage locales (fallback hors connexion). */
  loadLocalDefaults(): void {
    const actions = defaultActions();
    const menus = defaultMenus();
    this.menus.set(menus);
    this.actions.set(actions);
    this.habilitation.set(buildFullHabilitation(menus, actions));
    this.applyMenuAssignedActionsFromHabilitation();
    this.profiles.set(defaultProfiles());
    this.users.set([createDemoUser()]);
    this.specialties.set(defaultSpecialties());
    this.entities.set(defaultEntities());
    this.applications.set(defaultApplications());
    this.jalons.set(defaultJalons());
  }

  /** Alias conservé pour les écrans qui rafraîchissaient l'API. */
  reloadFromApi(): Observable<void> {
    return this.loadFromApi();
  }

  allMenus = computed(() => this.menus());
  allActions = computed(() => this.actions());
  allHabilitation = computed(() => this.habilitation());
  allMenuAssignedActions = computed(() => this.menuAssignedActions());
  allProfiles = computed(() => this.profiles());
  allUsers = computed(() => this.users());
  /** Utilisateurs triés pour les selects (responsable, TPM, affectations). */
  usersForSelect = computed(() =>
    [...this.users()].sort((a, b) => {
      const an = (a.name || `${a.firstName} ${a.lastName}`.trim() || a.email) ?? '';
      const bn = (b.name || `${b.firstName} ${b.lastName}`.trim() || b.email) ?? '';
      return an.localeCompare(bn, 'fr');
    }),
  );
  allEntities = computed(() => this.entities());
  allSpecialties = computed(() => this.specialties());
  allApplications = computed(() => this.applications());
  allJalons = computed(() => [...this.jalons()].sort((a, b) => a.label.localeCompare(b.label, 'fr')));
  entitySelectOptions = computed(() => flattenEntitiesForSelect(this.entities()));
  jalonSelectOptions = computed(() => flattenJalonsForSelect(this.jalons()));

  generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  /** Génère un code préfixé (ex. ACT-001) comme l'ancien backoffice. */
  generatePrefixedCode(prefix: string, items: Array<{ code?: string }>): string {
    let maxNumber = 0;
    const pattern = new RegExp(`^${prefix}-(\\d+)$`);
    for (const item of items) {
      const match = String(item.code ?? '').match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    return `${prefix}-${String(maxNumber + 1).padStart(3, '0')}`;
  }

  nextMenuId(): string {
    return this.generateId();
  }

  nextProfileId(): string {
    return this.generateId();
  }

  getProfile(id: string): AuthorizationProfile | undefined {
    return this.profiles().find((p) => p.id === id);
  }

  getProfileLabel(id: string): string {
    return this.getProfile(id)?.label ?? id;
  }

  getMenuById(id: string): MenuItem | undefined {
    return flattenMenuItems(this.menus()).find((m) => m.id === id);
  }

  /** Actions assignées à un menu ; affichage par actionId (nom API). */
  getAssignedActionsForMenu(menuId: string): MenuAssignedAction[] {
    const assigned = this.menuAssignedActions()[menuId];
    if (assigned?.length) {
      return assigned;
    }
    const catalog = this.actions();
    const byActionId = new Map(
      catalog.map((a) => [appActionId(a).toUpperCase(), a]),
    );
    const refs = this.habilitation()[menuId] ?? [];
    return refs.map((ref) => {
      const found = byActionId.get(ref.trim().toUpperCase());
      const actionId = found ? appActionId(found) : ref;
      return {
        actionId,
        label: actionId,
        icon: found?.icon ?? 'bolt',
      };
    });
  }

  /** @deprecated Préférer getAssignedActionsForMenu. */
  getActionsForMenu(menuId: string): AppAction[] {
    return this.getAssignedActionsForMenu(menuId).map((action) => ({
      id: action.actionId,
      actionId: action.actionId,
      code: action.actionId,
      label: action.actionId,
      icon: action.icon ?? 'bolt',
      active: true,
    }));
  }

  /** Recharge les actions d'un menu depuis GET /menus/:id (détail API). */
  refreshMenuActionsFromApi(menuId: string): Observable<void> {
    return this.fetchMenuActionIdsFromApi(menuId).pipe(map(() => undefined));
  }

  /**
   * Charge les actionId associés à un menu (GET /menus/:id), comme l'ancien backoffice.
   * Met à jour le cache local puis renvoie les identifiants métier prêts pour le formulaire.
   */
  fetchMenuActionIdsFromApi(menuId: string): Observable<string[]> {
    if (!this.auth.isAuthenticated()) {
      return of(this.getAssignedActionsForMenu(menuId).map((a) => a.actionId));
    }
    const apiId = Number(menuId);
    if (Number.isNaN(apiId)) {
      return of([]);
    }
    return this.menusApi.getById(apiId).pipe(
      map((resp) => {
        const detail = extractApiItem(resp);
        const assigned = extractMenuAssignedActions(detail ?? {});
        this.mergeMenuAssignedActions(menuId, assigned);
        return assigned.map((a) => a.actionId);
      }),
      catchError(() =>
        of(this.getAssignedActionsForMenu(menuId).map((a) => a.actionId)),
      ),
    );
  }

  /** Associe un actionId API au code catalogue (comme id = item.code dans l'ancien projet). */
  canonicalActionId(ref: string): string {
    const action = this.getActionById(ref);
    return action ? appActionId(action) : ref.trim();
  }

  getActionById(id: string): AppAction | undefined {
    const normalized = id.trim().toUpperCase();
    return this.actions().find(
      (a) =>
        a.id === id ||
        appActionId(a).toUpperCase() === normalized ||
        a.code.trim().toUpperCase() === normalized,
    );
  }

  getApplicationById(id: string): Application | undefined {
    return this.applications().find((a) => a.id === id);
  }

  getSpecialtyById(id: string): Specialty | undefined {
    return this.specialties().find((s) => s.id === id);
  }

  /** Charge une spécialité depuis l'API (ou le cache local hors connexion). */
  loadSpecialtyById(id: string): Observable<Specialty | null> {
    if (!this.auth.isAuthenticated()) {
      return of(this.getSpecialtyById(id) ?? null);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return of(this.getSpecialtyById(id) ?? null);
    }
    return this.specialitesApi.getById(apiId).pipe(
      map((resp) => {
        const item = extractApiItem(resp);
        return item ? mapApiSpecialty(item) : (this.getSpecialtyById(id) ?? null);
      }),
      catchError(() => of(this.getSpecialtyById(id) ?? null)),
    );
  }

  /** Charge une application depuis l'API (ou le cache local hors connexion). */
  loadApplicationById(id: string): Observable<Application | null> {
    if (!this.auth.isAuthenticated()) {
      return of(this.getApplicationById(id) ?? null);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return of(this.getApplicationById(id) ?? null);
    }
    return this.applicationsApi.getById(apiId).pipe(
      map((resp) => {
        const item = extractApiItem(resp);
        return item ? mapApiApplication(item) : (this.getApplicationById(id) ?? null);
      }),
      catchError(() => of(this.getApplicationById(id) ?? null)),
    );
  }

  /** Charge un jalon depuis l'API (ou le cache local hors connexion). */
  loadJalonById(id: string): Observable<Jalon | null> {
    if (!this.auth.isAuthenticated()) {
      return of(this.getJalonById(id) ?? null);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return of(this.getJalonById(id) ?? null);
    }
    return this.jalonsApi.getById(apiId).pipe(
      map((resp) => {
        const item = extractApiItem(resp);
        if (!item) {
          return this.getJalonById(id) ?? null;
        }
        return mapApiJalon(item);
      }),
      catchError(() => of(this.getJalonById(id) ?? null)),
    );
  }

  getJalonChildLabels(parentId: string): string[] {
    return this.jalons()
      .filter((j) => j.parentId === parentId)
      .map((j) => j.label);
  }

  /** Charge une entité depuis l'API (ou le cache local hors connexion). */
  loadEntityById(id: string): Observable<Entity | null> {
    if (!this.auth.isAuthenticated()) {
      return of(this.getEntityById(id) ?? null);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return of(this.getEntityById(id) ?? null);
    }
    return this.entitesApi.getById(apiId).pipe(
      map((resp) => {
        const item = extractApiItem(resp);
        if (!item) {
          return this.getEntityById(id) ?? null;
        }
        const flat = mapApiEntityFlat(item);
        const cached = this.getEntityById(id);
        return {
          ...flat,
          children: cached?.children,
        };
      }),
      catchError(() => of(this.getEntityById(id) ?? null)),
    );
  }

  getEntityById(id: string): Entity | undefined {
    const find = (items: Entity[]): Entity | undefined => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const res = find(item.children);
          if (res) return res;
        }
      }
      return undefined;
    };
    return find(this.entities());
  }

  getEntityLabel(id: string): string {
    return this.getEntityById(id)?.name ?? id;
  }

  saveMenus(items: MenuItem[]) {
    this.menus.set([...items]);
    this.logSettings('UPDATE', 'Arborescence des menus enregistrée');
  }

  addMenu(item: MenuItem) {
    this.menus.update((m) => appendRootMenu(m, item));
    this.logSettings('CREATE', `Menu créé : ${item.label}`);
  }

  addRootMenu(item: MenuItem) {
    this.addMenu(item);
  }

  addChildMenu(parentId: string, item: MenuItem) {
    this.menus.update((m) => insertChildMenu(m, parentId, item));
    this.logSettings('CREATE', `Sous-menu créé dans ${parentId} : ${item.label}`);
  }

  updateMenuItem(item: MenuItem) {
    this.menus.update((m) => replaceMenuById(m, item));
    this.logSettings('UPDATE', `Menu modifié : ${item.label}`);
  }

  deleteMenuItem(id: string): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      this.deleteMenuItemLocal(id);
      return of(undefined);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return throwError(() => new Error('Identifiant de menu invalide pour la suppression.'));
    }
    return this.menusApi.delete(apiId).pipe(switchMap(() => this.loadFromApi()));
  }

  private deleteMenuItemLocal(id: string): void {
    const node = this.getMenuById(id);
    this.menus.update((m) => removeMenuById(m, id));
    this.habilitation.update((h) => {
      const next = { ...h };
      for (const rid of collectMenuIds(node ? [node] : [])) {
        delete next[rid];
      }
      return next;
    });
    this.profiles.update((profiles) =>
      profiles.map((p) => ({
        ...p,
        visibleMenuIds: p.visibleMenuIds.filter((mid) => mid !== id),
      })),
    );
    this.logSettings('DELETE', `Menu supprimé : ${node?.label ?? id}`);
  }

  addAction(action: AppAction) {
    this.actions.update((list) => [...list, action]);
    this.habilitation.update((h) => {
      const next = { ...h };
      for (const mid of Object.keys(next)) {
        next[mid] = [...next[mid], appActionId(action)];
      }
      return next;
    });
    this.logSettings('CREATE', `Action créée : ${action.label}`);
  }

  updateAction(action: AppAction) {
    this.actions.update((list) => list.map((x) => (x.id === action.id ? action : x)));
    this.logSettings('UPDATE', `Action modifiée : ${action.label}`);
  }

  deleteAction(actionId: string): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      this.deleteActionLocal(actionId);
      return of(undefined);
    }
    const action = this.getActionById(actionId);
    if (!action) {
      return throwError(() => new Error('Action introuvable pour la suppression.'));
    }
    return this.deleteActionViaApi(action).pipe(switchMap(() => this.loadFromApi()));
  }

  private deleteActionLocal(actionId: string): void {
    this.actions.update((list) => list.filter((x) => x.id !== actionId));
    this.habilitation.update((h) => {
      const next = { ...h };
      for (const mid of Object.keys(next)) {
        next[mid] = next[mid].filter((id) => id !== actionId);
      }
      return next;
    });
    this.profiles.update((profiles) =>
      profiles.map((p) => {
        const nextAllowed = { ...p.allowedActionsByMenu };
        for (const mid of Object.keys(nextAllowed)) {
          nextAllowed[mid] = nextAllowed[mid].filter((aid) => aid !== actionId);
        }
        return { ...p, allowedActionsByMenu: nextAllowed };
      }),
    );
    this.logSettings('DELETE', `Action supprimée (${actionId})`);
  }

  updateMenuHabilitation(menuId: string, actionIds: string[]) {
    this.habilitation.update((h) => ({ ...h, [menuId]: [...actionIds] }));
    this.logSettings('UPDATE', `Habilitations du menu ${menuId} mises à jour`);
  }

  setMenuHabilitation(menuId: string, actionIds: string[]) {
    this.updateMenuHabilitation(menuId, actionIds);
    const byActionId = new Map(
      this.actions().map((a) => [appActionId(a).toUpperCase(), a]),
    );
    const assigned = actionIds.map((ref) => {
      const action = byActionId.get(ref.trim().toUpperCase());
      const actionId = action ? appActionId(action) : ref;
      return { actionId, label: actionId, icon: action?.icon };
    });
    this.menuAssignedActions.update((current) => ({ ...current, [menuId]: assigned }));
  }

  saveProfile(profile: AuthorizationProfile) {
    const existed = !!this.getProfile(profile.id);
    this.profiles.update((list) => {
      const idx = list.findIndex((p) => p.id === profile.id);
      if (idx > -1) {
        const next = [...list];
        next[idx] = profile;
        return next;
      }
      return [...list, profile];
    });
    this.logSettings(
      existed ? 'UPDATE' : 'CREATE',
      `Profil d'autorisation ${existed ? 'modifié' : 'créé'} : ${profile.label}`,
    );
  }

  /** Charge un profil depuis l'API (ou le cache local hors connexion). */
  loadProfileById(id: string): Observable<AuthorizationProfile | null> {
    if (!this.auth.isAuthenticated()) {
      return of(this.getProfile(id) ?? null);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return of(this.getProfile(id) ?? null);
    }
    return this.profilsApi.getById(apiId).pipe(
      map((resp) => {
        const item = extractApiItem(resp);
        if (!item) {
          return this.getProfile(id) ?? null;
        }
        return mapApiProfile(item);
      }),
      catchError(() => of(this.getProfile(id) ?? null)),
    );
  }

  persistProfile(profile: AuthorizationProfile, isCreate: boolean): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      const saved: AuthorizationProfile = {
        ...profile,
        id: profile.id || this.generateId(),
      };
      this.saveProfile(saved);
      return of(undefined);
    }

    const payload = profileToApiPayload(profile);
    const apiId = Number(profile.id);
    const request$ = isCreate
      ? this.profilsApi.create(payload)
      : this.profilsApi.update(apiId, payload);

    return request$.pipe(switchMap(() => this.loadFromApi()));
  }

  deleteProfile(id: string): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      this.deleteProfileLocal(id);
      return of(undefined);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return throwError(() => new Error('Identifiant de profil invalide pour la suppression.'));
    }
    return this.profilsApi.delete(apiId).pipe(switchMap(() => this.loadFromApi()));
  }

  private deleteProfileLocal(id: string): void {
    const prev = this.getProfile(id);
    if (!prev) return;
    this.profiles.update((p) => p.filter((x) => x.id !== id));
    this.users.update((u) =>
      u.map((user) => (user.profileId === id ? { ...user, profileId: '' } : user)),
    );
    this.logSettings('DELETE', `Profil d'autorisation supprimé (${id})`);
  }

  addUser(user: User) {
    this.users.update((u) => [...u, user]);
    this.logSettings('CREATE', `Utilisateur créé : ${user.name}`);
  }

  updateUser(user: User) {
    this.users.update((u) => u.map((x) => (x.id === user.id ? user : x)));
    this.logSettings('UPDATE', `Utilisateur modifié : ${user.name}`);
  }

  deleteUser(id: string): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      this.deleteUserLocal(id);
      return of(undefined);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return throwError(() => new Error('Identifiant de ressource invalide pour la suppression.'));
    }
    return this.ressourcesApi.delete(apiId).pipe(switchMap(() => this.loadFromApi()));
  }

  private deleteUserLocal(id: string): void {
    const prev = this.users().find((x) => x.id === id);
    this.users.update((u) => u.filter((x) => x.id !== id));
    this.logSettings('DELETE', `Utilisateur supprimé : ${prev?.name ?? id}`);
  }

  getUserById(id: string): User | undefined {
    return this.users().find((u) => u.id === id);
  }

  loadUserById(id: string): Observable<User | null> {
    if (!this.auth.isAuthenticated()) {
      return of(this.getUserById(id) ?? null);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return of(this.getUserById(id) ?? null);
    }
    return this.ressourcesApi.getById(apiId).pipe(
      map((resp) => {
        const item = extractApiItem(resp);
        return item ? mapApiUser(item) : (this.getUserById(id) ?? null);
      }),
      catchError(() => of(this.getUserById(id) ?? null)),
    );
  }

  persistUser(user: User, isCreate: boolean): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      const saved: User = {
        ...user,
        id: user.id || this.generateId(),
      };
      if (isCreate) {
        this.addUser(saved);
      } else {
        this.updateUser(saved);
      }
      return of(undefined);
    }

    const payload = userToApiPayload(user);
    const request$ = isCreate
      ? this.ressourcesApi.create(payload as any)
      : this.ressourcesApi.update(Number(user.id), payload as any);

    return request$.pipe(switchMap(() => this.loadFromApi()));
  }

  addEntity(entity: Entity) {
    this.entities.update((e) => [...e, entity]);
    this.logSettings('CREATE', `Entité créée : ${entity.name}`);
  }

  addRootEntity(entity: Omit<Entity, 'parentId'>) {
    this.entities.update((list) => [...list, { ...entity, parentId: undefined } as Entity]);
    this.logSettings('CREATE', `Entité racine créée : ${entity.name}`);
  }

  addChildEntity(parentId: string, entity: Entity) {
    this.entities.update((list) => insertChildEntity(list, parentId, entity));
    this.logSettings('CREATE', `Entité enfant créée : ${entity.name}`);
  }

  updateEntity(entity: Entity) {
    this.entities.update((list) => replaceEntityById(list, entity));
    this.logSettings('UPDATE', `Entité modifiée : ${entity.name}`);
  }

  persistAction(action: AppAction, isCreate: boolean): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      const saved: AppAction = {
        ...action,
        id: action.id || this.generateId(),
      };
      if (isCreate) {
        this.addAction(saved);
      } else {
        this.updateAction(saved);
      }
      return of(undefined);
    }

    const payload = {
      code: action.code,
      libelle: action.label,
      icone: action.icon,
      isActive: action.active,
    };

    const request$ = isCreate
      ? this.actionsApi.create(payload)
      : this.updateActionViaApi(action, payload);

    return request$.pipe(switchMap(() => this.loadFromApi()));
  }

  persistMenu(
    item: MenuItem,
    options: { isCreate: boolean; parentId: string | null; actionIds: string[] },
  ): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      const saved: MenuItem = {
        ...item,
        id: item.id || this.nextMenuId(),
      };
      if (options.isCreate) {
        if (options.parentId) {
          this.addChildMenu(options.parentId, saved);
        } else {
          this.addRootMenu(saved);
        }
      } else {
        this.updateMenuItem(saved);
      }
      const resolvedActionIds = this.resolveActionIdsForApi(options.actionIds);
      this.setMenuHabilitation(saved.id, resolvedActionIds);
      return of(undefined);
    }

    let menuParentId: number | undefined;
    if (options.parentId != null && options.parentId !== '') {
      const parsed = Number(options.parentId);
      menuParentId = Number.isNaN(parsed) ? undefined : parsed;
    }

    const actionIds = this.resolveActionIdsForApi(options.actionIds);
    const payload = {
      code: item.code || '',
      libelle: item.label,
      icone: item.icon || '',
      lien: !item.route || item.route === '/' ? '' : item.route,
      menuId: menuParentId,
      isActive: item.active,
      actions: actionIds,
    };

    const request$ = options.isCreate
      ? this.menusApi.create(payload)
      : this.menusApi.update(Number(item.id), payload);

    return request$.pipe(
      switchMap((resp) => {
        const menuId = options.isCreate
          ? String(extractApiItem(resp)?.id ?? '')
          : item.id;
        if (menuId) {
          this.mergeMenuAssignedActions(
            menuId,
            actionIds.map((actionId) => ({ actionId, label: actionId })),
          );
        }
        return this.loadFromApi().pipe(catchError(() => of(undefined)));
      }),
    );
  }

  /** Convertit les clés sélectionnées en actionId métier attendus par l'API. */
  resolveActionIdsForApi(keys: string[]): string[] {
    const catalog = this.actions();
    return [
      ...new Set(
        keys.map((key) => {
          const normalized = key.trim().toUpperCase();
          const action = catalog.find(
            (a) => appActionId(a).toUpperCase() === normalized,
          );
          return action ? appActionId(action) : key.trim();
        }),
      ),
    ];
  }

  persistSpecialty(specialty: Specialty, isCreate: boolean): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      const saved: Specialty = {
        ...specialty,
        id: specialty.id || this.generateId(),
      };
      if (isCreate) {
        this.addSpecialty(saved);
      } else {
        this.updateSpecialty(saved);
      }
      return of(undefined);
    }

    const payload = {
      code: specialty.code || '',
      libelle: specialty.label,
      description: specialty.label,
    };

    const request$ = isCreate
      ? this.specialitesApi.create(payload)
      : this.specialitesApi.update(Number(specialty.id), payload);

    return request$.pipe(switchMap(() => this.loadFromApi()));
  }

  persistEntity(entity: Entity, isCreate: boolean): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      const saved: Entity = {
        ...entity,
        id: entity.id || this.generateId(),
      };
      if (isCreate) {
        if (saved.parentId) {
          this.addChildEntity(saved.parentId, saved);
        } else {
          this.addRootEntity(saved);
        }
      } else {
        this.updateEntity(saved);
      }
      return of(undefined);
    }

    const payload: Record<string, unknown> = {
      code: entity.code || '',
      libelle: entity.name,
      active: entity.active,
      entiteParentId: entity.parentId ? Number(entity.parentId) : null,
    };

    const request$ = isCreate
      ? this.entitesApi.create(payload as any)
      : this.entitesApi.update(Number(entity.id), payload as any);

    return request$.pipe(switchMap(() => this.loadFromApi()));
  }

  persistApplication(application: Application, isCreate: boolean): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      const saved: Application = {
        ...application,
        id: application.id || this.generateId(),
      };
      if (isCreate) {
        this.addApplication(saved);
      } else {
        this.updateApplication(saved);
      }
      return of(undefined);
    }

    const payload = {
      code: application.code,
      libelle: application.label,
      ...(application.description ? { description: application.description } : {}),
    };

    const request$ = isCreate
      ? this.applicationsApi.create(payload)
      : this.applicationsApi.update(Number(application.id), payload);

    return request$.pipe(switchMap(() => this.loadFromApi()));
  }

  persistJalon(jalon: Jalon, isCreate: boolean): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      const saved: Jalon = {
        ...jalon,
        id: jalon.id || this.generateId(),
      };
      if (isCreate) {
        this.addJalon(saved);
      } else {
        this.updateJalon(saved);
      }
      return of(undefined);
    }

    const payload: Record<string, unknown> = {
      code: jalon.code,
      libelle: jalon.label,
      jalonParentId: jalon.parentId ? Number(jalon.parentId) : undefined,
      applications: (jalon.applicationIds ?? [])
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id)),
    };

    const request$ = isCreate
      ? this.jalonsApi.create(payload as any)
      : this.jalonsApi.update(Number(jalon.id), payload as any);

    return request$.pipe(switchMap(() => this.loadFromApi()));
  }

  saveEntity(entity: Entity): Observable<void> {
    const isEdit = this.entities().some((e) => e.id === entity.id);
    return this.persistEntity(entity, !isEdit);
  }

  private updateActionViaApi(action: AppAction, payload: Record<string, unknown>) {
    const numericId = Number(action.id);
    if (!Number.isNaN(numericId) && String(numericId) === action.id) {
      return this.actionsApi.update(numericId, payload as any);
    }
    return this.actionsApi.updateByCode(action.code, payload as any);
  }

  private deleteActionViaApi(action: AppAction) {
    const numericId = Number(action.id);
    if (!Number.isNaN(numericId) && String(numericId) === action.id) {
      return this.actionsApi.delete(numericId);
    }
    if (action.code) {
      return this.actionsApi.deleteByCode(action.code);
    }
    return throwError(() => new Error('Identifiant d\'action invalide pour la suppression.'));
  }

  private enrichFlatMenusFromApi(flatMenus: FlatMenu[]): Observable<FlatMenu[]> {
    if (!flatMenus.length) {
      return of(flatMenus);
    }
    const byId = new Map(flatMenus.map((m) => [m.id, { ...m }]));
    return forkJoin(
      flatMenus.map((menu) =>
        this.menusApi.getById(Number(menu.id)).pipe(
          catchError(() => of(null)),
          map((resp) => ({ id: menu.id, detail: extractApiItem(resp) })),
        ),
      ),
    ).pipe(
      map((results) => {
        for (const { id, detail } of results) {
          if (!detail) {
            continue;
          }
          const current = byId.get(id);
          if (current) {
            current.assignedActions = extractMenuAssignedActions(detail);
            byId.set(id, current);
          }
        }
        return flatMenus.map((m) => byId.get(m.id) ?? m);
      }),
    );
  }

  private mergeMenuAssignedActions(menuId: string, assigned: MenuAssignedAction[]): void {
    this.menuAssignedActions.update((current) => ({ ...current, [menuId]: [...assigned] }));
    const actionIds = assigned.map((action) => action.actionId);
    this.habilitation.update((hab) => ({ ...hab, [menuId]: actionIds }));
  }

  private applyMenuAssignedActionsFromFlat(flat: FlatMenu[]): void {
    this.menuAssignedActions.update((current) => {
      const next = { ...current };
      for (const menu of flat) {
        next[menu.id] = [...(menu.assignedActions ?? [])];
      }
      return next;
    });
  }

  private applyMenuAssignedActionsFromHabilitation(): void {
    const byActionId = new Map(
      this.actions().map((a) => [appActionId(a).toUpperCase(), a]),
    );
    const map: Record<string, MenuAssignedAction[]> = {};
    for (const [menuId, ids] of Object.entries(this.habilitation())) {
      map[menuId] = ids.map((ref) => {
        const action = byActionId.get(ref.trim().toUpperCase());
        const actionId = action ? appActionId(action) : ref;
        return { actionId, label: actionId, icon: action?.icon };
      });
    }
    this.menuAssignedActions.set(map);
  }

  deleteEntity(id: string): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      this.deleteEntityLocal(id);
      return of(undefined);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return throwError(() => new Error('Identifiant d\'entité invalide pour la suppression.'));
    }
    return this.entitesApi.delete(apiId).pipe(switchMap(() => this.loadFromApi()));
  }

  private deleteEntityLocal(id: string): void {
    this.entities.update((list) => removeEntityById(list, id));
    this.users.update((u) =>
      u.map((user) => (user.entityId === id ? { ...user, entityId: '' } : user)),
    );
    this.logSettings('DELETE', `Entité supprimée (${id})`);
  }

  addSpecialty(specialty: Specialty) {
    this.specialties.update((list) => [...list, specialty]);
    this.logSettings('CREATE', `Spécialité créée : ${specialty.label}`);
  }

  updateSpecialty(specialty: Specialty) {
    this.specialties.update((list) => list.map((s) => (s.id === specialty.id ? specialty : s)));
    this.logSettings('UPDATE', `Spécialité modifiée : ${specialty.label}`);
  }

  deleteSpecialty(id: string): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      this.deleteSpecialtyLocal(id);
      return of(undefined);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return throwError(() => new Error('Identifiant de spécialité invalide pour la suppression.'));
    }
    return this.specialitesApi.delete(apiId).pipe(switchMap(() => this.loadFromApi()));
  }

  private deleteSpecialtyLocal(id: string): void {
    this.specialties.update((list) => list.filter((s) => s.id !== id));
    this.users.update((u) =>
      u.map((user) => (user.specialtyId === id ? { ...user, specialtyId: '' } : user)),
    );
    this.logSettings('DELETE', `Spécialité supprimée (${id})`);
  }

  addApplication(application: Application) {
    this.applications.update((list) => [...list, application]);
    this.logSettings('CREATE', `Application créée : ${application.label}`);
  }

  updateApplication(application: Application) {
    this.applications.update((list) =>
      list.map((a) => (a.id === application.id ? application : a)),
    );
    this.logSettings('UPDATE', `Application modifiée : ${application.label}`);
  }

  deleteApplication(id: string): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      this.deleteApplicationLocal(id);
      return of(undefined);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return throwError(() => new Error('Identifiant d\'application invalide pour la suppression.'));
    }
    return this.applicationsApi.delete(apiId).pipe(switchMap(() => this.loadFromApi()));
  }

  private deleteApplicationLocal(id: string): void {
    this.applications.update((list) => list.filter((a) => a.id !== id));
    this.logSettings('DELETE', `Application supprimée (${id})`);
  }

  addJalon(jalon: Jalon) {
    this.jalons.update((list) => [...list, jalon]);
    this.logSettings('CREATE', `Jalon créé : ${jalon.label}`);
  }

  updateJalon(jalon: Jalon) {
    this.jalons.update((list) => list.map((j) => (j.id === jalon.id ? jalon : j)));
    this.logSettings('UPDATE', `Jalon modifié : ${jalon.label}`);
  }

  deleteJalon(id: string): Observable<void> {
    if (!this.auth.isAuthenticated()) {
      this.deleteJalonLocal(id);
      return of(undefined);
    }
    const apiId = Number(id);
    if (Number.isNaN(apiId)) {
      return throwError(() => new Error('Identifiant de jalon invalide pour la suppression.'));
    }
    return this.jalonsApi.delete(apiId).pipe(switchMap(() => this.loadFromApi()));
  }

  private deleteJalonLocal(id: string): void {
    this.jalons.update((list) => list.filter((j) => j.id !== id));
    this.logSettings('DELETE', `Jalon supprimé (${id})`);
  }

  private logSettings(action: 'CREATE' | 'UPDATE' | 'DELETE', details: string) {
    this.auditTrail.logAction({
      action,
      tableName: 'PARAMETRAGE',
      newValues: details,
      ressourceId: this.auth.currentUser()?.id ?? '-',
      responsableNom: this.auth.currentUser()?.name ?? 'Invité',
    });
  }

  getSpecialtyLabel(id: string): string {
    return this.specialties().find((s) => s.id === id)?.label ?? id;
  }

  getJalonById(id: string): Jalon | undefined {
    return this.jalons().find((j) => j.id === id);
  }
}

function insertChildEntity(list: Entity[], parentId: string, child: Entity): Entity[] {
  return list.map((it) => {
    if (it.id === parentId) {
      return { ...it, children: [...(it.children ?? []), child] };
    }
    if (it.children?.length) {
      return { ...it, children: insertChildEntity(it.children, parentId, child) };
    }
    return it;
  });
}

function removeEntityById(items: Entity[], id: string): Entity[] {
  return items
    .filter((it) => it.id !== id)
    .map((it) => ({
      ...it,
      children: it.children ? removeEntityById(it.children, id) : undefined,
    }));
}

function replaceEntityById(items: Entity[], updated: Entity): Entity[] {
  return items.map((it) => {
    if (it.id === updated.id) {
      return { ...updated, children: it.children };
    }
    if (it.children) {
      return { ...it, children: replaceEntityById(it.children, updated) };
    }
    return it;
  });
}

interface FlatMenu extends MenuItem {
  parentId?: string;
  assignedActions?: MenuAssignedAction[];
}

function extractActionIdFromApi(action: unknown): string {
  if (typeof action === 'string' || typeof action === 'number') {
    return String(action).trim();
  }
  if (!action || typeof action !== 'object') {
    return '';
  }
  const record = action as {
    actionId?: string | number;
    code?: string;
    id?: string | number | { actionId?: string | number; code?: string };
  };
  if (record.actionId != null) {
    return String(record.actionId).trim();
  }
  if (record.id != null && typeof record.id === 'object') {
    return String(record.id.actionId ?? record.id.code ?? '').trim();
  }
  if (record.code) {
    return String(record.code).trim();
  }
  if (record.id != null) {
    return String(record.id).trim();
  }
  return '';
}

function extractMenuAssignedActions(m: any): MenuAssignedAction[] {
  if (Array.isArray(m.actions)) {
    return m.actions
      .map((action: unknown) => {
        const actionId = extractActionIdFromApi(action);
        if (!actionId) {
          return null;
        }
        const record = typeof action === 'object' && action ? (action as { icone?: string; icon?: string }) : null;
        return {
          actionId,
          label: actionId,
          icon: record?.icone ?? record?.icon,
        } satisfies MenuAssignedAction;
      })
      .filter((action: MenuAssignedAction | null): action is MenuAssignedAction => !!action);
  }
  if (Array.isArray(m.actionIds)) {
    return m.actionIds.map((id: string | number) => {
      const actionId = String(id);
      return { actionId, label: actionId };
    });
  }
  return [];
}

function mapApiMenu(m: any): FlatMenu {
  const lien = String(m.lien ?? m.route ?? '');
  const route = lien ? (lien.startsWith('/') ? lien : `/${lien}`) : '/';
  return {
    id: String(m.id),
    code: m.code ? String(m.code) : undefined,
    label: String(m.libelle ?? m.label ?? ''),
    icon: String(m.icone ?? m.icon ?? 'folder'),
    route,
    active: m.isActive !== false,
    createdAt: extractApiCreatedAt(m),
    assignedActions: extractMenuAssignedActions(m),
    parentId:
      m.menuId != null
        ? String(m.menuId)
        : m.parentId != null
          ? String(m.parentId)
          : m.parent?.id != null
            ? String(m.parent.id)
            : undefined,
    children: Array.isArray(m.children) ? m.children.map(mapApiMenu) : undefined,
  };
}

function flattenFlatMenus(items: FlatMenu[]): FlatMenu[] {
  const out: FlatMenu[] = [];
  for (const item of items) {
    const { children, ...menu } = item;
    out.push(menu);
    if (children?.length) {
      out.push(...flattenFlatMenus(children as FlatMenu[]));
    }
  }
  return out;
}

function buildMenuTree(flat: FlatMenu[]): MenuItem[] {
  const withNestedChildren = flat.filter((m) => m.children?.length);
  if (withNestedChildren.length) {
    return withNestedChildren.map(({ parentId: _p, ...m }) => m);
  }
  const roots: MenuItem[] = [];
  const byId = new Map<string, MenuItem>();
  for (const item of flat) {
    const { parentId, ...menu } = item;
    const node: MenuItem = { ...menu, children: menu.children ?? [] };
    byId.set(node.id, node);
  }
  for (const item of flat) {
    const node = byId.get(item.id)!;
    if (item.parentId && byId.has(item.parentId)) {
      const parent = byId.get(item.parentId)!;
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function mapApiAction(a: any): AppAction {
  const actionId = extractActionIdFromApi(a);
  const id =
    a.id != null && typeof a.id !== 'object' ? String(a.id).trim() : actionId;
  return {
    id,
    actionId,
    code: String(a.code ?? actionId),
    label: String(a.libelle ?? a.label ?? actionId),
    icon: String(a.icone ?? a.icon ?? 'bolt'),
    active: a.isActive !== false,
    createdAt: extractApiCreatedAt(a),
  };
}

function buildHabilitationFromMenus(menus: FlatMenu[]): MenuHabilitation {
  const hab: MenuHabilitation = {};
  for (const m of menus) {
    hab[m.id] = (m.assignedActions ?? []).map((action) => action.actionId);
  }
  return hab;
}

function addProfileMenuActions(
  visibleMenuIds: string[],
  allowedActionsByMenu: Record<string, string[]>,
  menuId: string,
  actionIds: string[],
): void {
  if (!menuId) {
    return;
  }
  if (!visibleMenuIds.includes(menuId)) {
    visibleMenuIds.push(menuId);
  }
  const existing = allowedActionsByMenu[menuId] ?? [];
  allowedActionsByMenu[menuId] = [...new Set([...existing, ...actionIds.filter(Boolean)])];
}

function mapApiProfile(p: any): AuthorizationProfile {
  const visibleMenuIds: string[] = [];
  const allowedActionsByMenu: Record<string, string[]> = {};
  const requests = p.permissionRequests ?? p.profilMenuActions ?? [];
  for (const pr of requests) {
    const menuId = String(pr.menuId ?? pr.menu?.id ?? '');
    const actionIds = (
      pr.actionIds ??
      pr.actions?.map((a: any) => a.actionId ?? a.id?.actionId ?? a.id ?? a.code) ??
      []
    ).map(String);
    addProfileMenuActions(visibleMenuIds, allowedActionsByMenu, menuId, actionIds);
  }
  if (Array.isArray(p.menus)) {
    for (const item of p.menus) {
      const menuId = String(item.id?.menuId ?? item.menuId ?? '');
      const actionId = String(item.id?.actionId ?? item.actionId ?? '');
      if (menuId && actionId) {
        addProfileMenuActions(visibleMenuIds, allowedActionsByMenu, menuId, [actionId]);
      }
    }
  }
  return {
    id: String(p.id),
    code: p.code ? String(p.code) : undefined,
    label: String(p.libelle ?? p.label ?? p.code ?? ''),
    visibleMenuIds,
    allowedActionsByMenu,
    createdAt: extractApiCreatedAt(p),
  };
}

function profileToApiPayload(profile: AuthorizationProfile) {
  const permissionRequests = profile.visibleMenuIds
    .map((menuId) => {
      const numericMenuId = Number(menuId);
      if (Number.isNaN(numericMenuId)) {
        return null;
      }
      return {
        menuId: numericMenuId,
        actionIds: (profile.allowedActionsByMenu[menuId] ?? []).map(String),
      };
    })
    .filter((pr): pr is { menuId: number; actionIds: string[] } => pr !== null);

  return {
    code: profile.code || '',
    libelle: profile.label,
    permissionRequests,
  };
}

function mapApiUser(r: any): User {
  const firstName = String(r.prenoms ?? r.firstName ?? '').trim();
  const lastName = String(r.nom ?? r.lastName ?? '').trim();
  return {
    id: String(r.id),
    code: r.code ? String(r.code) : undefined,
    name: `${firstName} ${lastName}`.trim() || String(r.email ?? ''),
    firstName,
    lastName,
    email: String(r.email ?? ''),
    profileId: String(r.profil?.id ?? r.profil ?? ''),
    entityId: String(r.entite?.id ?? r.entite ?? ''),
    specialtyId: String(r.specialite?.id ?? r.specialite ?? ''),
    contact: r.contact ? String(r.contact) : undefined,
    createdAt: extractApiCreatedAt(r),
  };
}

function userToApiPayload(user: User): Record<string, unknown> {
  const toApiId = (id: string): number | string => {
    const n = Number(id);
    return Number.isNaN(n) ? id : n;
  };
  const payload: Record<string, unknown> = {
    nom: user.lastName,
    prenoms: user.firstName,
    email: user.email,
  };
  if (user.code) {
    payload['code'] = user.code;
  }
  if (user.contact) {
    payload['contact'] = user.contact;
  }
  if (user.profileId) {
    payload['profil'] = toApiId(user.profileId);
  }
  if (user.entityId) {
    payload['entite'] = toApiId(user.entityId);
  }
  if (user.specialtyId) {
    payload['specialite'] = toApiId(user.specialtyId);
  }
  return payload;
}

function mapApiSpecialty(s: any): Specialty {
  return {
    id: String(s.id),
    code: s.code ? String(s.code) : undefined,
    label: String(s.libelle ?? s.label ?? ''),
    icon: String(s.icone ?? s.icon ?? 'psychology'),
    active: s.active !== false && s.isActive !== false,
    createdAt: extractApiCreatedAt(s),
  };
}

function mapApiApplication(a: any): Application {
  return {
    id: String(a.id),
    code: String(a.code ?? a.id),
    label: String(a.libelle ?? a.label ?? ''),
    description: a.description ? String(a.description) : undefined,
    active: a.active !== false && a.isActive !== false,
    createdAt: extractApiCreatedAt(a),
    createdBy: extractApiCreatedBy(a),
  };
}

function resolveJalonParentRef(j: Record<string, unknown>): string | undefined {
  if (j['jalonParentId'] != null) {
    return String(j['jalonParentId']);
  }
  if (j['parentId'] != null) {
    return String(j['parentId']);
  }
  if (j['jalonId'] != null) {
    return String(j['jalonId']);
  }
  const parent = j['parent'];
  if (parent && typeof parent === 'object' && parent !== null && 'id' in parent) {
    return String((parent as { id: unknown }).id);
  }
  return undefined;
}

function mapApiJalon(j: any): Jalon {
  const rawApps = j.applications ?? j.applicationIds ?? [];
  const applicationIds = Array.isArray(rawApps)
    ? rawApps
        .map((a: unknown) =>
          typeof a === 'object' && a !== null && 'id' in (a as object)
            ? String((a as { id: unknown }).id)
            : String(a),
        )
        .filter((id: string) => id && id !== 'undefined')
    : [];

  return {
    id: String(j.id),
    code: String(j.code ?? j.id),
    label: String(j.libelle ?? j.label ?? ''),
    parentId: resolveJalonParentRef(j),
    applicationIds,
    createdAt: extractApiCreatedAt(j),
    createdBy: extractApiCreatedBy(j),
  };
}

function resolveEntityParentRef(e: Record<string, unknown>): string | undefined {
  if (e['entiteParentId'] != null) {
    return String(e['entiteParentId']);
  }
  if (e['parentId'] != null) {
    return String(e['parentId']);
  }
  if (e['entiteId'] != null) {
    return String(e['entiteId']);
  }
  const parent = e['parent'];
  if (parent && typeof parent === 'object' && parent !== null && 'id' in parent) {
    return String((parent as { id: unknown }).id);
  }
  return undefined;
}

function mapApiEntityFlat(e: Record<string, unknown>): Entity {
  return {
    id: String(e['id']),
    code: e['code'] ? String(e['code']) : undefined,
    name: String(e['libelle'] ?? e['nom'] ?? e['name'] ?? ''),
    icon: String(e['icone'] ?? e['icon'] ?? 'business'),
    active: e['active'] !== false && e['isActive'] !== false,
    parentId: resolveEntityParentRef(e),
    createdAt: extractApiCreatedAt(e),
  };
}

function buildEntityTree(flat: any[]): Entity[] {
  type EntityNode = Entity & { parentRef?: string };
  const nodes: EntityNode[] = flat.map((e) => {
    const mapped = mapApiEntityFlat(e);
    return { ...mapped, parentRef: mapped.parentId };
  });
  const byId = new Map<string, EntityNode & { children: Entity[] }>();
  for (const n of nodes) {
    byId.set(n.id, { ...n, children: [] });
  }
  const roots: (EntityNode & { children: Entity[] })[] = [];
  for (const node of byId.values()) {
    if (node.parentRef && byId.has(node.parentRef)) {
      byId.get(node.parentRef)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const strip = (n: EntityNode & { children?: Entity[] }): Entity => ({
    id: n.id,
    code: n.code,
    name: n.name,
    icon: n.icon,
    active: n.active,
    parentId: n.parentRef,
    createdAt: n.createdAt,
    children: n.children?.length ? n.children.map(strip) : undefined,
  });
  return roots.map(strip);
}
