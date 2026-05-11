import { ProductionType } from './production';

/** Statut d’une ligne de planification (distinct des fiches production). */
export type PlanTaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface PlanTask {
  id: string;
  createdAt: Date;
  type: ProductionType;
  productionTypeLabel: string;
  status: PlanTaskStatus;
  projectId: string;
  projectLabel: string;
  entityId: string;
  entityLabel: string;
  ownerId: string;
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date | null;
  progress: number;
  jalonId?: string;
  jalonLabel?: string;
  subJalonId?: string;
  subJalonLabel?: string;
  applicationId?: string;
  applicationLabel?: string;
  identification?: string;
  topic?: 'IA' | 'CYBERSECURITE' | 'CLOUD' | 'DATA' | 'DEVOPS' | 'AUTRE';
  source?: 'CONFERENCE' | 'ARTICLE' | 'PROJET_INTERNE' | 'FORMATION' | 'AUTRE';
  watchId?: string;
  watchLabel?: string;
  discoveryDate?: Date | null;
  opportunity?: string;
  maturityLevel?: 'VEILLE' | 'ETUDE' | 'POC' | 'DEVELOPPEMENT';
  potentialImpact?: 'ELEVE' | 'MOYEN' | 'FAIBLE';
  actionTaken?: string;
  equipmentId?: string;
  auditId?: string;
  specialtyId?: string;
  specialtyLabel?: string;
  equipmentType?: 'PC' | 'SERVEUR' | 'VM';
  locationType?: 'CLOUD' | 'SITE' | 'BUREAU';
  equipmentIdentifier?: string;
  assignedResourceId?: string;
  assignedTo?: string;
  commissioningDate?: Date | null;
  equipmentState?: 'FONCTIONNEL' | 'DEFAILLANT' | 'HORS_SERVICE';
  lastMaintenanceDate?: Date | null;
  nextMaintenanceDate?: Date | null;
  warrantyDeadline?: Date | null;
  licenseStatus?: 'OUI' | 'NON' | 'A_RENOUVELER';
  auditRemarks?: string;
  issues?: string;
  correctiveActions?: string;
  comments?: string;
}

export type PlanTaskInput = Omit<PlanTask, 'id' | 'createdAt'>;
