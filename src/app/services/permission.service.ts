import { Injectable, computed, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MenuItem } from '../models/menu';
import { AuthService } from './auth.service';
import { SettingsService } from './settings.service';
import { filterMenusForProfile, findMenuByRoute } from '../utils/menu-tree';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  private navTick = signal(0);

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.navTick.update((n) => n + 1);
    });
  }

  /** Chemin courant pour résoudre le menu actif (sans query). */
  currentPath = computed(() => {
    this.navTick();
    const url = this.router.url.split('?')[0] ?? '/';
    return url || '/';
  });

  visibleMenus = computed(() => {
    const items = this.settingsService.allMenus();
    const user = this.authService.currentUser();
    if (!user) {
      return [];
    }
    const profile = this.settingsService.getProfile(user.profileId);
    if (!profile) {
      return [];
    }
    const visible = new Set(profile.visibleMenuIds);
    return filterMenusForProfile(items, visible);
  });

  /** Menu feuille ou section correspondant à l’URL courante. */
  activeMenu = computed((): MenuItem | null => {
    const items = this.settingsService.allMenus();
    return findMenuByRoute(items, this.currentPath());
  });

  /**
   * Vérifie si l’utilisateur peut exécuter une action (code métier) sur la page courante.
   */
  hasPermission(actionCode: string): boolean {
    const user = this.authService.currentUser();
    if (!user) {
      return false;
    }
    const profile = this.settingsService.getProfile(user.profileId);
    if (!profile) {
      return false;
    }

    const action = this.settingsService.allActions().find((a) => a.code === actionCode);
    if (!action || !action.active) {
      return false;
    }

    const menu = findMenuByRoute(this.settingsService.allMenus(), this.currentPath());
    if (!menu) {
      return false;
    }

    const hab = this.settingsService.allHabilitation()[menu.id] ?? [];
    if (!hab.includes(action.id)) {
      return false;
    }

    const allowed = profile.allowedActionsByMenu[menu.id] ?? [];
    return allowed.includes(action.id);
  }
}
