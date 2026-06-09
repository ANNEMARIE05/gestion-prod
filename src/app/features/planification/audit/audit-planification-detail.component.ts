import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PlanificationAuditService } from '../../../services/planificationAudit.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { PermissionService } from '../../../services/permission.service';
import { APP_ROUTES } from '../../../utils/app-routes';

interface AuditInformatiqueDetail {
  id?: number;
  code: string;
  typeAudit: string;
  objectifAudit: string;
  dateRealisation: string;
  serviceAudite: string;
  auditeurOrganisme?: string;
  resultats: string;
  nonConformitesDetectees: string;
  recommandations: string;
  responsableMiseEnOeuvre?: string;
  echeanceActions: string;
  tauxRealisation: number | null;
  commentaires: string;
  auditid?: { id: number; code: string; libelle: string; description?: string | null };
  jalonid?: { id: number; code: string; libelle: string };
  auditeurId?: { id: number; code: string; nom: string; prenoms: string; email?: string };
  responsableId?: { id: number; code: string; nom: string; prenoms: string; email?: string };
  createdAt?: string;
}

@Component({
  selector: 'app-audit-planification-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <ng-container *ngIf="!loading && audit">
      <div class="atypical-form-shell">
        <!-- En-tête -->
        <div class="atypical-form-header">
          <div class="flex items-start gap-4 min-w-0 flex-1">
            <button
              mat-icon-button
              [routerLink]="backRoute"
              class="!bg-white shadow-sm hover:shadow-md transition-shadow !rounded-md mt-1 flex-shrink-0"
              type="button"
            >
              <mat-icon>arrow_back</mat-icon>
            </button>

            <div class="min-w-0">
              <h1 class="atypical-form-title m-0">
                {{ audit.auditid?.libelle || audit.typeAudit || 'Audit informatique' }}
              </h1>
              <p class="atypical-form-subtitle m-0 mt-1">
                Planification - Audit informatique · {{ audit.code || '-' }}
              </p>
              <div class="atypical-section-band mt-3"></div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 justify-end">
            @if (perm.canEdit()) {
              <button mat-stroked-button [routerLink]="editRoute" class="!rounded-md !border-gray-200" type="button">
                <mat-icon class="mr-2">edit</mat-icon>
                Modifier
              </button>
            }
          </div>
        </div>

        <div class="atypical-form-card space-y-8">
          <!-- Informations générales -->
          <div class="atypical-section">
            <h3 class="atypical-section-title">Informations générales</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">ID Audit</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ audit.code || '—' }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Audit</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">
                  {{ audit.auditid?.libelle || audit.auditid?.code || '—' }}
                </p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Type audit</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ audit.typeAudit || '—' }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Date de réalisation</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ formatDate(audit.dateRealisation) }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Service audité</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ audit.serviceAudite || '—' }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Auditeur / Organisme</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ getAuditeurDisplay() }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Jalons</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">
                  {{ audit.jalonid?.libelle || audit.jalonid?.code || '—' }}
                </p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Résultats</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ audit.resultats || '—' }}</p>
              </div>
            </div>
          </div>

          <!-- Objectif -->
          <div class="atypical-section">
            <h3 class="atypical-section-title">Objectif de l'audit</h3>
            <p class="text-sm text-gray-500 leading-relaxed m-0 whitespace-pre-line">
              {{ audit.objectifAudit || 'Aucun objectif renseigné.' }}
            </p>
          </div>

          <!-- Contenu de l'audit -->
          <div class="atypical-section">
            <h3 class="atypical-section-title">Contenu de l'audit</h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Non conformités détectées (avec CVE)</p>
                <p class="text-sm text-gray-900 m-0 mt-1 whitespace-pre-line">
                  {{ audit.nonConformitesDetectees || 'Aucune non-conformité renseignée.' }}
                </p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Recommandations</p>
                <p class="text-sm text-gray-900 m-0 mt-1 whitespace-pre-line">
                  {{ audit.recommandations || 'Aucune recommandation renseignée.' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Suivi des actions -->
          <div class="atypical-section">
            <h3 class="atypical-section-title">Suivi des actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Responsable de mise en oeuvre</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ getResponsableDisplay() }}</p>
                <p *ngIf="audit.responsableId?.email" class="text-xs text-gray-500 m-0 mt-1">
                  {{ audit.responsableId?.email }}
                </p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Echeance des actions</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ formatDate(audit.echeanceActions) }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Taux de réalisation</p>
                <div class="flex items-center gap-3 mt-2">
                  <span class="text-sm font-semibold text-gray-900">{{ audit.tauxRealisation ?? 0 }}%</span>
                  <div class="flex-1 bg-white rounded-full h-2 overflow-hidden">
                    <div class="bg-primary h-2 rounded-full" [style.width.%]="audit.tauxRealisation ?? 0"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="atypical-soft-block p-4 mt-4">
              <p class="text-xs text-gray-500 m-0">Commentaires / points de blocage</p>
              <p class="text-sm text-gray-900 m-0 mt-1 whitespace-pre-line">
                {{ audit.commentaires || 'Aucun commentaire renseigné.' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ng-container>

    <div *ngIf="loading" class="atypical-form-shell">
      <div class="atypical-form-card text-center py-14">
        <p class="text-sm text-gray-500 m-0">Chargement en cours...</p>
      </div>
    </div>

    <div *ngIf="!loading && !audit" class="atypical-form-shell">
      <div class="atypical-form-card text-center py-14 space-y-4">
        <p class="text-sm text-gray-500 m-0">Aucune planification d'audit informatique trouvée.</p>
        <button mat-flat-button color="primary" [routerLink]="backRoute" type="button">Retour à la liste</button>
      </div>
    </div>
  `,
})
export class AuditPlanificationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly planificationAuditService = inject(PlanificationAuditService);
  private readonly errorHandler = inject(ErrorHandlerService);
  readonly perm = inject(PermissionService);

  audit?: AuditInformatiqueDetail;
  loading = true;

  get backRoute(): string {
    return APP_ROUTES.planifications.audits;
  }

  get editRoute(): string {
    return this.audit?.id ? APP_ROUTES.planifications.auditsEdit(this.audit.id) : APP_ROUTES.planifications.audits;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadAudit(Number(idParam));
    } else {
      this.goBack();
    }
  }

  private loadAudit(id: number): void {
    this.loading = true;
    this.planificationAuditService.getById(id).subscribe(
      (response) => {
        const data = this.extractItem(response.body);
        if (data) {
          const tauxRealisation =
            typeof data.tauxRealisation === 'string'
              ? parseFloat(data.tauxRealisation)
              : data.tauxRealisation || data.etatDAvancement || null;

          const serviceObj = data.serviceId || data.serviceid;
          const serviceLibelle = serviceObj
            ? serviceObj.libelle || serviceObj.code || ''
            : data.serviceAudite || '';

          const auditObj = data.auditId || data.auditid || data.audit;
          const jalonObj = data.jalonId || data.jalonid || data.jalon;

          this.audit = {
            id: data.id,
            code: data.code || '',
            typeAudit: data.typeAudit || '',
            objectifAudit: data.objectifAudit || data.objectif || '',
            dateRealisation: data.dateRealisation || data.dateDeDebut || '',
            serviceAudite: serviceLibelle,
            auditeurOrganisme: data.auditeurOrganisme || '',
            resultats: data.resultats || '',
            nonConformitesDetectees: data.nonConformitesDetectees || data.nonConformites || '',
            recommandations: data.recommandations || '',
            responsableMiseEnOeuvre: data.responsableMiseEnOeuvre || '',
            echeanceActions: data.echeanceActions || '',
            tauxRealisation: tauxRealisation,
            commentaires: data.commentaires || '',
            auditid: auditObj || null,
            jalonid: jalonObj || null,
            auditeurId: data.auditeurId || null,
            responsableId: data.responsableId || null,
            createdAt: data.createdAt || '',
          };
        } else {
          this.audit = undefined;
        }
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        this.errorHandler.showError(error);
        this.goBack();
      },
    );
  }

  getAuditeurDisplay(): string {
    if (!this.audit) {
      return '—';
    }
    if (this.audit.auditeurId) {
      const nom = this.audit.auditeurId.nom || '';
      const prenoms = this.audit.auditeurId.prenoms || '';
      return [prenoms, nom].filter(Boolean).join(' ').trim() || '—';
    }
    return this.audit.auditeurOrganisme || '—';
  }

  getResponsableDisplay(): string {
    if (!this.audit) {
      return '—';
    }
    if (this.audit.responsableId) {
      const nom = this.audit.responsableId.nom || '';
      const prenoms = this.audit.responsableId.prenoms || '';
      return [prenoms, nom].filter(Boolean).join(' ').trim() || '—';
    }
    return this.audit.responsableMiseEnOeuvre || '—';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return '—';
    }
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  }

  goBack(): void {
    void this.router.navigate([APP_ROUTES.planifications.audits]);
  }

  private extractItem(responseBody: any): any {
    if (Array.isArray(responseBody)) {
      return responseBody[0] || null;
    }
    if (responseBody && typeof responseBody === 'object') {
      if (responseBody.data && typeof responseBody.data === 'object') {
        return responseBody.data;
      }
      if (responseBody.content && typeof responseBody.content === 'object') {
        return responseBody.content;
      }
      if (responseBody.item && typeof responseBody.item === 'object') {
        return responseBody.item;
      }
      return responseBody;
    }
    return null;
  }
}
