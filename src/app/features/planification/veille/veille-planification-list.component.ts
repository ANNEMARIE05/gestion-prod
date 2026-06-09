import { Component, OnInit, AfterViewInit, ViewChild, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlanificationVeilleService } from '../services/planificationVeille.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { PermissionService } from '../../../core/services/permission.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { APP_ROUTES } from '../../../utils/app-routes';

interface VeilleListItem {
  id: number;
  code: string;
  veilleLibelle: string;
  thematique: string;
  jalonLibelle: string;
  responsable: string;
  statut: string;
  dateDecouverte: string;
  createdAt: string;
}

interface VeilleTableFilter {
  q?: string;
  thematique?: string;
  statut?: string;
  date?: string;
}

@Component({
  selector: 'app-veille-planification-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="space-y-8">
      <!-- En-tête -->
      <div class="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Planning Ingénierie &amp; Veille</h1>
          <p class="text-sm text-gray-500">Planifiez les taches et les ressources.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
            <input #csvInput type="file" accept=".csv,text/csv" class="hidden" (change)="importCsv($event)" />
            @if (perm.canImport()) {
              <button
                mat-stroked-button
                type="button"
                (click)="csvInput.click()"
                class="!rounded-2xl !border-slate-200 !text-slate-600 !py-4 !px-5 !mb-1 bg-white shadow-sm"
              >
                <mat-icon class="mr-2">upload_file</mat-icon>
                Importer
              </button>
            }
            @if (perm.canExport()) {
              <button
                mat-stroked-button
                type="button"
                (click)="exportCsv()"
                class="!rounded-2xl !border-slate-200 !text-slate-600 !py-4 !px-5 !mb-1 bg-white shadow-sm"
              >
                <mat-icon class="mr-2">file_download</mat-icon>
                Exporter
              </button>
            }
            @if (perm.canCreate()) {
              <button
                mat-flat-button
                color="primary"
                type="button"
                (click)="handleCreate()"
                class="!rounded-2xl !px-7 !py-4 !mb-1 shadow-xl shadow-indigo-200"
              >
                <mat-icon class="mr-2">add</mat-icon>
                Nouvelle planification
              </button>
            }
          </div>
        </div>

        <div class="space-y-4">
        <!-- Barre de recherche / filtres -->
        <div class="app-list-toolbar">
          <div class="app-search-shell">
            <mat-icon class="text-gray-400 mr-3">search</mat-icon>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="filterSearch.set($event); syncTableFilter()"
              placeholder="Code, veille, thématique, responsable…"
              class="app-search-input"
            />
          </div>

          <div class="app-list-filters flex-wrap">
            <mat-form-field appearance="outline" class="app-filter-field" subscriptSizing="dynamic">
              <mat-select
                aria-label="Thématique"
                panelClass="app-filter-select-panel"
                [value]="filterThematique()"
                (selectionChange)="filterThematique.set($event.value); syncTableFilter()"
              >
                <mat-select-trigger>
                  <span class="app-select-trigger-row" [class.app-select-trigger-row--empty]="!filterThematique()">
                    <span class="app-select-trigger-row__primary">{{ filterThematique() || 'Thématique' }}</span>
                  </span>
                </mat-select-trigger>
                <mat-option value="">
                  <span class="app-select-option-row"><span class="app-select-option-row__primary">Toutes les thématiques</span></span>
                </mat-option>
                @for (opt of thematiqueOptions(); track opt) {
                  <mat-option [value]="opt">
                    <span class="app-select-option-row"><span class="app-select-option-row__primary">{{ opt }}</span></span>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="app-filter-field" subscriptSizing="dynamic">
              <mat-select
                aria-label="Statut"
                panelClass="app-filter-select-panel"
                [value]="filterStatut()"
                (selectionChange)="filterStatut.set($event.value); syncTableFilter()"
              >
                <mat-select-trigger>
                  <span class="app-select-trigger-row" [class.app-select-trigger-row--empty]="!filterStatut()">
                    <span class="app-select-trigger-row__primary">{{ filterStatut() || 'Statut' }}</span>
                  </span>
                </mat-select-trigger>
                <mat-option value="">
                  <span class="app-select-option-row"><span class="app-select-option-row__primary">Tous les statuts</span></span>
                </mat-option>
                @for (opt of statutOptions(); track opt) {
                  <mat-option [value]="opt">
                    <span class="app-select-option-row"><span class="app-select-option-row__primary">{{ opt }}</span></span>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <div class="app-search-shell">
              <mat-icon class="text-gray-400 mr-3">event</mat-icon>
              <input
                type="date"
                [(ngModel)]="filterDate"
                (ngModelChange)="syncTableFilter()"
                class="app-search-input"
              />
            </div>
            <button
              *ngIf="filterDate || filterThematique() || filterStatut() || searchTerm"
              (click)="clearFilters()"
              class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            >
              Réinitialiser
            </button>
            @if (perm.canDownloadTemplate()) {
              <button
                mat-stroked-button
                type="button"
                (click)="downloadTemplateCsv()"
                matTooltip="Télécharger le modèle CSV"
                class="app-toolbar-template-btn"
              >
                <mat-icon>download</mat-icon>
                Télécharger modèle
              </button>
            }
          </div>
        </div>

        <!-- Tableau -->
        <div class="premium-card overflow-hidden bg-white">
          <div class="app-table-scroll">
            <table mat-table [dataSource]="dataSource" class="planification-table w-full min-w-[64rem]">
              <ng-container matColumnDef="index">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold w-14">N°</th>
                <td mat-cell *matCellDef="let element; let i = index" class="text-sm text-gray-600 tabular-nums w-14">
                  {{ rowNumber(i) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold">Identification</th>
                <td mat-cell *matCellDef="let element" class="text-sm font-medium text-gray-900">{{ element.code || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="veille">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold">Veille</th>
                <td mat-cell *matCellDef="let element" class="text-sm text-gray-600">{{ element.veilleLibelle || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="thematique">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold">Thématique</th>
                <td mat-cell *matCellDef="let element" class="text-sm text-gray-600">{{ element.thematique || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="jalon">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold">Jalon</th>
                <td mat-cell *matCellDef="let element" class="text-sm text-gray-600">{{ element.jalonLibelle || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="responsable">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold">Responsable</th>
                <td mat-cell *matCellDef="let element" class="text-sm text-gray-600">{{ element.responsable || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="statut">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold planification-col-status">Statut</th>
                <td mat-cell *matCellDef="let element" class="planification-col-status">
                  <mat-chip-set>
                    <mat-chip
                      class="!text-xs !font-semibold"
                      [ngClass]="{
                        '!bg-emerald-50 !text-emerald-900': element.statut === 'Terminé',
                        '!bg-amber-50 !text-amber-900': element.statut === 'En cours',
                        '!bg-slate-100 !text-slate-700': element.statut !== 'Terminé' && element.statut !== 'En cours'
                      }"
                    >
                      {{ element.statut || 'N/A' }}
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold whitespace-nowrap">
                  Date de création
                </th>
                <td mat-cell *matCellDef="let element" class="text-sm text-gray-600 whitespace-nowrap">
                  {{ formatDate(element.createdAt) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold text-right">Actions</th>
                <td mat-cell *matCellDef="let element" class="text-right whitespace-nowrap">
                  <div class="planification-actions">
                    <button
                      *ngIf="perm.canView()"
                      mat-icon-button
                      (click)="viewDetail(element.id)"
                      class="text-gray-400 hover:text-primary transition-colors"
                      matTooltip="Voir détails"
                    >
                      <mat-icon class="!text-lg">visibility</mat-icon>
                    </button>
                    <button
                      *ngIf="perm.canEdit()"
                      mat-icon-button
                      (click)="editVeille(element.id)"
                      class="text-gray-400 hover:text-blue-600 transition-colors"
                      matTooltip="Modifier"
                    >
                      <mat-icon class="!text-lg">edit</mat-icon>
                    </button>
                    <button
                      *ngIf="perm.canDelete()"
                      mat-icon-button
                      (click)="deleteVeille(element)"
                      class="text-gray-400 hover:text-red-500 transition-colors"
                      matTooltip="Supprimer"
                    >
                      <mat-icon class="!text-lg">delete_outline</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns" class="hover:bg-gray-50/50 transition-colors"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell p-8 text-center text-gray-500" [attr.colspan]="displayedColumns.length">
                  {{ isLoading ? 'Chargement...' : 'Aucune information enregistrée' }}
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator [pageSizeOptions]="[5, 10, 25]" aria-label="Sélectionner la page"></mat-paginator>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .planification-table .mat-mdc-header-cell,
      .planification-table .mat-mdc-cell {
        padding-top: 0.9rem !important;
        padding-bottom: 0.9rem !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        vertical-align: middle;
        white-space: nowrap;
      }
      .planification-table .mat-mdc-header-cell:first-child,
      .planification-table .mat-mdc-cell:first-child {
        padding-left: 1.25rem !important;
      }
      .planification-table .mat-mdc-header-cell:last-child,
      .planification-table .mat-mdc-cell:last-child {
        padding-right: 1.25rem !important;
      }
      .planification-table .planification-col-label {
        white-space: normal;
        min-width: 10rem;
        max-width: 16rem;
      }
      .planification-table .planification-col-owner {
        min-width: 9rem;
        white-space: normal;
      }
      .planification-table .planification-col-progress {
        min-width: 9rem;
        white-space: normal;
      }
      .planification-table .planification-col-status {
        min-width: 7rem;
        white-space: normal;
      }
      .planification-actions {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.125rem;
        min-width: 7.5rem;
      }
      .planification-actions .mat-mdc-icon-button {
        flex-shrink: 0;
      }
      .planification-actions mat-icon {
        font-family: 'Material Icons' !important;
      }
    `,
  ],
})
export class VeillePlanificationListComponent implements OnInit, AfterViewInit {
  readonly perm = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly planificationVeilleService = inject(PlanificationVeilleService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly displayedColumns = ['index', 'code', 'veille', 'thematique', 'jalon', 'responsable', 'statut', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<VeilleListItem>([]);
  isLoading = false;

  searchTerm = '';
  filterDate: string | null = null;
  readonly filterSearch = signal('');
  readonly filterThematique = signal('');
  readonly filterStatut = signal('');

  private readonly veillesSignal = signal<VeilleListItem[]>([]);

  readonly thematiqueOptions = computed(() =>
    [...new Set(this.veillesSignal().map((v) => v.thematique).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  );
  readonly statutOptions = computed(() =>
    [...new Set(this.veillesSignal().map((v) => v.statut).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  );

  constructor() {
    this.dataSource.filterPredicate = (item: VeilleListItem, raw: string) => {
      const f: VeilleTableFilter = raw ? JSON.parse(raw) : {};
      if (f.thematique && item.thematique !== f.thematique) {
        return false;
      }
      if (f.statut && item.statut !== f.statut) {
        return false;
      }
      if (f.date && (item.dateDecouverte || '').split('T')[0] !== f.date) {
        return false;
      }
      const q = (f.q ?? '').trim().toLowerCase();
      if (!q) {
        return true;
      }
      const haystack = [item.code, item.veilleLibelle, item.thematique, item.jalonLibelle, item.responsable, item.statut]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    };
  }

  ngOnInit(): void {
    this.loadVeilles();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  private loadVeilles(): void {
    this.isLoading = true;
    this.planificationVeilleService.list({} as any).subscribe(
      (response) => {
        this.isLoading = false;
        const data = (response && (response.body as any)) || [];
        const veilles = Array.isArray(data) ? data : data.data || [];

        const mapped: VeilleListItem[] = veilles.map((v: any) => {
          const veilleObj = v.veilleId || v.veille;
          const veilleLibelle = veilleObj ? veilleObj.libelle || veilleObj.code || '' : '';

          const jalonObj = v.jalonId || v.jalon;
          const jalonLibelle = jalonObj ? jalonObj.libelle || jalonObj.code || '' : '';

          const responsableObj = v.responsableId || v.ressourceId;
          let responsable = '';
          if (responsableObj) {
            const nom = responsableObj.nom || '';
            const prenoms = responsableObj.prenoms || '';
            if (prenoms && nom) {
              responsable = `${prenoms} ${nom}`;
            } else if (nom) {
              responsable = nom;
            } else if (prenoms) {
              responsable = prenoms;
            }
          }

          const dateDecouverte = v.dateDecouverte || '';

          return {
            id: v.id,
            code: v.identification || v.code || '',
            veilleLibelle,
            thematique: v.thematique || '',
            jalonLibelle,
            responsable,
            statut: v.statut || '',
            dateDecouverte,
            createdAt: v.createdAt || dateDecouverte,
          } as VeilleListItem;
        });

        this.veillesSignal.set(mapped);
        this.dataSource.data = mapped;
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        this.syncTableFilter();
      },
      (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
        this.veillesSignal.set([]);
        this.dataSource.data = [];
      },
    );
  }

  syncTableFilter(): void {
    const filter: VeilleTableFilter = {
      q: this.filterSearch() || undefined,
      thematique: this.filterThematique() || undefined,
      statut: this.filterStatut() || undefined,
      date: this.filterDate || undefined,
    };
    this.dataSource.filter = JSON.stringify(filter);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterDate = null;
    this.filterSearch.set('');
    this.filterThematique.set('');
    this.filterStatut.set('');
    this.syncTableFilter();
  }

  rowNumber(indexOnPage: number): number {
    const p = this.paginator;
    if (!p) {
      return indexOnPage + 1;
    }
    return p.pageIndex * p.pageSize + indexOnPage + 1;
  }

  handleCreate(): void {
    void this.router.navigate([APP_ROUTES.planifications.ingenierieCreate]);
  }

  viewDetail(id: number): void {
    void this.router.navigate([APP_ROUTES.planifications.ingenierieDetail(id)]);
  }

  editVeille(id: number): void {
    void this.router.navigate([APP_ROUTES.planifications.ingenierieEdit(id)]);
  }

  deleteVeille(veille: VeilleListItem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la planification de veille',
        message: `Supprimer « ${veille.code || veille.veilleLibelle || 'cette veille'} » ? Cette action est irréversible.`,
        isDelete: true,
        confirmText: 'Supprimer',
      },
    });

    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (!ok) {
        return;
      }
      this.planificationVeilleService.delete(veille.id).subscribe(
        (response) => {
          if (response.status === 200 || response.status === 204) {
            this.snackBar.open('Planification de veille supprimée avec succès !', 'Fermer', { duration: 2500 });
            this.loadVeilles();
          } else {
            this.snackBar.open('Erreur lors de la suppression.', 'Fermer', { duration: 3000 });
          }
        },
        (error) => {
          this.errorHandler.showError(error);
        },
      );
    });
  }

  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.planificationVeilleService.importCsv(file).subscribe({
      next: (response) => {
        input.value = '';
        if (response.status >= 200 && response.status < 300) {
          this.snackBar.open('Import réussi !', 'Fermer', { duration: 3000 });
          this.loadVeilles();
        } else {
          this.snackBar.open("Erreur lors de l'import.", 'Fermer', { duration: 5000 });
        }
      },
      error: (err: unknown) => {
        input.value = '';
        this.errorHandler.showError(err);
      },
    });
  }

  exportCsv(): void {
    this.planificationVeilleService.exportCsv().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        const date = new Date().toISOString().split('T')[0];
        this.downloadBlob(response.body, `planifications-veilles_${date}.csv`);
      },
      error: (err: unknown) => this.errorHandler.showError(err),
    });
  }

  downloadTemplateCsv(): void {
    this.planificationVeilleService.downloadTemplate().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        this.downloadBlob(response.body, 'modele_planifications-veilles.csv');
      },
      error: (err: unknown) => this.errorHandler.showError(err),
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return '-';
    }
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  }
}
