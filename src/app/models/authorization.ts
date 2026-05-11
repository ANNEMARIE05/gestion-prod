/** Action métier réutilisable (catalogue global). */
export interface AppAction {
  id: string;
  code: string;
  /** Libellé affiché (ex. « Exporter »). */
  label: string;
  /** Nom de l’icône Material Symbols / Material Icons (ex. `file_download`). */
  icon: string;
  /** Si faux, l’action reste au catalogue mais n’est plus effective pour les droits. */
  active: boolean;
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
  label: string;
  /** IDs des entrées de menu visibles (parents et/ou feuilles). */
  visibleMenuIds: string[];
  /** Par menu, IDs des actions autorisées pour ce profil. */
  allowedActionsByMenu: Record<string, string[]>;
}
