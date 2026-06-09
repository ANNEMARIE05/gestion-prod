import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlanificationAuditService } from '../services/planificationAudit.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { APP_ROUTES } from '../../../utils/app-routes';

interface AuditInformatiqueForm {
  id?: number;
  code: string;
  auditId: number | null;
  jalonId: number | null;
  specialiteId: number | null;
  auditeurId: number | 0;
  responsableId: number | 0;
  applicationId: number | 0;
  typeAudit: string;
  objectifAudit: string;
  dateRealisation: string;
  serviceId: number | null;
  resultats: string;
  nonConformitesDetectees: string;
  recommandations: string;
  echeanceActions: string;
  tauxRealisation: number | null;
  commentaires: string;
}

interface JalonOption {
  id: number;
  libelle: string;
  code: string;
  parent: any;
  jalonParentId?: number;
  active: boolean;
}

@Component({
  selector: 'app-audit-planification-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="max-w-5xl mx-auto py-6 px-1">
      <div class="bg-white rounded-lg shadow-premium border border-slate-100 p-6 md:p-8">
        <div class="flex items-center justify-between mb-6 gap-2">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 pr-2">
            {{ isEdit ? "Modifier la planification d'audit informatique" : "Nouvelle planification d'audit informatique" }}
          </h2>
          <button type="button" (click)="goBack()" class="text-gray-500 hover:text-gray-800 shrink-0" aria-label="Fermer">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div *ngIf="loading" class="text-center text-gray-500 py-8 text-sm sm:text-base">
          <mat-icon class="animate-spin align-middle">progress_activity</mat-icon>
          Chargement en cours...
        </div>

        <form *ngIf="!loading" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Informations générales -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Informations générales</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- ID Audit -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">ID Audit</label>
                <input
                  type="text"
                  [value]="form.code"
                  readonly
                  disabled
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  placeholder="Généré automatiquement"
                />
              </div>

              <!-- Audit -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Audit</label>
                <select
                  [(ngModel)]="form.auditId"
                  name="auditId"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option [ngValue]="null">Sélectionner un audit...</option>
                  <option *ngFor="let audit of audits" [ngValue]="audit.id">{{ audit.libelle }}</option>
                </select>
              </div>

              <!-- Type audit -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Type audit</label>
                <select
                  [(ngModel)]="form.typeAudit"
                  name="typeAudit"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Interne">Interne</option>
                  <option value="Externe">Externe</option>
                </select>
              </div>

              <!-- Objectif -->
              <div class="md:col-span-2 lg:col-span-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Objectif de l'audit</label>
                <textarea
                  [(ngModel)]="form.objectifAudit"
                  name="objectifAudit"
                  rows="3"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                ></textarea>
              </div>

              <!-- Date de réalisation -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Date de réalisation</label>
                <input
                  type="date"
                  [(ngModel)]="form.dateRealisation"
                  name="dateRealisation"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <!-- Service audité -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Service audité</label>
                <select
                  [(ngModel)]="form.serviceId"
                  name="serviceId"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option [ngValue]="null">Sélectionner un service...</option>
                  <option *ngFor="let specialite of listeSpecialites" [ngValue]="specialite.id">{{ specialite.libelle }}</option>
                </select>
              </div>

              <!-- Auditeur/Organisme -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Auditeur/Organisme</label>
                <select
                  [(ngModel)]="form.auditeurId"
                  name="auditeurId"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  <option [ngValue]="0">-- Sélectionner un auditeur --</option>
                  <option *ngFor="let ressource of ressources" [ngValue]="ressource.id">{{ getRessourceDisplayName(ressource) }}</option>
                </select>
              </div>

              <!-- Jalon clé -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Jalon clé atteint</label>
                <select
                  [(ngModel)]="selectedJalonParentId"
                  name="jalonParentId"
                  (ngModelChange)="onJalonParentChange($event)"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option [ngValue]="null">Sélectionner un jalon...</option>
                  <option *ngFor="let jalon of jalonsParents" [ngValue]="jalon.id || null">{{ jalon.libelle }}</option>
                </select>
              </div>

              <!-- Sous-jalons -->
              <div *ngIf="selectedJalonParentId && sousJalons.length > 0">
                <label class="block text-sm font-medium text-gray-700 mb-2">Sous jalons</label>
                <select
                  [(ngModel)]="selectedSousJalonId"
                  name="sousJalonId"
                  (ngModelChange)="onSousJalonChange($event)"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option [ngValue]="null">Sélectionner un sous-jalon...</option>
                  <option *ngFor="let sousJalon of sousJalons" [ngValue]="sousJalon.id || null">{{ sousJalon.libelle }}</option>
                </select>
              </div>

              <!-- Résultats -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Résultats</label>
                <select
                  [(ngModel)]="form.resultats"
                  name="resultats"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Score">Score</option>
                  <option value="Note">Note</option>
                  <option value="Niveau de conformité">Niveau de conformité</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Contenu de l'audit -->
          <div class="border-b border-gray-200 pb-6 space-y-6">
            <div class="flex flex-col md:flex-row gap-6">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">Non conformités détectées (avec CVE)</label>
                <textarea
                  [(ngModel)]="form.nonConformitesDetectees"
                  name="nonConformitesDetectees"
                  rows="4"
                  placeholder="Ex : CVE-2024-12345 - Description de la vulnérabilité..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                ></textarea>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">Recommandations</label>
                <textarea
                  [(ngModel)]="form.recommandations"
                  name="recommandations"
                  rows="4"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                ></textarea>
              </div>
            </div>

            <div class="flex flex-col md:flex-row gap-6">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">Responsable de mise en oeuvre</label>
                <select
                  [(ngModel)]="form.responsableId"
                  name="responsableId"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  <option [ngValue]="0">-- Sélectionner un responsable --</option>
                  <option *ngFor="let ressource of ressources" [ngValue]="ressource.id">{{ getRessourceDisplayName(ressource) }}</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">Echeance des actions</label>
                <input
                  type="date"
                  [(ngModel)]="form.echeanceActions"
                  name="echeanceActions"
                  [min]="form.dateRealisation || null"
                  class="w-full px-3 py-2 sm:px-4 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">Taux de réalisation (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  [(ngModel)]="form.tauxRealisation"
                  name="tauxRealisation"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <!-- Commentaires -->
          <div class="pb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Commentaires/points de blocage</label>
            <textarea
              [(ngModel)]="form.commentaires"
              name="commentaires"
              rows="4"
              placeholder="Entrez les commentaires et points de blocage..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            ></textarea>
          </div>

          <div class="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              (click)="goBack()"
              class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="submitting"
              class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center gap-2 disabled:opacity-60"
            >
              <mat-icon class="text-base">save</mat-icon>
              {{ isEdit ? 'Enregistrer les modifications' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AuditPlanificationFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly planificationAuditService = inject(PlanificationAuditService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly snackBar = inject(MatSnackBar);

  form: AuditInformatiqueForm = this.emptyForm();

  isEdit = false;
  loading = false;
  submitting = false;

  jalonsAll: JalonOption[] = [];
  jalonsParents: JalonOption[] = [];
  sousJalons: JalonOption[] = [];

  selectedJalonParentId: number | null = null;
  selectedSousJalonId: number | null = null;
  private savedJalonIdFromApi: number | null = null;

  listeSpecialites: { id: number; libelle: string }[] = [];
  audits: { id: number; code: string; libelle: string }[] = [];
  ressources: any[] = [];

  ngOnInit(): void {
    this.loadAudits();
    this.loadJalons();
    this.loadSpecialites();
    this.loadRessources();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.loadAudit(Number(idParam));
    } else {
      this.generateCode();
    }
  }

  private emptyForm(): AuditInformatiqueForm {
    return {
      code: '',
      typeAudit: '',
      auditId: null,
      objectifAudit: '',
      dateRealisation: '',
      jalonId: null,
      specialiteId: null,
      applicationId: 0,
      auditeurId: 0,
      resultats: '',
      nonConformitesDetectees: '',
      recommandations: '',
      responsableId: 0,
      serviceId: null,
      echeanceActions: '',
      tauxRealisation: null,
      commentaires: '',
    };
  }

  /** Génère un code unique automatiquement (format P_AUD-001). */
  private generateCode(): void {
    this.planificationAuditService.list({} as any).subscribe(
      (resp) => {
        const data = (resp && (resp.body as any)) || [];
        const planifsData = Array.isArray(data) ? data : data.data || [];
        const codes = planifsData
          .map((p: any) => p.code || '')
          .filter((code: string) => code && code.startsWith('P_AUD-'))
          .map((code: string) => {
            const match = code.match(/P_AUD-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((num: number) => num > 0);
        const nextNumber = codes.length > 0 ? Math.max(...codes) + 1 : 1;
        this.form.code = `P_AUD-${String(nextNumber).padStart(3, '0')}`;
      },
      () => {
        this.form.code = 'P_AUD-001';
      },
    );
  }

  private loadAudit(id: number): void {
    this.loading = true;
    this.planificationAuditService.getById(id).subscribe(
      (response) => {
        const data = this.extractItem(response.body);
        if (!data) {
          this.loading = false;
          this.snackBar.open("Planification d'audit informatique non trouvée", 'Fermer', { duration: 3000 });
          this.goBack();
          return;
        }

        const tauxRealisation =
          typeof data.tauxRealisation === 'string' ? parseFloat(data.tauxRealisation) : data.tauxRealisation || null;

        const auditIdValue = this.refId(data.auditId || data.auditid);
        const serviceIdValue = this.refId(data.serviceId || data.serviceid);
        const jalonIdValue = this.refId(data.jalonId || data.jalonid);
        const auditeurIdValue = this.refId(data.auditeurId || data.auditeurid) ?? 0;
        const responsableIdValue = this.refId(data.responsableId || data.responsableid) ?? 0;
        const specialiteIdValue = this.refId(data.specialiteId || data.specialiteid);

        this.savedJalonIdFromApi = jalonIdValue;

        this.form = {
          id: data.id,
          code: data.code || '',
          auditId: auditIdValue,
          jalonId: jalonIdValue,
          specialiteId: specialiteIdValue,
          auditeurId: auditeurIdValue,
          responsableId: responsableIdValue,
          applicationId: data.applicationid || data.applicationId || 0,
          typeAudit: data.typeAudit || '',
          objectifAudit: data.objectifAudit || data.objectif || '',
          dateRealisation: this.formatDateForInput(data.dateRealisation || data.dateDeDebut),
          serviceId: serviceIdValue,
          resultats: data.resultats || '',
          nonConformitesDetectees: data.nonConformitesDetectees || data.nonConformites || '',
          recommandations: data.recommandations || '',
          echeanceActions: this.formatDateForInput(data.echeanceActions),
          tauxRealisation: tauxRealisation,
          commentaires: data.commentaires || '',
        };

        this.applySavedJalonSelection();
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        this.errorHandler.showError(error);
        this.goBack();
      },
    );
  }

  private loadAudits(): void {
    this.planificationAuditService.getAudits().subscribe(
      (resp) => {
        const data = (resp && (resp.body as any)) || [];
        const audits = Array.isArray(data) ? data : data.data || [];
        this.audits = audits
          .map((a: any) => ({ id: a.id, code: a.code || '', libelle: a.libelle || '' }))
          .filter((a: any) => a.id && a.code);
      },
      () => {
        this.audits = [];
      },
    );
  }

  private loadJalons(): void {
    this.planificationAuditService.getJalons().subscribe(
      (resp) => {
        const data = (resp && (resp.body as any)) || [];
        const jalons = Array.isArray(data) ? data : data.data || [];
        this.jalonsAll = jalons
          .map(
            (j: any) =>
              ({
                id: j.id,
                libelle: j.libelle || j.code || '',
                code: j.code || '',
                parent: j.parent ?? null,
                jalonParentId: j.jalonParentId ?? j.jalonId ?? undefined,
                active: j.active !== undefined ? j.active : j.isActive !== undefined ? j.isActive : true,
              }) as JalonOption,
          )
          .filter((j: JalonOption) => j.id && j.libelle && j.active);

        this.jalonsParents = this.jalonsAll.filter((j) => {
          const parentObj: any = j.parent;
          const parentId = parentObj && typeof parentObj === 'object' ? parentObj.id : null;
          return !parentId && !j.jalonParentId;
        });

        this.applySavedJalonSelection();
      },
      () => {
        this.jalonsAll = [];
        this.jalonsParents = [];
        this.sousJalons = [];
      },
    );
  }

  private loadSpecialites(): void {
    this.planificationAuditService.getSpecialites().subscribe(
      (resp) => {
        const data = (resp && (resp.body as any)) || [];
        const specialites = Array.isArray(data) ? data : data.data || [];
        this.listeSpecialites = specialites
          .map((s: any) => ({ id: s.id, libelle: s.libelle || '' }))
          .filter((s: any) => s.id && s.libelle);
      },
      () => {
        this.listeSpecialites = [];
      },
    );
  }

  private loadRessources(): void {
    this.planificationAuditService.getRessources().subscribe(
      (resp) => {
        const data = (resp && (resp.body as any)) || [];
        const ressources = Array.isArray(data) ? data : data.data || [];
        this.ressources = ressources.filter((r: any) => r.id);
      },
      () => {
        this.ressources = [];
      },
    );
  }

  getRessourceDisplayName(ressource: any): string {
    if (ressource.prenoms && ressource.nom) {
      return `${ressource.prenoms} ${ressource.nom}`;
    }
    if (ressource.nom) {
      return ressource.nom;
    }
    return ressource.code || '';
  }

  onJalonParentChange(jalonParentId: number | null): void {
    this.selectedJalonParentId = jalonParentId;
    this.selectedSousJalonId = null;
    this.sousJalons = [];
    this.form.applicationId = 0;

    if (!jalonParentId) {
      return;
    }

    this.sousJalons = this.jalonsAll.filter((j) => {
      const parentObj: any = j.parent;
      const parentId = parentObj && typeof parentObj === 'object' ? parentObj.id : null;
      return parentId === jalonParentId || j.jalonParentId === jalonParentId;
    });
  }

  onSousJalonChange(sousJalonId: number | null): void {
    this.selectedSousJalonId = sousJalonId;
    this.form.applicationId = 0;
  }

  private applySavedJalonSelection(): void {
    if (!this.savedJalonIdFromApi || this.jalonsAll.length === 0) {
      return;
    }

    const saved = this.jalonsAll.find((j) => j.id === this.savedJalonIdFromApi);
    if (!saved) {
      return;
    }

    const parentObj: any = saved.parent;
    const parentId = parentObj && typeof parentObj === 'object' ? parentObj.id : saved.jalonParentId ?? null;

    if (parentId) {
      this.selectedJalonParentId = parentId;
      this.sousJalons = this.jalonsAll.filter((j) => {
        const p: any = j.parent;
        const pid = p && typeof p === 'object' ? p.id : null;
        return pid === parentId || j.jalonParentId === parentId;
      });
      this.selectedSousJalonId = saved.id ?? null;
    } else {
      this.selectedJalonParentId = saved.id ?? null;
      this.sousJalons = this.jalonsAll.filter((j) => {
        const p: any = j.parent;
        const pid = p && typeof p === 'object' ? p.id : null;
        return pid === (saved.id ?? null) || j.jalonParentId === (saved.id ?? null);
      });
      this.selectedSousJalonId = null;
    }
  }

  private getSelectedJalonIdToSave(): number | null {
    return this.selectedSousJalonId ?? this.selectedJalonParentId ?? null;
  }

  onSubmit(): void {
    if (this.submitting) {
      return;
    }

    // Validation : si des sous-jalons existent, on doit en choisir un
    if (this.selectedJalonParentId && this.sousJalons.length > 0 && !this.selectedSousJalonId) {
      this.snackBar.open('Veuillez sélectionner un sous jalon.', 'Fermer', { duration: 4000 });
      return;
    }

    const dateReel = this.formatDate(this.form.dateRealisation);
    const dateEcheance = this.formatDate(this.form.echeanceActions);
    if (dateReel && dateEcheance && dateEcheance < dateReel) {
      this.snackBar.open("L'échéance des actions ne peut pas être antérieure à la date de réalisation.", 'Fermer', {
        duration: 4000,
      });
      return;
    }

    let tauxPayload: number | undefined = undefined;
    if (this.form.tauxRealisation !== null && this.form.tauxRealisation !== undefined) {
      const n = Math.round(Number(this.form.tauxRealisation));
      if (!Number.isNaN(n)) {
        tauxPayload = Math.max(0, Math.min(100, n));
      }
    }

    const payload: any = {
      code: this.form.code || undefined,
      auditId: this.form.auditId || undefined,
      typeAudit: this.form.typeAudit || undefined,
      objectifAudit: this.form.objectifAudit || undefined,
      dateRealisation: dateReel || undefined,
      serviceId: this.form.serviceId || undefined,
      auditeurId: this.form.auditeurId && this.form.auditeurId !== 0 ? this.form.auditeurId : undefined,
      jalonId: this.getSelectedJalonIdToSave() || undefined,
      resultats: this.form.resultats || undefined,
      nonConformitesDetectees: this.form.nonConformitesDetectees || undefined,
      recommandations: this.form.recommandations || undefined,
      responsableId: this.form.responsableId && this.form.responsableId !== 0 ? this.form.responsableId : undefined,
      echeanceActions: dateEcheance || undefined,
      tauxRealisation: tauxPayload,
      commentaires: this.form.commentaires || undefined,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });

    this.submitting = true;

    if (this.isEdit && this.form.id) {
      this.planificationAuditService.update(this.form.id, payload).subscribe(
        (response) => {
          this.submitting = false;
          if (response.status === 200 || response.status === 201) {
            this.snackBar.open("Planification d'audit modifiée avec succès !", 'Fermer', { duration: 2500 });
            this.goBack();
          } else {
            this.snackBar.open('Erreur lors de la modification.', 'Fermer', { duration: 3000 });
          }
        },
        (error) => {
          this.submitting = false;
          this.errorHandler.showError(error);
        },
      );
      return;
    }

    this.planificationAuditService.create(payload).subscribe(
      (response) => {
        this.submitting = false;
        if (response.status === 200 || response.status === 201) {
          this.snackBar.open("Planification d'audit enregistrée avec succès !", 'Fermer', { duration: 2500 });
          this.goBack();
        } else {
          this.snackBar.open("Erreur lors de l'enregistrement.", 'Fermer', { duration: 3000 });
        }
      },
      (error) => {
        this.submitting = false;
        this.errorHandler.showError(error);
      },
    );
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

  private refId(value: any): number | null {
    if (value == null) {
      return null;
    }
    if (typeof value === 'object') {
      return value.id != null ? value.id : null;
    }
    if (typeof value === 'number') {
      return value;
    }
    return null;
  }

  private formatDate(dateString: string | undefined): string | undefined {
    if (!dateString) {
      return undefined;
    }
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  }

  private formatDateForInput(dateString: string | undefined): string {
    if (!dateString) {
      return '';
    }
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  }
}
