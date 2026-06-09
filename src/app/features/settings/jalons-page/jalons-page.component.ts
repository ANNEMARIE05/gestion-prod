import { AfterViewInit, Component, ViewChild, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { Jalon, SettingsService } from '../../../services/settings.service';
import { JalonsService } from '../../../services/jalons.service';
import { PermissionService } from '../../../services/permission.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSkeletonTableComponent } from '../../../shared/components/loading-skeleton-table/loading-skeleton-table.component';
import { encodeTableFilter, decodeTableFilter } from '../../../utils/table-filter';

@Component({
  selector: 'app-jalons-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatDialogModule,
    LoadingSkeletonTableComponent,
  ],
  templateUrl: './jalons-page.component.html',
})
export class JalonsPageComponent implements AfterViewInit {
  readonly perm = inject(PermissionService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly displayedColumns: string[] = [
    'numero',
    'code',
    'label',
    'parent',
    'applications',
    'creation',
    'actions',
  ];
  readonly dataSource = new MatTableDataSource<Jalon>([]);
  isLoading = true;

  readonly filterSearch = signal('');

  private readonly jalonsApi = inject(JalonsService);

  constructor() {
    this.dataSource.filterPredicate = (row: Jalon, raw: string) => {
      const f = decodeTableFilter(raw);
      const q = (f.q ?? '').trim().toLowerCase();
      if (!q) {
        return true;
      }
      const apps = this.getApplications(row).join(' ').toLowerCase();
      const parentLabel = row.parentId
        ? this.settings.allJalons().find((j) => j.id === row.parentId)?.label ?? ''
        : '';
      const haystack = [row.label, row.code, parentLabel, apps].join(' ').toLowerCase();
      return haystack.includes(q);
    };

    effect(() => {
      this.dataSource.data = [...this.settings.allJalons()];
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.syncFilter();
    });

    window.setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event): void {
    this.filterSearch.set((event.target as HTMLInputElement).value);
    this.syncFilter();
  }

  syncFilter(): void {
    this.dataSource.filter = encodeTableFilter({
      q: this.filterSearch(),
    });
  }

  rowNumber(indexOnPage: number): number {
    const p = this.paginator;
    if (!p) return indexOnPage + 1;
    return p.pageIndex * p.pageSize + indexOnPage + 1;
  }

  goToEdit(row: Jalon): void {
    void this.router.navigate(['/parametrages/jalons/edit', row.id]);
  }

  goToDetail(row: Jalon): void {
    void this.router.navigate(['/parametrages/jalons', row.id]);
  }

  getApplications(row: Jalon): string[] {
    if (!row.applicationIds?.length) return [];
    const labels = row.applicationIds
      .map((id) => this.settings.getApplicationById(id)?.label)
      .filter((label): label is string => !!label);
    return labels;
  }

  getParentLabel(row: Jalon): string {
    if (!row.parentId) return '—';
    return this.settings.getJalonById(row.parentId)?.label ?? '—';
  }

  displayCode(row: Jalon): string {
    return row.code || `JAL-${row.id}`;
  }

  exportCsv(): void {
    this.jalonsApi.exportCsv().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        const date = new Date().toISOString().split('T')[0];
        this.downloadBlob(response.body, `jalons_${date}.csv`);
      },
      error: (err: unknown) =>
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
    });
  }

  downloadTemplateCsv(): void {
    this.jalonsApi.downloadTemplate().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        this.downloadBlob(response.body, 'modele_jalons.csv');
      },
      error: (err: unknown) =>
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
    });
  }

  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.jalonsApi.importCsv(file).subscribe({
      next: (response) => {
        input.value = '';
        if (response.status >= 200 && response.status < 300) {
          this.settings.refreshSettings();
          this.snackBar.open('Import réussi', 'Fermer', { duration: 3000 });
        } else {
          this.snackBar.open('Erreur lors de l\'import', 'Fermer', { duration: 5000 });
        }
      },
      error: (err: unknown) => {
        input.value = '';
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 });
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  remove(row: Jalon): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le jalon',
        message: `Supprimer « ${row.label} » ? Cette action est irréversible.`,
        isDelete: true,
        confirmText: 'Supprimer',
      },
    });
    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.settings.deleteJalon(row.id).subscribe({
        next: () => this.snackBar.open('Jalon supprimé avec succès', 'Fermer', { duration: 3000 }),
        error: (err: unknown) =>
          this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
      });
    });
  }
}
