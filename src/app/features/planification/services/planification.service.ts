import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { PlanTask, PlanTaskInput, PlanTaskStatus } from '../../../models/plan-task';
import { ProductionType } from '../../../models/production';
import { AuthService } from '../../auth/services/auth.service';
import { PlanificationProjetService } from './planificationProjet.service';
import { PlanificationAuditService } from './planificationAudit.service';
import { PlanificationVeilleService } from './planificationVeille.service';
import {
  extractApiBody,
  extractApiItem,
  mapApiStatut,
  parseApiDate,
  extractApiCreatedAt,
  personLabel,
  refId,
} from '../../../utils/api-response.utils';

const TYPE_LABELS: Record<ProductionType, string> = {
  PROJECT: 'Projet',
  AUDIT: 'Audit informatique',
  ENGINEERING: 'Veille / Ingénierie',
  MONITORING: 'Monitoring',
};

function mapPlanItem(raw: any, type: ProductionType): PlanTask {
  const project = raw.projet ?? raw.projetId ?? raw.audit ?? raw.veille ?? raw.auditId ?? raw.veilleId;
  const projectLabel =
    typeof project === 'object'
      ? String(project?.libelle ?? project?.nom ?? '')
      : String(raw.projetLabel ?? raw.libelle ?? raw.numero ?? raw.code ?? '');

  const entity = raw.entite ?? raw.entiteId;
  const entityLabel =
    typeof entity === 'object' ? String(entity?.libelle ?? entity?.nom ?? '') : String(raw.entiteLabel ?? '');

  const owner = raw.responsable ?? raw.responsableId ?? raw.ressourceId;
  const ownerId = refId(owner);
  const ownerLabel = personLabel(owner);

  const jalon = raw.jalon ?? raw.jalonId;
  const application = raw.application ?? raw.applicationId;
  const specialty = raw.service ?? raw.serviceId ?? raw.specialite ?? raw.specialiteId;

  return {
    id: String(raw.id),
    createdAt: extractApiCreatedAt(raw) ?? new Date(),
    type,
    productionTypeLabel: TYPE_LABELS[type],
    status: mapApiStatut(raw.statut),
    projectId: refId(project),
    projectLabel,
    entityId: refId(entity),
    entityLabel,
    ownerId,
    startDate: parseApiDate(raw.dateDeDebut ?? raw.dateDebut) ?? new Date(),
    expectedEndDate: parseApiDate(raw.dateDeFin ?? raw.dateFin) ?? new Date(),
    actualEndDate: parseApiDate(raw.dateDeFinRelle) ?? null,
    progress: Number(raw.etatAvancement ?? raw.etatDAvancement ?? 0) || 0,
    jalonId: jalon ? refId(jalon) : undefined,
    jalonLabel: typeof jalon === 'object' ? String(jalon?.libelle ?? '') : undefined,
    applicationId: application ? refId(application) : undefined,
    applicationLabel: typeof application === 'object' ? String(application?.libelle ?? '') : undefined,
    specialtyId: specialty ? refId(specialty) : undefined,
    specialtyLabel: typeof specialty === 'object' ? String(specialty?.libelle ?? '') : undefined,
    issues: String(raw.problemeRencontrer ?? raw.problemes ?? ''),
    correctiveActions: String(raw.actionCorrective ?? ''),
    comments: String(raw.commentaire ?? ''),
    assignedResourceId: ownerId,
    assignedTo: ownerLabel,
    equipmentIdentifier: String(raw.identification ?? raw.equipement ?? ''),
    auditRemarks: String(raw.remarques ?? ''),
  };
}

@Injectable({
  providedIn: 'root',
})
export class PlanificationService {
  private auth = inject(AuthService);
  private planProjet = inject(PlanificationProjetService);
  private planAudit = inject(PlanificationAuditService);
  private planVeille = inject(PlanificationVeilleService);

  private tasks = signal<PlanTask[]>([]);
  private loaded = false;

