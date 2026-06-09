import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlanificationVeilleService } from '../services/planificationVeille.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { APP_ROUTES } from '../../../utils/app-routes';

interface VeilleForm {
  id?: number;
  code: string;
  veilleId: number | null;
  thematique: string;
  specialiteId: number | null;
  source: string;
  dateDecouverte: string;
  jalonId: number | null;
  opportuniteDetectee: string;
  niveauMaturite: string;
  ressourceId: number | 0;
  impactPotentiel: string;
  actionEntreprise: string;
  statut: string;
  dateFin: string;
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
  selector: 'app-veille-planification-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="max-w-5xl mx-auto py-6 px-1">
      <div class="bg-white rounded-lg shadow-premium border border-slate-100 p-6 md:p-8">
        <div class="flex items-center justify-between mb-6 gap-2">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 pr-2">
            {{ isEdit ? 'Modifier la planification de veille' : 'Nouvelle planification de veille' }}
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
          <!-- Informations principales -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Informations principales</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Identification -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Identification</label>
                <input
                  type="text"
                  [value]="form.code"
                  readonly
                  disabled
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  placeholder="Généré automatiquement"
                />
              </div>

              <!-- Veille -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Veille <span class="text-red-500">*</span></label>
                <select
                  [(ngModel)]="form.veilleId"
                  name="veilleId"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option [ngValue]="null">Sélectionner une veille...</option>
                  <option *ngFor="let veille of veilles" [ngValue]="veille.id">{{ veille.libelle || veille.code }}</option>
                </select>
              </div>

              <!-- Thématique -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Thématique <span class="text-red-500">*</span></label>
                <select
                  [(ngModel)]="form.thematique"
                  name="thematique"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  <option value="IA">IA</option>
                  <option value="Cybersécurité">Cybersécurité</option>
                  <option value="Cloud">Cloud</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Data/BI">Data/BI</option>
                </select>
              </div>

              <!-- Service concerné -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Service concerné</label>
                <select
                  [(ngModel)]="form.specialiteId"
                  name="specialiteId"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option [ngValue]="null">Sélectionner une spécialité...</option>
                  <option *ngFor="let specialite of listeSpecialites" [ngValue]="specialite.id">{{ specialite.libelle }}</option>
                </select>
              </div>

              <!-- Source -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Source <span class="text-red-500">*</span></label>
                <select
                  [(ngModel)]="form.source"
                  name="source"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Conférence">Conférence</option>
                  <option value="Article">Article</option>
                  <option value="Projet interne">Projet interne</option>
                  <option value="Webinaire">Webinaire</option>
                  <option value="Formation">Formation</option>
                </select>
              </div>

              <!-- Date de découverte -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Date de découverte <span class="text-red-500">*</span></label>
                <input
                  type="date"
                  [(ngModel)]="form.dateDecouverte"
                  name="dateDecouverte"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
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
                <label class="block text-sm font-medium text-gray-700 mb-2">Sous jalon</label>
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
            </div>
          </div>

          <!-- Détails de l'opportunité -->
          <div class="border-b border-gray-200 pb-6 space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Opportunité détectée <span class="text-red-500">*</span></label>
              <textarea
                [(ngModel)]="form.opportuniteDetectee"
                name="opportuniteDetectee"
                rows="3"
                required
                placeholder="Décrire l'opportunité identifiée..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              ></textarea>
            </div>

            <div class="flex flex-col md:flex-row gap-6">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">Niveau de maturité <span class="text-red-500">*</span></label>
                <select
                  [(ngModel)]="form.niveauMaturite"
                  name="niveauMaturite"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Veille">Veille</option>
                  <option value="Etude">Etude</option>
                  <option value="PoC">PoC</option>
                  <option value="Développement">Développement</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">Responsable</label>
                <select
                  [(ngModel)]="form.ressourceId"
                  name="ressourceId"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  <option [ngValue]="0">-- Sélectionner un responsable --</option>
                  <option *ngFor="let ressource of ressources" [ngValue]="ressource.id">{{ getRessourceDisplayName(ressource) }}</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">Impact potentiel <span class="text-red-500">*</span></label>
                <select
                  [(ngModel)]="form.impactPotentiel"
                  name="impactPotentiel"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Élevé">Élevé</option>
                  <option value="Moyen">Moyen</option>
                  <option value="Faible">Faible</option>
                </select>
              </div>
            </div>

