export type ProductionType = 'PROJECT' | 'AUDIT' | 'ENGINEERING' | 'MONITORING';

export interface ProductionItem {
  id: string;
  type: ProductionType;
  /** Code métier (audit IT, veille…) préservé pour les mises à jour */
  code?: string;
  libelle: string;
  description: string;
  /** Identifiant utilisateur (TPM / chef de projet technique) */
  tpm?: string;
  /** Utilisateurs affectés : plusieurs pour un projet ; un seul (ressource) pour audit IT et ingénierie & veille */
  resources: string[];
  /** Date d’enregistrement de la fiche (création) */
  createdAt?: Date;
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}
