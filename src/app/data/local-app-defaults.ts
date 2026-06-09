/**
 * Données locales par défaut (aucun backend).
 * Connexion : voir DEMO_LOGIN_EMAIL / DEMO_LOGIN_PASSWORD.
 */
import { MenuItem, User } from '../models/menu';
import { AppAction, AuthorizationProfile, MenuHabilitation } from '../models/authorization';
import { collectMenuIds, flattenMenuItems } from '../utils/menu-tree';
import type { Entity, Specialty, Application, Jalon } from '../models/settings-catalog';

export const DEMO_LOGIN_EMAIL = 'admin@ngser.local';
export const DEMO_LOGIN_PASSWORD = 'admin123';

export const DEMO_PROFILE_ID = 'profile-admin';

export function createDemoUser(): User {
  return {
    id: 'user-admin',
    code: 'RES-001',
    name: 'Administrateur local',
    firstName: 'Administrateur',
    lastName: 'Local',
    email: DEMO_LOGIN_EMAIL,
    profileId: DEMO_PROFILE_ID,
    entityId: 'ent-root',
    specialtyId: 'spec-1',
    avatar: 'AL',
    createdAt: new Date(),
  };
}

const demoCreatedAt = new Date();

export function defaultActions(): AppAction[] {
  const row = (id: string, actionId: string, label: string, icon: string): AppAction => ({
    id,
    actionId,
    code: actionId,
    label,
    icon,
    active: true,
    createdAt: demoCreatedAt,
  });
  return [
    row('a1', 'VIEW', 'Consulter', 'visibility'),
    row('a8', 'VIEW_DETAIL', 'Voir detail', 'visibility'),
    row('a2', 'CREATE', 'Créer', 'add_circle'),
    row('a3', 'EDIT', 'Modifier', 'edit'),
    row('a4', 'DELETE', 'Supprimer', 'delete'),
    row('a5', 'EXPORT', 'Exporter', 'file_download'),
    row('a6', 'IMPORT', 'Importer', 'file_upload'),
    row('a7', 'DOWNLOAD_TEMPLATE', 'Télécharger modèle', 'download'),
  ];
}

export function defaultMenus(): MenuItem[] {
  return [
    { id: '1', label: 'Dashboard', icon: 'grid_view', route: '/dashboard', active: true },
    {
      id: '6',
      label: 'Utilisateurs',
      icon: 'groups',
      route: '/utilisateurs',
      active: true,
      children: [
        {
          id: '6-1',
          label: 'Profils & droits',
          icon: 'admin_panel_settings',
          route: '/utilisateurs/profils',
          active: true,
        },
        {
          id: '6-2',
          label: 'Ressources',
          icon: 'badge',
          route: '/utilisateurs/ressources',
          active: true,
        },
      ],
    },
    {
      id: '2',
      label: 'Production',
      icon: 'precision_manufacturing',
      route: '/production',
      active: true,
      children: [
        { id: '2-1', label: 'Projets', icon: 'folder', route: '/productions/projets', active: true },
        { id: '2-2', label: 'Audits IT', icon: 'security', route: '/productions/audits', active: true },
        { id: '2-3', label: 'Veille', icon: 'engineering', route: '/productions/ingenierie', active: true },
      ],
    },
    {
      id: '3',
      label: 'Planification',
      icon: 'event_note',
      route: '/planification',
      active: true,
      children: [
        {
          id: '3-1',
          label: 'Planing Projets',
          icon: 'calendar_today',
          route: '/planifications/projets',
          active: true,
        },
        {
          id: '3-2',
          label: 'Planing Audits',
          icon: 'event_available',
          route: '/planifications/audits',
          active: true,
        },
        {
          id: '3-3',
          label: 'Planing Veille',
          icon: 'history_edu',
          route: '/planifications/ingenierie',
          active: true,
        },
      ],
    },
    { id: '4', label: 'Paramétrage', icon: 'settings', route: '/parametrages', active: true },
    { id: '5', label: "Piste d'audit", icon: 'history', route: '/piste-audit', active: true },
    { id: '7', label: 'Mon profil', icon: 'person', route: '/mon-profil', active: true },
  ];
}

export function defaultProfiles(): AuthorizationProfile[] {
  const menus = defaultMenus();
  const actions = defaultActions();
  return [
    {
      id: DEMO_PROFILE_ID,
      code: 'PROF-ADMIN',
      label: 'ADMIN',
      visibleMenuIds: collectMenuIds(menus),
      allowedActionsByMenu: buildFullHabilitation(menus, actions),
      createdAt: demoCreatedAt,
    },
  ];
}

export function buildFullHabilitation(menus: MenuItem[], actions: AppAction[]): MenuHabilitation {
  const ids = actions.map((a) => a.actionId || a.code || a.id);
  const h: MenuHabilitation = {};
  for (const m of flattenMenuItems(menus)) {
    h[m.id] = [...ids];
  }
  return h;
}

export function defaultSpecialties(): Specialty[] {
  return [
    {
      id: 'spec-1',
      label: 'Général',
      icon: 'workspace_premium',
      active: true,
      createdAt: new Date(),
    },
  ];
}

export function defaultEntities(): Entity[] {
  return [
    {
      id: 'ent-root',
      name: 'Siège',
      icon: 'business',
      active: true,
      createdAt: new Date(),
    },
  ];
}

export function defaultApplications(): Application[] {
  return [
    {
      id: 'app-1',
      code: 'GESTPROD',
      label: 'Gestion Prod',
      active: true,
      createdAt: new Date(),
      createdBy: 'local',
    },
  ];
}

export function defaultJalons(): Jalon[] {
  return [
    {
      id: 'jal-1',
      code: 'LANC',
      label: 'Lancement',
      applicationIds: [],
      createdAt: new Date(),
      createdBy: 'local',
    },
  ];
}
