import { Injectable, computed, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MenuItem } from '../../models/menu';
import { API_ACTIONS } from '../../models/api-permissions';
import { AuthService } from '../../features/auth/services/auth.service';
import { HasPermissionService } from './hasPermission.service';
import { APP_ROUTES, normalizeMenuRoute, menuLienGrantsPath, isParametragePath } from '../../utils/app-routes';

/** Routes toujours accessibles à un utilisateur connecté. */
const ALWAYS_ALLOWED_ROUTES = new Set([
  APP_ROUTES.bienvenue,
  APP_ROUTES.monProfil,
  '/',
]);

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private authService = inject(AuthService);
  private hasPermissionService = inject(HasPermissionService);
  private router = inject(Router);

  private navTick = signal(0);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.syncCurrentMenuFromRoute();
        this.navTick.update((n) => n + 1);
      });
  }

  currentPath = computed(() => {
    this.navTick();
    const url = this.router.url.split('?')[0] ?? '/';
    return url || '/';
  });

  currentMenuCode = computed(() => {
    this.navTick();
    return this.resolveCurrentMenuCode();
  });

  /** Menus sidebar — uniquement depuis profilMenuActions (pas de fallback local). */
  visibleMenus = computed(() => this.buildMenusFromProfilActions());

  profilMenuActions = computed(() => {
    this.navTick();
    const userInfos = this.authService.userInfos();
    const items = userInfos?.profil?.profilMenuActions;
    return Array.isArray(items) ? items : [];
  });

  canPerformAction(actionId: string): boolean {
    // Paramétrage : accès complet sur toutes les sous-pages si le menu parent est assigné (comme l'ancien backoffice).
    if (this.isParametragePath() && this.hasParametrageHubAccess()) {
      return true;
    }

    const code = this.currentMenuCode();
    if (!code) {
      return false;
    }
    return this.hasPermissionService.hasPermission(code, actionId);
  }

  /** Menu parent « Paramétrage » assigné au profil. */
  hasParametrageHubAccess(): boolean {
    return this.profilMenuActions().some((pma: { menu?: { lien?: string } }) =>
      normalizeMenuRoute(String(pma?.menu?.lien ?? '')) === APP_ROUTES.parametrages,
    );
  }

  isParametragePath(path?: string): boolean {
    return isParametragePath(path ?? this.currentPath());
  }

  canCreate(): boolean {
    return this.canPerformAction(API_ACTIONS.CREATE);
  }

  canView(): boolean {
    return this.canPerformAction(API_ACTIONS.VIEW);
  }

  canEdit(): boolean {
    return this.canPerformAction(API_ACTIONS.EDIT);
  }

  canDelete(): boolean {
    return this.canPerformAction(API_ACTIONS.DELETE);
  }

  canImport(): boolean {
    return this.canPerformAction(API_ACTIONS.IMPORT);
  }

  canExport(): boolean {
    return this.canPerformAction(API_ACTIONS.EXPORT);
  }

  canDownloadTemplate(): boolean {
    return this.canPerformAction(API_ACTIONS.DOWNLOAD_TEMPLATE);
  }

  /** Vérifie si l'utilisateur a accès à une route (menu assigné dans son profil). */
  canAccessRoute(path: string): boolean {
    const normalizedPath = normalizeMenuRoute(path);

    if (ALWAYS_ALLOWED_ROUTES.has(normalizedPath)) {
      return true;
    }

    const profilMenuActions = this.profilMenuActions();
    if (!profilMenuActions.length) {
      return false;
    }

    // Hub paramétrage : accessible si le menu parent ou au moins un sous-module est assigné.
    if (normalizedPath === APP_ROUTES.parametrages) {
      return profilMenuActions.some((pma: { menu?: { lien?: string } }) => {
        const lien = normalizeMenuRoute(String(pma?.menu?.lien ?? ''));
        return lien === APP_ROUTES.parametrages || lien.startsWith(`${APP_ROUTES.parametrages}/`);
      });
    }

    return profilMenuActions.some((pma: { menu?: { lien?: string } }) =>
      menuLienGrantsPath(String(pma?.menu?.lien ?? ''), normalizedPath),
    );
  }

  syncCurrentMenuFromRoute(): void {
    const menu = this.findMenuForRoute(this.currentPath());
    if (menu) {
      localStorage.setItem('currentMenu', JSON.stringify(menu));
    }
  }

  private resolveCurrentMenuCode(): string | null {
    const stored = this.readStoredMenuCode();
    if (stored) {
      return stored;
    }

    const menu = this.findMenuForRoute(this.currentPath());
    if (menu?.code) {
      localStorage.setItem('currentMenu', JSON.stringify(menu));
      return String(menu.code);
    }

    return null;
  }

  private readStoredMenuCode(): string | null {
    try {
      const menuStr = localStorage.getItem('currentMenu');
      if (!menuStr) {
        return null;
      }

      const menu = JSON.parse(menuStr) as { code?: string; lien?: string };
      const path = normalizeMenuRoute(this.currentPath());
      const menuLien = normalizeMenuRoute(String(menu?.lien ?? ''));

      if (menuLien && menuLienGrantsPath(menuLien, path)) {
        return menu?.code ? String(menu.code) : null;
      }

      return null;
    } catch {
      return null;
    }
  }

  private findMenuForRoute(path: string): { code?: string; lien?: string } | null {
    const profilMenuActions = this.profilMenuActions();
    if (!profilMenuActions.length) {
      return null;
    }

    let bestMenu: { code?: string; lien?: string } | null = null;
    let bestLienLength = -1;

    for (const pma of profilMenuActions) {
      const menu = pma?.menu as { code?: string; lien?: string } | undefined;
      const lien = normalizeMenuRoute(String(menu?.lien ?? ''));
      if (!menu || !menuLienGrantsPath(lien, path)) {
        continue;
      }

      if (lien.length > bestLienLength) {
        bestMenu = menu;
        bestLienLength = lien.length;
      }
    }

    // Sous-page paramétrage : retomber sur le menu parent si aucun sous-menu spécifique.
    if (!bestMenu && isParametragePath(path) && this.hasParametrageHubAccess()) {
      const parent = profilMenuActions.find(
        (pma: { menu?: { lien?: string } }) =>
          normalizeMenuRoute(String(pma?.menu?.lien ?? '')) === APP_ROUTES.parametrages,
      );
      return (parent?.menu as { code?: string; lien?: string }) ?? null;
    }

    return bestMenu;
  }

  private buildMenusFromProfilActions(): MenuItem[] {
    const profilMenuActions = this.profilMenuActions();
    if (!profilMenuActions.length) {
      return [];
    }

    const rootMap = new Map<string | number, any>();
    const childMap = new Map<string | number, any>();

    for (const pma of profilMenuActions) {
      const menu = pma?.menu;
      if (!menu?.id) continue;

      const menuId = menu.id;
      const parentId = menu.parent?.id;

      if (menuId && parentId && menuId === parentId) {
        continue;
      }

      // Aligné sur l'ancien backoffice : parent null/undefined = racine
      if (menu.parent === null || menu.parent === undefined) {
        if (!rootMap.has(menuId)) {
          rootMap.set(menuId, pma);
        }
      } else if (!childMap.has(menuId)) {
        childMap.set(menuId, pma);
      }
    }

    const rootMenus = [...rootMap.values()].sort(
      (a, b) => (a.menu?.id ?? 0) - (b.menu?.id ?? 0),
    );

    const toRoute = (lien: unknown): string => normalizeMenuRoute(String(lien ?? '/'));
    const toMatIcon = (icone: unknown): string => mapMenuIcon(String(icone ?? ''));

    const items: MenuItem[] = [];

    for (const pma of rootMenus) {
      const menu = pma.menu;
      const menuId = String(menu.id);

      const addedSubMenuIds = new Set<string | number>();
      const children = [...childMap.values()]
        .filter((c) => String(c.menu?.parent?.id ?? '') === menuId)
        .filter((c) => {
          const subId = c.menu?.id;
          if (!subId || addedSubMenuIds.has(subId)) {
            return false;
          }
          addedSubMenuIds.add(subId);
          return true;
        })
        .sort((a, b) => (a.menu?.id ?? 0) - (b.menu?.id ?? 0))
        .map(
          (c) =>
            ({
              id: String(c.menu.id),
              label: String(c.menu.libelle ?? c.menu.label ?? ''),
              icon: toMatIcon(c.menu.icone ?? c.menu.icon),
              route: toRoute(c.menu.lien),
              active: c.menu.isActive !== false && c.menu.active !== false,
              code: c.menu.code,
            }) as MenuItem & { code?: string },
        );

      items.push({
        id: menuId,
        label: String(menu.libelle ?? menu.label ?? ''),
        icon: toMatIcon(menu.icone ?? menu.icon),
        route: children.length ? '' : toRoute(menu.lien),
        children: children.length ? children : undefined,
        active: menu.isActive !== false && menu.active !== false,
        code: menu.code,
      } as MenuItem & { code?: string });
    }

    return items;
  }
}

/** Convertit une icône FontAwesome API en Material icon si possible. */
function mapMenuIcon(icone: string): string {
  const value = icone.trim();
  if (!value) {
    return 'folder';
  }
  if (!value.includes('fa-')) {
    return value;
  }

  const faMap: Record<string, string> = {
    'fa-chart-line': 'insights',
    'fa-cog': 'settings',
    'fa-users': 'groups',
    'fa-user': 'person',
    'fa-project-diagram': 'folder_open',
    'fa-shield-alt': 'security',
    'fa-microscope': 'engineering',
    'fa-calendar-alt': 'event_note',
    'fa-history': 'history',
    'fa-tasks': 'task_alt',
    'fa-sitemap': 'account_tree',
    'fa-cubes': 'category',
    'fa-laptop-code': 'computer',
    'fa-flag': 'signpost',
  };

  for (const [fa, mat] of Object.entries(faMap)) {
    if (value.includes(fa)) {
      return mat;
    }
  }

  return 'chevron_right';
}
