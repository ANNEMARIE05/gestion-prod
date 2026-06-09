import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PlanificationVeilleService } from '../../../services/planificationVeille.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { PermissionService } from '../../../services/permission.service';
import { APP_ROUTES } from '../../../utils/app-routes';

interface VeilleDetail {
  id?: number;
  code: string;
  thematique: string;
  source: string;
  dateDecouverte: string;
  serviceConcerne: string;
  opportuniteDetectee: string;
  niveauMaturite: string;
  impactPotentiel: string;
  actionEntreprise: string;
  statut: string;
  dateFin: string;
  commentaires: string;
  veille?: { id: number; code: string; libelle: string } | null;
  jalon?: { id: number; code: string; libelle: string } | null;
  responsable?: { id: number; code: string; nom: string; prenoms: string; email?: string } | null;
  createdAt?: string;
}

@Component({
  selector: 'app-veille-planification-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <ng-container *ngIf="!loading && veille">
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
                {{ veille.veille?.libelle || veille.thematique || 'Planification de veille' }}
              </h1>
              <p class="atypical-form-subtitle m-0 mt-1">
                Planification - Ingénierie &amp; Veille · {{ veille.code || '-' }}
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
          <!-- Informations principales -->
          <div class="atypical-section">
            <h3 class="atypical-section-title">Informations principales</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Identification</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ veille.code || '—' }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Veille</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">
                  {{ veille.veille?.libelle || veille.veille?.code || '—' }}
                </p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Thématique</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ veille.thematique || '—' }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Service concerné</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ veille.serviceConcerne || '—' }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Source</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ veille.source || '—' }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Date de découverte</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ formatDate(veille.dateDecouverte) }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Jalon clé atteint</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">
                  {{ veille.jalon?.libelle || veille.jalon?.code || '—' }}
                </p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Responsable</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ getResponsableDisplay() }}</p>
                <p *ngIf="veille.responsable?.email" class="text-xs text-gray-500 m-0 mt-1">
                  {{ veille.responsable?.email }}
                </p>
              </div>
            </div>
          </div>

          <!-- Opportunité détectée -->
          <div class="atypical-section">
            <h3 class="atypical-section-title">Opportunité détectée</h3>
            <p class="text-sm text-gray-500 leading-relaxed m-0 whitespace-pre-line">
              {{ veille.opportuniteDetectee || 'Aucune opportunité renseignée.' }}
            </p>
          </div>

          <!-- Évaluation et suivi -->
          <div class="atypical-section">
            <h3 class="atypical-section-title">Évaluation et suivi</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Niveau de maturité</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ veille.niveauMaturite || '—' }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Impact potentiel</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ veille.impactPotentiel || '—' }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Action entreprise</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ veille.actionEntreprise || '—' }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Statut</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ veille.statut || '—' }}</p>
              </div>
              <div class="atypical-soft-block p-4">
                <p class="text-xs text-gray-500 m-0">Date de fin</p>
                <p class="text-sm font-semibold text-gray-900 m-0 mt-1">{{ formatDate(veille.dateFin) }}</p>
              </div>
            </div>

            <div class="atypical-soft-block p-4 mt-4">
              <p class="text-xs text-gray-500 m-0">Commentaires</p>
              <p class="text-sm text-gray-900 m-0 mt-1 whitespace-pre-line">
                {{ veille.commentaires || 'Aucun commentaire renseigné.' }}
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

    <div *ngIf="!loading && !veille" class="atypical-form-shell">
      <div class="atypical-form-card text-center py-14 space-y-4">
        <p class="text-sm text-gray-500 m-0">Aucune planification de veille trouvée.</p>
        <button mat-flat-button color="primary" [routerLink]="backRoute" type="button">Retour à la liste</button>
      </div>
    </div>
  `,
})
export class VeillePlanificationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly planificationVeilleService = inject(PlanificationVeilleService);
  private readonly errorHandler = inject(ErrorHandlerService);
  readonly perm = inject(PermissionService);

  veille?: VeilleDetail;
  loading = true;

  get backRoute(): string {
    return APP_ROUTES.planifications.ingenierie;
  }

  get editRoute(): string {
    return this.veille?.id
      ? APP_ROUTES.planifications.ingenierieEdit(this.veille.id)
      : APP_ROUTES.planifications.ingenierie;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadVeille(Number(idParam));
    } else {
      this.goBack();
    }
  }

  private loadVeille(id: number): void {
    this.loading = true;
    this.planificationVeilleService.getById(id).subscribe(
      (response) => {
        const data = this.extractItem(response.body);
        if (data) {
          const serviceObj = data.specialiteId || data.serviceId || data.service;
          const serviceLibelle = serviceObj && typeof serviceObj === 'object'
            ? serviceObj.libelle || serviceObj.code || ''
            : '';

          const veilleObj = data.veilleId || data.veille;
          const jalonObj = data.jalonId || data.jalon;
          const responsableObj = data.responsableId || data.ressourceId;

          this.veille = {
            id: data.id,
            code: data.code || data.identification || '',
            thematique: data.thematique || '',
            source: data.source || '',
            dateDecouverte: data.dateDecouverte || '',
            serviceConcerne: serviceLibelle,
            opportuniteDetectee: data.opportuniteDetectee || '',
            niveauMaturite: data.niveauMaturite || '',
            impactPotentiel: data.impactPotentiel || '',
            actionEntreprise: data.actionEntreprise || '',
            statut: data.statut || '',
            dateFin: data.dateFin || '',
            commentaires: data.commentaires || '',
            veille: veilleObj && typeof veilleObj === 'object' ? veilleObj : null,
            jalon: jalonObj && typeof jalonObj === 'object' ? jalonObj : null,
            responsable: responsableObj && typeof responsableObj === 'object' ? responsableObj : null,
            createdAt: data.createdAt || '',
          };
        } else {
          this.veille = undefined;
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

  getResponsableDisplay(): string {
    if (!this.veille || !this.veille.responsable) {
      return '—';
    }
    const nom = this.veille.responsable.nom || '';
    const prenoms = this.veille.responsable.prenoms || '';
    return [prenoms, nom].filter(Boolean).join(' ').trim() || '—';
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
    void this.router.navigate([APP_ROUTES.planifications.ingenierie]);
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
