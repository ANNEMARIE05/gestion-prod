import { Injectable } from '@angular/core';
import { authStore } from '../../features/auth/services/auth.store';

@Injectable({
  providedIn: 'root',
})
export class HasPermissionService {
  hasPermission(menuCode: string, actionId: string): boolean {
    if (!menuCode || !actionId) {
      return false;
    }

    const userInfos = authStore.getState().userInfos;
    if (!userInfos) {
      return false;
    }

    const profilMenuActions = userInfos?.profil?.profilMenuActions;
    if (!Array.isArray(profilMenuActions)) {
      return false;
    }

    const menuFound = profilMenuActions.find((pma: unknown) => {
      const entry = pma as { menu?: { code?: string; actions?: unknown[] } };
      return entry?.menu?.code === menuCode;
    }) as { menu?: { actions?: unknown[] } } | undefined;

    if (!menuFound?.menu?.actions || !Array.isArray(menuFound.menu.actions)) {
      return false;
    }

    return menuFound.menu.actions.some((action: unknown) =>
      this.actionMatches(action, actionId),
    );
  }

  private actionMatches(action: unknown, actionId: string): boolean {
    const normalized = actionId.toUpperCase();
    const record = action as {
      id?: { actionId?: string; code?: string };
      code?: string;
      libelle?: string;
    };

    const candidates = [
      record?.id?.actionId,
      record?.code,
      record?.id?.code,
      record?.libelle,
    ]
      .filter(Boolean)
      .map((value) => String(value).toUpperCase());

    return candidates.includes(normalized);
  }
}