            <div class="flex flex-col md:flex-row gap-6">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">Action entreprise <span class="text-red-500">*</span></label>
                <select
                  [(ngModel)]="form.actionEntreprise"
                  name="actionEntreprise"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  <option value="">Sélectionner...</option>
                  <option value="étude">Étude</option>
                  <option value="test">Test</option>
                  <option value="formation">Formation</option>
                  <option value="intégration">Intégration</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">Statut <span class="text-red-500">*</span></label>
                <select
                  [(ngModel)]="form.statut"
                  name="statut"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  <option value="">Sélectionner...</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                <input
                  type="date"
                  [(ngModel)]="form.dateFin"
                  name="dateFin"
                  [min]="form.dateDecouverte || null"
                  class="w-full px-3 py-2 sm:px-4 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <!-- Commentaires -->
          <div class="pb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Commentaires</label>
            <textarea
              [(ngModel)]="form.commentaires"
              name="commentaires"
              rows="4"
              placeholder="Ajouter des commentaires, décisions prises, prochaines étapes..."
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
export class VeillePlanificationFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly planificationVeilleService = inject(PlanificationVeilleService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly snackBar = inject(MatSnackBar);

  form: VeilleForm = this.emptyForm();

  isEdit = false;
  loading = false;
  submitting = false;

  jalonsAll: JalonOption[] = [];
  jalonsParents: JalonOption[] = [];
  sousJalons: JalonOption[] = [];

  selectedJalonParentId: number | null = null;
  selectedSousJalonId: number | null = null;
  private savedJalonIdFromApi: number | null = null;

  veilles: { id: number; code: string; libelle: string }[] = [];
  listeSpecialites: { id: number; libelle: string }[] = [];
  ressources: any[] = [];

  ngOnInit(): void {
    this.loadVeilles();
    this.loadJalons();
    this.loadSpecialites();
    this.loadRessources();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.loadVeille(Number(idParam));
    } else {
      this.generateCode();
    }
  }

  private emptyForm(): VeilleForm {
    return {
      code: '',
      veilleId: null,
      thematique: '',
      specialiteId: null,
      source: '',
      dateDecouverte: '',
      jalonId: null,
      opportuniteDetectee: '',
      niveauMaturite: '',
      ressourceId: 0,
      impactPotentiel: '',
      actionEntreprise: '',
      statut: '',
      dateFin: '',
      commentaires: '',
    };
  }

