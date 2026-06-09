import { Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, Subscription } from 'rxjs';
import { PermissionService } from '../../core/services/permission.service';
import { LayoutService } from '../../core/services/layout.service';
import { AuthService } from '../../features/auth/services/auth.service';
import { normalizeMenuRoute, menuLienGrantsPath, APP_ROUTES } from '../../utils/app-routes';
import { MenuItem } from '../../models/menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule, MatExpansionModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  private layoutService = inject(LayoutService);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private router = inject(Router);

  // Quand la sidebar est utilisée comme tiroir mobile, elle est toujours
  // affichée en pleine largeur (jamais repliée).
  mobile = input<boolean>(false);

  /**
   * Item « Mon profil » toujours affiché : l'édition de ses propres
   * informations ne dépend pas des habilitations.
   */
  private readonly profileMenuItem: MenuItem = {
    id: 'mon-profil',
    label: 'Mon profil',
    icon: 'person',
    route: APP_ROUTES.monProfil,
    active: true,
  };

  currentUser = this.authService.currentUser;

  profileName = computed(() => {
    const profil = this.authService.userInfos()?.profil;
    const label =
      (typeof profil === 'object' ? profil?.libelle ?? profil?.code : undefined) ??
      this.authService.currentUser()?.profileId ??
      '';
    return String(label).trim() || 'Profil';
  });

  profileInitials = computed(() => {
    const name = this.profileName();
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('');
    return (initials || name.charAt(0) || '?').toUpperCase();
  });

  menus = computed<MenuItem[]>(() => {
    const dynamicMenus = this.permissionService.visibleMenus();
    const profileRoute = normalizeMenuRoute(this.profileMenuItem.route);
    const alreadyPresent = dynamicMenus.some(
      (item) => normalizeMenuRoute(item.route) === profileRoute,
    );
    return alreadyPresent ? dynamicMenus : [...dynamicMenus, this.profileMenuItem];
  });
  expandedMenus = signal<string[]>([]);
  collapsed = computed(() => (this.mobile() ? false : this.layoutService.sidebarCollapsed()));

  private routerSubscription?: Subscription;

  ngOnInit(): void {
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.permissionService.syncCurrentMenuFromRoute();
        if (this.mobile()) {
          this.layoutService.closeMobileSidebar();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  onMenuClick(route: string): void {
    if (this.mobile()) {
      this.layoutService.closeMobileSidebar();
    }

    if (!route || route === '#') {
      return;
    }

    const normalizedRoute = normalizeMenuRoute(route);
    const profilMenuActions = this.authService.userInfos()?.profil?.profilMenuActions;
    if (!Array.isArray(profilMenuActions)) {
      return;
    }

    const matches = profilMenuActions
      .filter((pma: { menu?: { lien?: string } }) =>
        menuLienGrantsPath(String(pma?.menu?.lien ?? ''), normalizedRoute),
      )
      .sort(
        (a: { menu: { lien: string } }, b: { menu: { lien: string } }) =>
          normalizeMenuRoute(b.menu.lien).length - normalizeMenuRoute(a.menu.lien).length,
      );

    const menuDetails = matches[0];

    if (menuDetails?.menu) {
      localStorage.setItem('currentMenu', JSON.stringify(menuDetails.menu));
    }
  }

  toggleExpand(id: string) {
    if (this.collapsed()) {
      this.layoutService.setSidebarCollapsed(false);
      this.expandedMenus.set([id]);
      return;
    }
    this.expandedMenus.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  isExpanded(id: string): boolean {
    return !this.collapsed() && this.expandedMenus().includes(id);
  }

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  closeMobile() {
    this.layoutService.closeMobileSidebar();
  }
}
