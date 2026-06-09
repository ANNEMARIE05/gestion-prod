import { ProductionType } from '../models/production';

/** Chemins alignés sur l'ancien backoffice (menus API, bookmarks, liens internes). */
export const APP_ROUTES = {
  login: '/login',
  home: '/',
  bienvenue: '/bienvenue',
  dashboard: '/dashboard',
  monProfil: '/mon-profil',
  pisteAudit: '/piste-audit',
  parametrages: '/parametrages',

  utilisateurs: {
    profils: '/utilisateurs/profils',
    profilsCreate: '/utilisateurs/profils/create',
    profilsEdit: (id: string | number) => `/utilisateurs/profils/edit/${id}`,
    profilsDetail: (id: string | number) => `/utilisateurs/profils/${id}`,
    ressources: '/utilisateurs/ressources',
    ressourcesCreate: '/utilisateurs/ressources/create',
    ressourcesEdit: (id: string | number) => `/utilisateurs/ressources/edit/${id}`,
    ressourcesDetail: (id: string | number) => `/utilisateurs/ressources/${id}`,
  },

  productions: {
    projets: '/productions/projets',
    projetsCreate: '/productions/projets/create',
    projetsEdit: (id: string | number) => `/productions/projets/edit/${id}`,
    projetsDetail: (id: string | number) => `/productions/projets/${id}`,
    audits: '/productions/audits',
    auditsCreate: '/productions/audits/create',
    auditsEdit: (id: string | number) => `/productions/audits/edit/${id}`,
    auditsDetail: (id: string | number) => `/productions/audits/${id}`,
    ingenierie: '/productions/ingenierie',
    ingenierieCreate: '/productions/ingenierie/create',
    ingenierieEdit: (id: string | number) => `/productions/ingenierie/edit/${id}`,
    ingenierieDetail: (id: string | number) => `/productions/ingenierie/${id}`,
  },

  planifications: {
    projets: '/planifications/projets',
    projetsCreate: '/planifications/projets/create',
    projetsEdit: (id: string | number) => `/planifications/projets/edit/${id}`,
    projetsDetail: (id: string | number) => `/planifications/projets/${id}`,
    audits: '/planifications/audits',
    auditsCreate: '/planifications/audits/nouveau',
    auditsEdit: (id: string | number) => `/planifications/audits/edit/${id}`,
    auditsDetail: (id: string | number) => `/planifications/audits/${id}`,
    ingenierie: '/planifications/ingenierie',
    ingenierieCreate: '/planifications/ingenierie/create',
    ingenierieEdit: (id: string | number) => `/planifications/ingenierie/edit/${id}`,
    ingenierieDetail: (id: string | number) => `/planifications/ingenierie/${id}`,
  },

  parametragesPaths: {
    actions: '/parametrages/actions',
    actionsCreate: '/parametrages/actions/create',
    actionsEdit: (id: string | number) => `/parametrages/actions/edit/${id}`,
    actionsDetail: (id: string | number) => `/parametrages/actions/${id}`,
    menus: '/parametrages/menus',
    menusCreate: '/parametrages/menus/create',
    menusEdit: (id: string | number) => `/parametrages/menus/edit/${id}`,
    menusDetail: (id: string | number) => `/parametrages/menus/${id}`,
    entites: '/parametrages/entites',
    entitesCreate: '/parametrages/entites/create',
    entitesEdit: (id: string | number) => `/parametrages/entites/edit/${id}`,
    entitesDetail: (id: string | number) => `/parametrages/entites/${id}`,
    specialites: '/parametrages/specialites-techniques',
    specialitesCreate: '/parametrages/specialites-techniques/create',
    specialitesEdit: (id: string | number) => `/parametrages/specialites-techniques/edit/${id}`,
    specialitesDetail: (id: string | number) => `/parametrages/specialites-techniques/${id}`,
    applications: '/parametrages/applications',
    applicationsCreate: '/parametrages/applications/create',
    applicationsEdit: (id: string | number) => `/parametrages/applications/edit/${id}`,
    applicationsDetail: (id: string | number) => `/parametrages/applications/${id}`,
    jalons: '/parametrages/jalons',
    jalonsCreate: '/parametrages/jalons/create',
    jalonsEdit: (id: string | number) => `/parametrages/jalons/edit/${id}`,
    jalonsDetail: (id: string | number) => `/parametrages/jalons/${id}`,
  },
} as const;

export function productionListRoute(type: ProductionType): string {
  switch (type) {
    case 'AUDIT':
      return APP_ROUTES.productions.audits;
    case 'ENGINEERING':
    case 'MONITORING':
      return APP_ROUTES.productions.ingenierie;
    default:
      return APP_ROUTES.productions.projets;
  }
}

export function productionCreateRoute(type: ProductionType): string {
  switch (type) {
    case 'AUDIT':
      return APP_ROUTES.productions.auditsCreate;
    case 'ENGINEERING':
    case 'MONITORING':
      return APP_ROUTES.productions.ingenierieCreate;
    default:
      return APP_ROUTES.productions.projetsCreate;
  }
}

export function productionEditRoute(type: ProductionType, id: string | number): string {
  switch (type) {
    case 'AUDIT':
      return APP_ROUTES.productions.auditsEdit(id);
    case 'ENGINEERING':
    case 'MONITORING':
      return APP_ROUTES.productions.ingenierieEdit(id);
    default:
      return APP_ROUTES.productions.projetsEdit(id);
  }
}

export function productionDetailRoute(type: ProductionType, id: string | number): string {
  switch (type) {
    case 'AUDIT':
      return APP_ROUTES.productions.auditsDetail(id);
    case 'ENGINEERING':
    case 'MONITORING':
      return APP_ROUTES.productions.ingenierieDetail(id);
    default:
      return APP_ROUTES.productions.projetsDetail(id);
  }
}

