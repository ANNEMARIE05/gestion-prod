/** Identifiants d'actions renvoyés par l'API (habilitations profil). */
export const API_ACTIONS = {
  CREATE: 'CREER',
  VIEW: 'VOIR',
  EDIT: 'MODIFIER',
  DELETE: 'SUPPRIMER',
  IMPORT: 'IMPORTER',
  EXPORT: 'EXPORTER',
  DOWNLOAD_TEMPLATE: 'TELECHARGER_MODELE',
} as const;

export type ApiActionCode = (typeof API_ACTIONS)[keyof typeof API_ACTIONS];
