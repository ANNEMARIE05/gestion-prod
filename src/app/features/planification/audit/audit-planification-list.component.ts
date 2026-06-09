import { Component, OnInit, AfterViewInit, ViewChild, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlanificationAuditService } from '../../../services/planificationAudit.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { PermissionService } from '../../../services/permission.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { APP_ROUTES } from '../../../utils/app-routes';

interface AuditListItem {
  id: number;
  code: string;
  auditLibelle: string;
  serviceAudite: string;
  auditeurOrganisme: string;
  dateRealisation: string;
  jalonLibelle: string;
  tauxRealisation?: number | null;
}

interface AuditTableFilter {
  q?: string;
  audit?: string;
  service?: string;
  date?: string;
}

@Component({
  selector: 'app-audit-planification-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="space-y-8">
      <!-- En-tête -->
      <div class="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Planning Audits IT</h1>
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
              placeholder="Code, audit, service, auditeur…"
              class="app-search-input"
            />
          </div>

          <div class="app-list-filters flex-wrap">
            <mat-form-field appearance="outline" class="app-filter-field" subscriptSizing="dynamic">
              <mat-select
                aria-label="Audit"
                panelClass="app-filter-select-panel"
                [value]="filterAudit()"
                (selectionChange)="filterAudit.set($event.value); syncTableFilter()"
              >
                <mat-select-trigger>
                  <span class="app-select-trigger-row" [class.app-select-trigger-row--empty]="!filterAudit()">
                    <span class="app-select-trigger-row__primary">{{ filterAudit() || 'Audit' }}</span>
                  </span>
                </mat-select-trigger>
                <mat-option value="">
                  <span class="app-select-option-row"><span class="app-select-option-row__primary">Tous les audits</span></span>
                </mat-option>
                @for (opt of auditOptions(); track opt) {
                  <mat-option [value]="opt">
                    <span class="app-select-option-row"><span class="app-select-option-row__primary">{{ opt }}</span></span>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="app-filter-field" subscriptSizing="dynamic">
              <mat-select
                aria-label="Service audité"
                panelClass="app-filter-select-panel"
                [value]="filterService()"
                (selectionChange)="filterService.set($event.value); syncTableFilter()"
              >
                <mat-select-trigger>
                  <span class="app-select-trigger-row" [class.app-select-trigger-row--empty]="!filterService()">
                    <span class="app-select-trigger-row__primary">{{ filterService() || 'Service audité' }}</span>
                  </span>
                </mat-select-trigger>
                <mat-option value="">
                  <span class="app-select-option-row"><span class="app-select-option-row__primary">Tous les services</span></span>
                </mat-option>
                @for (opt of serviceOptions(); track opt) {
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
              *ngIf="filterDate || filterAudit() || filterService() || searchTerm"
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
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold">ID Audit</th>
                <td mat-cell *matCellDef="let element" class="text-sm font-medium text-gray-900">{{ element.code || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="audit">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold">Audit</th>
                <td mat-cell *matCellDef="let element" class="text-sm text-gray-600">{{ element.auditLibelle || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="service">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold">Service audité</th>
                <td mat-cell *matCellDef="let element" class="text-sm text-gray-600">{{ element.serviceAudite || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="auditeur">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold">Auditeur</th>
                <td mat-cell *matCellDef="let element" class="text-sm text-gray-600">{{ element.auditeurOrganisme || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold whitespace-nowrap">
                  Date de réalisation
                </th>
                <td mat-cell *matCellDef="let element" class="text-sm text-gray-600 whitespace-nowrap">
                  {{ formatDate(element.dateRealisation) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="jalon">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold">Jalons</th>
                <td mat-cell *matCellDef="let element" class="text-sm text-gray-600">{{ element.jalonLibelle || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="taux">
                <th mat-header-cell *matHeaderCellDef class="!bg-gray-50/50 !text-gray-600 !font-semibold planification-col-progress">Taux (%)</th>
                <td mat-cell *matCellDef="let element" class="planification-col-progress">
                  <div class="flex items-center gap-2 min-w-[7rem]">
                    <mat-progress-bar
                      mode="determinate"
                      [value]="tauxValue(element)"
                      class="h-1.5 rounded-full flex-1 min-w-[4rem]"
                    ></mat-progress-bar>
                    <span class="text-xs font-semibold text-gray-600 tabular-nums shrink-0">{{ tauxValue(element) }}%</span>
                  </div>
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
                      (click)="editAudit(element.id)"
                      class="text-gray-400 hover:text-blue-600 transition-colors"
                      matTooltip="Modifier"
                    >
                      <mat-icon class="!text-lg">edit</mat-icon>
                    </button>
                    <button
                      *ngIf="perm.canDelete()"
                      mat-icon-button
                      (click)="deleteAudit(element)"
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
export class AuditPlanificationListComponent implements OnInit, AfterViewInit {
  readonly perm = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly planificationAuditService = inject(PlanificationAuditService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly displayedColumns = ['index', 'code', 'audit', 'service', 'auditeur', 'date', 'jalon', 'taux', 'actions'];
  dataSource = new MatTableDataSource<AuditListItem>([]);
  isLoading = false;

  searchTerm = '';
  filterDate: string | null = null;
  readonly filterSearch = signal('');
  readonly filterAudit = signal('');
  readonly filterService = signal('');

  private readonly auditsSignal = signal<AuditListItem[]>([]);

  readonly auditOptions = computed(() =>
    [...new Set(this.auditsSignal().map((a) => a.auditLibelle).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  );
  readonly serviceOptions = computed(() =>
    [...new Set(this.auditsSignal().map((a) => a.serviceAudite).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  );

  constructor() {
    this.dataSource.filterPredicate = (item: AuditListItem, raw: string) => {
      const f: AuditTableFilter = raw ? JSON.parse(raw) : {};
      if (f.audit && item.auditLibelle !== f.audit) {
        return false;
      }
      if (f.service && item.serviceAudite !== f.service) {
        return false;
      }
      if (f.date && (item.dateRealisation || '').split('T')[0] !== f.date) {
        return false;
      }
      const q = (f.q ?? '').trim().toLowerCase();
      if (!q) {
        return true;
      }
      const haystack = [item.code, item.auditLibelle, item.serviceAudite, item.jalonLibelle, item.auditeurOrganisme]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    };
  }

  ngOnInit(): void {
    this.loadAudits();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  private loadAudits(): void {
    this.isLoading = true;
    this.planificationAuditService.list({} as any).subscribe(
      (response) => {
        this.isLoading = false;
        const data = (response && (response.body as any)) || [];
        const audits = Array.isArray(data) ? data : data.data || [];

        const mapped: AuditListItem[] = audits.map((audit: any) => {
          const auditObj = audit.auditId || audit.auditid;
          const auditLibelle = auditObj ? auditObj.libelle || '' : '';

          const serviceObj = audit.serviceId || audit.serviceid;
          const serviceLibelle = serviceObj ? serviceObj.libelle || serviceObj.code || '' : '';

          const jalonObj = audit.jalonId || audit.jalonid;
          const jalonLibelle = jalonObj ? jalonObj.libelle || jalonObj.code || '' : '';

          const auditeurObj = audit.auditeurId || audit.auditeurid;
          let auditeur = '';
          if (auditeurObj) {
            const nom = auditeurObj.nom || '';
            const prenoms = auditeurObj.prenoms || '';
            if (prenoms && nom) {
              auditeur = `${prenoms} ${nom}`;
            } else if (nom) {
              auditeur = nom;
            } else if (prenoms) {
              auditeur = prenoms;
            }
          }

          const tauxRealisation =
            typeof audit.tauxRealisation === 'string'
              ? parseFloat(audit.tauxRealisation)
              : audit.tauxRealisation != null
                ? audit.tauxRealisation
                : null;

          return {
            id: audit.id,
            code: audit.code || '',
            auditLibelle,
            serviceAudite: serviceLibelle,
            dateRealisation: audit.dateRealisation || '',
            auditeurOrganisme: auditeur,
            jalonLibelle,
            tauxRealisation,
          } as AuditListItem;
        });

        this.auditsSignal.set(mapped);
        this.dataSource.data = mapped;
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        this.syncTableFilter();
      },
      (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
        this.auditsSignal.set([]);
        this.dataSource.data = [];
      },
    );
  }

  syncTableFilter(): void {
    const filter: AuditTableFilter = {
      q: this.filterSearch() || undefined,
      audit: this.filterAudit() || undefined,
      service: this.filterService() || undefined,
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
    this.filterAudit.set('');
    this.filterService.set('');
    this.syncTableFilter();
  }

  rowNumber(indexOnPage: number): number {
    const p = this.paginator;
    if (!p) {
      return indexOnPage + 1;
    }
    return p.pageIndex * p.pageSize + indexOnPage + 1;
  }

  tauxValue(audit: AuditListItem): number {
    const n = Number(audit.tauxRealisation);
    if (Number.isNaN(n)) {
      return 0;
    }
    return Math.min(100, Math.max(0, n));
  }

  handleCreate(): void {
    void this.router.navigate([APP_ROUTES.planifications.auditsCreate]);
  }

  viewDetail(auditId: number): void {
    void this.router.navigate([APP_ROUTES.planifications.auditsDetail(auditId)]);
  }

  editAudit(auditId: number): void {
    void this.router.navigate([APP_ROUTES.planifications.auditsEdit(auditId)]);
  }

  deleteAudit(audit: AuditListItem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: "Supprimer la planification d'audit",
        message: `Supprimer « ${audit.code || audit.auditLibelle || 'cet audit'} » ? Cette action est irréversible.`,
        isDelete: true,
        confirmText: 'Supprimer',
      },
    });

    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (!ok) {
        return;
      }
      this.planificationAuditService.delete(audit.id).subscribe(
        (response) => {
          if (response.status === 200 || response.status === 204) {
            this.snackBar.open('Audit supprimé avec succès !', 'Fermer', { duration: 2500 });
            this.loadAudits();
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
    this.planificationAuditService.importCsv(file).subscribe({
      next: (response) => {
        input.value = '';
        if (response.status >= 200 && response.status < 300) {
          this.snackBar.open('Import réussi !', 'Fermer', { duration: 3000 });
          this.loadAudits();
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
    this.planificationAuditService.exportCsv().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        const date = new Date().toISOString().split('T')[0];
        this.downloadBlob(response.body, `planifications-audits_${date}.csv`);
      },
      error: (err: unknown) => this.errorHandler.showError(err),
    });
  }

  downloadTemplateCsv(): void {
    this.planificationAuditService.downloadTemplate().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        this.downloadBlob(response.body, 'modele_planifications-audits.csv');
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
