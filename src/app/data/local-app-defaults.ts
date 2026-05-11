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
    name: 'Administrateur local',
    firstName: 'Administrateur',
    lastName: 'Local',
    email: DEMO_LOGIN_EMAIL,
    profileId: DEMO_PROFILE_ID,
    entityId: 'ent-root',
    specialtyId: 'spec-1',
    avatar: 'AL',
  };
}

export function defaultActions(): AppAction[] {
  return [
    { id: 'a1', code: 'VIEW', label: 'Consulter', icon: 'visibility', active: true },
    { id: 'a8', code: 'VIEW_DETAIL', label: 'Voir detail', icon: 'visibility', active: true },
    { id: 'a2', code: 'CREATE', label: 'Créer', icon: 'add_circle', active: true },
    { id: 'a3', code: 'EDIT', label: 'Modifier', icon: 'edit', active: true },
    { id: 'a4', code: 'DELETE', label: 'Supprimer', icon: 'delete', active: true },
    { id: 'a5', code: 'EXPORT', label: 'Exporter', icon: 'file_download', active: true },
    { id: 'a6', code: 'IMPORT', label: 'Importer', icon: 'file_upload', active: true },
    { id: 'a7', code: 'DOWNLOAD_TEMPLATE', label: 'Télécharger modèle', icon: 'download', active: true },
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
        { id: '2-1', label: 'Projets', icon: 'folder', route: '/production/projets', active: true },
        { id: '2-2', label: 'Audits IT', icon: 'security', route: '/production/audits', active: true },
        { id: '2-3', label: 'Veille', icon: 'engineering', route: '/production/veille', active: true },
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
          route: '/planification/projets',
          active: true,
        },
        {
          id: '3-2',
          label: 'Planing Audits',
          icon: 'event_available',
          route: '/planification/audits',
          active: true,
        },
        {
          id: '3-3',
          label: 'Planing Veille',
          icon: 'history_edu',
          route: '/planification/veille',
          active: true,
        },
      ],
    },
    { id: '4', label: 'Paramétrage', icon: 'settings', route: '/settings', active: true },
    { id: '5', label: "Piste d'audit", icon: 'history', route: '/audit', active: true },
    { id: '7', label: 'Mon profil', icon: 'person', route: '/utilisateurs/profil', active: true },
  ];
}

export function defaultProfiles(): AuthorizationProfile[] {
  const menus = defaultMenus();
  const actions = defaultActions();
  return [
    {
      id: DEMO_PROFILE_ID,
      label: 'ADMIN',
      visibleMenuIds: collectMenuIds(menus),
      allowedActionsByMenu: buildFullHabilitation(menus, actions),
    },
  ];
}

export function buildFullHabilitation(menus: MenuItem[], actions: AppAction[]): MenuHabilitation {
  const ids = actions.map((a) => a.id);
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
