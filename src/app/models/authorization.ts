/** Action rattachée à un menu (identifiant API = actionId, utilisé comme nom affiché). */
export interface MenuAssignedAction {
  actionId: string;
  label: string;
  icon?: string;
}

/** Action métier réutilisable (catalogue global). */
export interface AppAction {
  /** Clé technique locale ou id numérique API. */
  id: string;
  /** Identifiant métier (CREER, MODIFIER, …) — utilisé pour menus et profils. */
  actionId: string;
  code: string;
  /** Libellé affiché (ex. « Exporter »). */
  label: string;
  /** Nom de l’icône Material Symbols / Material Icons (ex. `file_download`). */
  icon: string;
  /** Si faux, l’action reste au catalogue mais n’est plus effective pour les droits. */
  active: boolean;
  createdAt?: Date;
}

/** Identifiant métier d'une action (priorité actionId → code → id). */
export function appActionId(action: AppAction): string {
  return (action.actionId || action.code || action.id).trim();
}

/**
 * Habilitation : pour chaque entrée de menu, quelles actions du catalogue sont disponibles sur la page.
 */
export type MenuHabilitation = Record<string, string[]>;

/**
 * Profil : menus visibles + sous-ensemble des actions habilitées par menu.
 */
export interface AuthorizationProfile {
  id: string;
  code?: string;
  label: string;
  /** IDs des entrées de menu visibles (parents et/ou feuilles). */
  visibleMenuIds: string[];
  /** Par menu, IDs des actions autorisées pour ce profil. */
  allowedActionsByMenu: Record<string, string[]>;
  createdAt?: Date;
}
