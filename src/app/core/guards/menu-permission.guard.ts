import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AuthStateService } from '../../features/auth/services/auth-state.service';
import { getLandingRoute } from '../../utils/app-routes';

/** Bloque l'accès aux routes non présentes dans profilMenuActions (comme l'ancien projet côté sidebar). */
export const MenuPermissionGuard: CanActivateChildFn = (_route, state) => {
  const permissionService = inject(PermissionService);
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const path = state.url.split('?')[0] ?? '/';
  if (permissionService.canAccessRoute(path)) {
    return true;
  }

  const userInfos = authState.userInfos();
  return router.parseUrl(getLandingRoute(userInfos));
};