  /** Génère un code unique automatiquement (format P_VEIL-001). */
  private generateCode(): void {
    this.planificationVeilleService.list({} as any).subscribe(
      (resp) => {
        const data = (resp && (resp.body as any)) || [];
        const planifsData = Array.isArray(data) ? data : data.data || [];
        const codes = planifsData
          .map((p: any) => p.code || p.identification || '')
          .filter((code: string) => code && code.startsWith('P_VEIL-'))
          .map((code: string) => {
            const match = code.match(/P_VEIL-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((num: number) => num > 0);
        const nextNumber = codes.length > 0 ? Math.max(...codes) + 1 : 1;
        this.form.code = `P_VEIL-${String(nextNumber).padStart(3, '0')}`;
      },
      () => {
        this.form.code = 'P_VEIL-001';
      },
    );
  }

  private loadVeille(id: number): void {
    this.loading = true;
    this.planificationVeilleService.getById(id).subscribe(
      (response) => {
        const data = this.extractItem(response.body);
        if (!data) {
          this.loading = false;
          this.snackBar.open('Planification de veille non trouvée', 'Fermer', { duration: 3000 });
          this.goBack();
          return;
        }

        const veilleIdValue = this.refId(data.veilleId || data.veille);
        const specialiteIdValue = this.refId(data.specialiteId || data.serviceId || data.service);
        const jalonIdValue = this.refId(data.jalonId || data.jalon);
        const ressourceIdValue = this.refId(data.ressourceId || data.responsableId) ?? 0;

        this.savedJalonIdFromApi = jalonIdValue;

        this.form = {
          id: data.id,
          code: data.code || data.identification || '',
          veilleId: veilleIdValue,
          thematique: data.thematique || '',
          specialiteId: specialiteIdValue,
          source: data.source || '',
          dateDecouverte: this.formatDateForInput(data.dateDecouverte),
          jalonId: jalonIdValue,
          opportuniteDetectee: data.opportuniteDetectee || '',
          niveauMaturite: data.niveauMaturite || '',
          ressourceId: ressourceIdValue,
          impactPotentiel: data.impactPotentiel || '',
          actionEntreprise: data.actionEntreprise || '',
          statut: data.statut || '',
          dateFin: this.formatDateForInput(data.dateFin),
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

  private loadVeilles(): void {
    this.planificationVeilleService.getVeilles().subscribe(
      (resp) => {
        const data = (resp && (resp.body as any)) || [];
        const veilles = Array.isArray(data) ? data : data.data || [];
        this.veilles = veilles
          .map((v: any) => ({ id: v.id, code: v.code || '', libelle: v.libelle || '' }))
          .filter((v: any) => v.id);
      },
      () => {
        this.veilles = [];
      },
    );
  }

  private loadJalons(): void {
    this.planificationVeilleService.getJalons().subscribe(
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
    this.planificationVeilleService.getSpecialites().subscribe(
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
    this.planificationVeilleService.getRessources().subscribe(
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

    const dateDecouverte = this.formatDate(this.form.dateDecouverte);
    const dateFin = this.formatDate(this.form.dateFin);
    if (dateDecouverte && dateFin && dateFin < dateDecouverte) {
      this.snackBar.open('La date de fin ne peut pas être antérieure à la date de découverte.', 'Fermer', {
        duration: 4000,
      });
      return;
    }

    const payload: any = {
      code: this.form.code || undefined,
      veilleId: this.form.veilleId || undefined,
      thematique: this.form.thematique || undefined,
      specialiteId: this.form.specialiteId || undefined,
      source: this.form.source || undefined,
      dateDecouverte: dateDecouverte || undefined,
      jalonId: this.getSelectedJalonIdToSave() || undefined,
      opportuniteDetectee: this.form.opportuniteDetectee || undefined,
      niveauMaturite: this.form.niveauMaturite || undefined,
      ressourceId: this.form.ressourceId && this.form.ressourceId !== 0 ? this.form.ressourceId : undefined,
      impactPotentiel: this.form.impactPotentiel || undefined,
      actionEntreprise: this.form.actionEntreprise || undefined,
      statut: this.form.statut || undefined,
      dateFin: dateFin || undefined,
      commentaires: this.form.commentaires || undefined,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });

    this.submitting = true;

    if (this.isEdit && this.form.id) {
      this.planificationVeilleService.update(this.form.id, payload).subscribe(
        (response) => {
          this.submitting = false;
          if (response.status >= 200 && response.status < 300) {
            this.snackBar.open('Planification de veille modifiée avec succès !', 'Fermer', { duration: 2500 });
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

    this.planificationVeilleService.create(payload).subscribe(
      (response) => {
        this.submitting = false;
        if (response.status >= 200 && response.status < 300) {
          this.snackBar.open('Planification de veille enregistrée avec succès !', 'Fermer', { duration: 2500 });
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