  allTasks = computed(() => this.tasks());

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.refreshTasks().subscribe();
    }
  }

  refreshTasks(force = false): Observable<PlanTask[]> {
    if (this.loaded && !force) {
      return of(this.tasks());
    }
    return forkJoin([
      this.planProjet.list({} as any),
      this.planAudit.list({} as any),
      this.planVeille.list({} as any),
    ]).pipe(
      map(([pResp, aResp, vResp]) => {
        const projets = extractApiBody(pResp).map((r) => mapPlanItem(r, 'PROJECT'));
        const audits = extractApiBody(aResp).map((r) => mapPlanItem(r, 'AUDIT'));
        const veilles = extractApiBody(vResp).map((r) => mapPlanItem(r, 'ENGINEERING'));
        return [...projets, ...audits, ...veilles];
      }),
      tap((all) => {
        this.tasks.set(all);
        this.loaded = true;
      }),
      catchError(() => {
        this.tasks.set([]);
        return of([]);
      }),
    );
  }

  getTaskById(id: string): PlanTask | undefined {
    return this.tasks().find((t) => t.id === id);
  }

  addTask(input: PlanTaskInput): Observable<PlanTask> {
    const api = this.apiForType(input.type);
    const payload = this.toApiPayload(input);
    return api.create(payload as any).pipe(
      switchMap((resp) => {
        const body = extractApiItem(resp) ?? payload;
        const created = mapPlanItem(body, input.type);
        this.tasks.update((list) => [...list, created]);
        return of(created);
      }),
    );
  }

  updateTask(id: string, input: PlanTaskInput): Observable<PlanTask> {
    const api = this.apiForType(input.type);
    const payload = this.toApiPayload(input);
    return api.update(Number(id), payload as any).pipe(
      switchMap((resp) => {
        const body = extractApiItem(resp) ?? { ...payload, id: Number(id) };
        const updated = mapPlanItem(body, input.type);
        this.tasks.update((list) => list.map((t) => (t.id === id ? updated : t)));
        return of(updated);
      }),
    );
  }

  deleteTask(id: string): Observable<void> {
    const existing = this.getTaskById(id);
    if (!existing) {
      return of(undefined);
    }
    const api = this.apiForType(existing.type);
    return api.delete(Number(id)).pipe(
      tap(() => this.tasks.update((list) => list.filter((t) => t.id !== id))),
      map(() => undefined),
    );
  }

  private apiForType(type: ProductionType) {
    switch (type) {
      case 'AUDIT':
        return this.planAudit;
      case 'ENGINEERING':
        return this.planVeille;
      default:
        return this.planProjet;
    }
  }

  private toApiPayload(input: PlanTaskInput): Record<string, unknown> {
    const fmt = (d: Date | null | undefined) =>
      d ? d.toISOString().split('T')[0] : undefined;

    const statutMap: Record<PlanTaskStatus, string> = {
      TODO: 'NOK',
      IN_PROGRESS: 'EN_COURS',
      DONE: 'OK',
      CANCELLED: 'ANNULE',
    };

    // Jalon a enregistrer : le sous-jalon s'il est selectionne, sinon le jalon parent.
    const effectiveJalonId = input.subJalonId || input.jalonId;

    const base: Record<string, unknown> = {
      numero: input.projectLabel,
      typeDeProduction: input.productionTypeLabel,
      dateDeDebut: fmt(input.startDate),
      dateDeFin: fmt(input.expectedEndDate),
      dateDeFinRelle: fmt(input.actualEndDate ?? undefined),
      etatAvancement: input.progress,
      statut: statutMap[input.status] ?? 'NOK',
      problemeRencontrer: input.issues ?? '',
      actionCorrective: input.correctiveActions ?? '',
      commentaire: input.comments ?? '',
      responsableId: input.ownerId ? Number(input.ownerId) : undefined,
      jalonId: effectiveJalonId ? Number(effectiveJalonId) : undefined,
      applicationId: input.applicationId ? Number(input.applicationId) : undefined,
      serviceId: input.specialtyId ? Number(input.specialtyId) : undefined,
    };

    switch (input.type) {
      case 'PROJECT':
        return { ...base, projetId: input.projectId ? Number(input.projectId) : undefined };
      case 'AUDIT':
        return { ...base, auditId: input.auditId ? Number(input.auditId) : undefined };
      case 'ENGINEERING':
        return { ...base, veilleId: input.watchId ? Number(input.watchId) : undefined };
      default:
        return base;
    }
  }
}
