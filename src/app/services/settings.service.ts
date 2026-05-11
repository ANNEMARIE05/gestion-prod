import { Injectable, signal, computed, inject } from '@angular/core';
import { User, MenuItem } from '../models/menu';
import {
  AppAction,
  AuthorizationProfile,
  MenuHabilitation,
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

  private menus = signal<MenuItem[]>([]);
  private actions = signal<AppAction[]>([]);
  private habilitation = signal<MenuHabilitation>({});

  private profiles = signal<AuthorizationProfile[]>([]);

  private users = signal<User[]>([]);
  private specialties = signal<Specialty[]>([]);
  private entities = signal<Entity[]>([]);
  private applications = signal<Application[]>([]);
  private jalons = signal<Jalon[]>([]);

  constructor() {
    this.loadLocalDefaults();
  }

  /** Données paramétrage + utilisateur démo en mémoire (aucun HTTP). */
  loadLocalDefaults(): void {
    const actions = defaultActions();
    const menus = defaultMenus();
    this.menus.set(menus);
    this.actions.set(actions);
    this.habilitation.set(buildFullHabilitation(menus, actions));
    this.profiles.set(defaultProfiles());
    this.users.set([createDemoUser()]);
    this.specialties.set(defaultSpecialties());
    this.entities.set(defaultEntities());
    this.applications.set(defaultApplications());
    this.jalons.set(defaultJalons());
  }

  /** Alias conservé pour les écrans qui rafraîchissaient l’API. */
  refreshSettings(): void {
    this.loadLocalDefaults();
  }

  allMenus = computed(() => this.menus());
  allActions = computed(() => this.actions());
  allHabilitation = computed(() => this.habilitation());
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

  getActionById(id: string): AppAction | undefined {
    return this.actions().find((a) => a.id === id);
  }

  getApplicationById(id: string): Application | undefined {
    return this.applications().find((a) => a.id === id);
  }

  getSpecialtyById(id: string): Specialty | undefined {
    return this.specialties().find((s) => s.id === id);
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

  deleteMenuItem(id: string) {
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
        next[mid] = [...next[mid], action.id];
      }
      return next;
    });
    this.logSettings('CREATE', `Action créée : ${action.label}`);
  }

  updateAction(action: AppAction) {
    this.actions.update((list) => list.map((x) => (x.id === action.id ? action : x)));
    this.logSettings('UPDATE', `Action modifiée : ${action.label}`);
  }

  deleteAction(actionId: string) {
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

  deleteProfile(id: string) {
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

  deleteUser(id: string) {
    const prev = this.users().find((x) => x.id === id);
    this.users.update((u) => u.filter((x) => x.id !== id));
    this.logSettings('DELETE', `Utilisateur supprimé : ${prev?.name ?? id}`);
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

  persistEntity(entity: Entity, isCreate: boolean) {
    if (isCreate) {
      if (entity.parentId) {
        this.addChildEntity(entity.parentId, entity);
      } else {
        this.addRootEntity(entity);
      }
    } else {
      this.updateEntity(entity);
    }
  }

  saveEntity(entity: Entity) {
    const isEdit = this.entities().some((e) => e.id === entity.id);
    this.persistEntity(entity, !isEdit);
  }

  deleteEntity(id: string) {
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

  deleteSpecialty(id: string) {
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

  deleteApplication(id: string) {
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

  deleteJalon(id: string) {
    this.jalons.update((list) => list.filter((j) => j.id !== id));
    this.logSettings('DELETE', `Jalon supprimé (${id})`);
  }

  private logSettings(action: 'CREATE' | 'UPDATE' | 'DELETE', details: string) {
    this.auditTrail.logAction({
      userId: this.auth.currentUser()?.id ?? '-',
      userName: this.auth.currentUser()?.name ?? 'Invité',
      action,
      module: 'SETTINGS',
      details,
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