export function planificationListRoute(type: ProductionType): string {
  switch (type) {
    case 'AUDIT':
      return APP_ROUTES.planifications.audits;
    case 'ENGINEERING':
    case 'MONITORING':
      return APP_ROUTES.planifications.ingenierie;
    default:
      return APP_ROUTES.planifications.projets;
  }
}

export function planificationCreateRoute(type: ProductionType): string {
  switch (type) {
    case 'AUDIT':
      return APP_ROUTES.planifications.auditsCreate;
    case 'ENGINEERING':
    case 'MONITORING':
      return APP_ROUTES.planifications.ingenierieCreate;
    default:
      return APP_ROUTES.planifications.projetsCreate;
  }
}

export function planificationEditRoute(type: ProductionType, id: string | number): string {
  switch (type) {
    case 'AUDIT':
      return APP_ROUTES.planifications.auditsEdit(id);
    case 'ENGINEERING':
    case 'MONITORING':
      return APP_ROUTES.planifications.ingenierieEdit(id);
    default:
      return APP_ROUTES.planifications.projetsEdit(id);
  }
}

export function planificationDetailRoute(type: ProductionType, id: string | number): string {
  switch (type) {
    case 'AUDIT':
      return APP_ROUTES.planifications.auditsDetail(id);
    case 'ENGINEERING':
    case 'MONITORING':
      return APP_ROUTES.planifications.ingenierieDetail(id);
    default:
      return APP_ROUTES.planifications.projetsDetail(id);
  }
}

/** Normalise un lien menu API vers le chemin interne de la refonte. */
export function normalizeMenuRoute(lien: string | null | undefined): string {
  if (!lien || lien === '#') {
    return '/';
  }
  let path = lien.split('?')[0].trim();
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  const aliases: Record<string, string> = {
    '/production': APP_ROUTES.productions.projets,
    '/productions/projets': APP_ROUTES.productions.projets,
    '/productions/audits': APP_ROUTES.productions.audits,
    '/productions/ingenierie': APP_ROUTES.productions.ingenierie,
    '/planification': APP_ROUTES.planifications.projets,
    '/planifications/projets': APP_ROUTES.planifications.projets,
    '/planifications/audits': APP_ROUTES.planifications.audits,
    '/planifications/ingenierie': APP_ROUTES.planifications.ingenierie,
    '/parametrages': APP_ROUTES.parametrages,
    '/audit': APP_ROUTES.pisteAudit,
    '/utilisateurs/profil': APP_ROUTES.monProfil,
  };

  return aliases[path] ?? path;
}

/** Sections (hors paramétrage) : chaque sous-module a son propre menu. */
const MODULE_SECTIONS = ['/utilisateurs', '/productions', '/planifications'] as const;

/** Route dans le périmètre paramétrage (hub ou sous-page). */
export function isParametragePath(path: string): boolean {
  const normalizedPath = normalizeMenuRoute(path);
  return (
    normalizedPath === APP_ROUTES.parametrages ||
    normalizedPath.startsWith(`${APP_ROUTES.parametrages}/`)
  );
}

/**
 * Préfixe menu minimal requis pour une route.
 * Ex. `/parametrages/actions/create` → `/parametrages/actions` (le hub `/parametrages` ne suffit pas).
 */
export function getRequiredMenuPrefixForPath(path: string): string {
  const normalizedPath = normalizeMenuRoute(path);
  const segments = normalizedPath.split('/').filter(Boolean);

  for (const base of MODULE_SECTIONS) {
    const baseSegments = base.split('/').filter(Boolean);
    if (segments.length <= baseSegments.length) {
      if (normalizedPath === base) {
        return base;
      }
      continue;
    }

    const pathBase = `/${segments.slice(0, baseSegments.length).join('/')}`;
    if (pathBase === base) {
      return `/${segments.slice(0, baseSegments.length + 1).join('/')}`;
    }
  }

  return normalizedPath;
}

/** Indique si un lien menu habilité couvre la route. */
export function menuLienGrantsPath(menuLien: string, path: string): boolean {
  const lien = normalizeMenuRoute(menuLien);
  const normalizedPath = normalizeMenuRoute(path);
  if (!lien) {
    return false;
  }

  // Paramétrage : le menu parent couvre toutes les sous-pages (actions, menus, entités…).
  if (lien === APP_ROUTES.parametrages) {
    return isParametragePath(normalizedPath);
  }
  if (isParametragePath(normalizedPath) && lien.startsWith(`${APP_ROUTES.parametrages}/`)) {
    return normalizedPath === lien || normalizedPath.startsWith(`${lien}/`);
  }

  const requiredPrefix = getRequiredMenuPrefixForPath(normalizedPath);

  if (requiredPrefix.length > lien.length) {
    return false;
  }

  if (normalizedPath === lien) {
    return true;
  }

  return normalizedPath.startsWith(`${lien}/`);
}

export function getLandingRoute(userInfos: any): string {
  const profilMenuActions = userInfos?.profil?.profilMenuActions;
  if (!Array.isArray(profilMenuActions) || !profilMenuActions.length) {
    return APP_ROUTES.bienvenue;
  }
  const hasDashboard = profilMenuActions.some((pma: any) => {
    const route = normalizeMenuRoute(pma?.menu?.lien);
    return route === APP_ROUTES.dashboard;
  });
  return hasDashboard ? APP_ROUTES.dashboard : APP_ROUTES.bienvenue;
}

export function isCreateUrl(url: string): boolean {
  return url.includes('/create') || url.includes('/nouveau');
}
