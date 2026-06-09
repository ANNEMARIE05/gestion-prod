import { AfterViewInit, Component, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Entity, SettingsService } from '../../../services/settings.service';
import { EntitesService } from '../../../services/entites.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { PermissionService } from '../../../services/permission.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { encodeTableFilter, decodeTableFilter } from '../../../utils/table-filter';

interface EntityRow {
  id: string;
  code: string;
  name: string;
  parentName: string | null;
  createdAt: Date | null;
  childNames: string[];
  raw: Entity;
}

function flattenEntities(items: Entity[], parentName: string | null = null): EntityRow[] {
  const out: EntityRow[] = [];
  for (const it of items) {
    out.push({
      id: it.id,
      code: it.code || `ENT-${it.id}`,
      name: it.name,
      parentName,
      createdAt: it.createdAt ?? null,
      childNames: (it.children ?? []).map((child) => child.name),
      raw: it,
    });
    if (it.children?.length) {
      out.push(...flattenEntities(it.children, it.name));
    }
  }
  return out;
}

@Component({
  selector: 'app-entites-page',
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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './entites-page.component.html',
})
export class EntitesPageComponent implements AfterViewInit {
  readonly perm = inject(PermissionService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly displayedColumns: string[] = ['numero', 'code', 'name', 'parent', 'active', 'createdAt', 'actions'];
  readonly dataSource = new MatTableDataSource<EntityRow>([]);

  readonly rows = computed<EntityRow[]>(() => flattenEntities(this.settings.allEntities()));

  readonly filterSearch = signal('');
  readonly activeFilter = signal<'all' | 'active' | 'inactive'>('all');

  private readonly entitesApi = inject(EntitesService);

  constructor() {
    this.dataSource.filterPredicate = (row: EntityRow, raw: string) => {
      const f = decodeTableFilter(raw);
      const active = f.active as 'active' | 'inactive' | '' | undefined;
      if (active === 'active' && !row.raw.active) {
        return false;
      }
      if (active === 'inactive' && row.raw.active) {
        return false;
      }
      const q = (f.q ?? '').trim().toLowerCase();
      if (!q) {
        return true;
      }
      return [row.code, row.name, row.parentName ?? '', ...row.childNames].join(' ').toLowerCase().includes(q);
    };

    effect(() => {
      this.dataSource.data = this.rows();
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.syncFilter();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event): void {
    this.filterSearch.set((event.target as HTMLInputElement).value);
    this.syncFilter();
  }

  onActiveFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.activeFilter.set(value);
    this.syncFilter();
  }

  syncFilter(): void {
    const a = this.activeFilter();
    this.dataSource.filter = encodeTableFilter({
      q: this.filterSearch(),
      active: a === 'all' ? '' : a,
    });
  }

  activeStateFilterTrigger(): { primary: string; meta: string } | null {
    switch (this.activeFilter()) {
      case 'active':
        return { primary: 'Actives', meta: 'Oui' };
      case 'inactive':
        return { primary: 'Inactives', meta: 'Non' };
      default:
        return null;
    }
  }

  rowNumber(indexOnPage: number): number {
    const p = this.paginator;
    if (!p) return indexOnPage + 1;
    return p.pageIndex * p.pageSize + indexOnPage + 1;
  }

  goToDetail(row: EntityRow): void {
    void this.router.navigate(['/parametrages/entites', row.id]);
  }

  goToEdit(row: EntityRow): void {
    void this.router.navigate(['/parametrages/entites/edit', row.id]);
  }

  exportCsv(): void {
    this.entitesApi.exportCsv().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        const date = new Date().toISOString().split('T')[0];
        this.downloadBlob(response.body, `entites_${date}.csv`);
      },
      error: (err: unknown) =>
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
    });
  }

  downloadTemplateCsv(): void {
    this.entitesApi.downloadTemplate().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        this.downloadBlob(response.body, 'modele_entites.csv');
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
    this.entitesApi.importCsv(file).subscribe({
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

  remove(row: EntityRow): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l’entité',
        message: `Supprimer « ${row.name} » et ses sous-entités éventuelles ? Les ressources associées seront réaffectées.`,
        isDelete: true,
        confirmText: 'Supprimer',
      },
    });
    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.settings.deleteEntity(row.id).subscribe({
        next: () => this.snackBar.open('Entité supprimée avec succès', 'Fermer', { duration: 3000 }),
        error: (err: unknown) =>
          this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
      });
    });
  }
}
