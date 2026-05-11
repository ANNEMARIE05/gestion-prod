import { AfterViewInit, Component, ViewChild, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Jalon, SettingsService } from '../../../services/settings.service';
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
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns: string[] = [
    'numero',
    'label',
    'parent',
    'applications',
    'creation',
    'actions',
  ];
  readonly dataSource = new MatTableDataSource<Jalon>([]);
  isLoading = true;

  readonly filterSearch = signal('');

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
    void this.router.navigate(['/settings/jalons/edit', row.id]);
  }

  goToDetail(row: Jalon): void {
    void this.router.navigate(['/settings/jalons', row.id]);
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

  exportCsv(): void {
    const rows = this.settings.allJalons().map((j) => ({
      code: j.code,
      libelle: j.label,
      jalonParentCode: j.parentId ? (this.settings.getJalonById(j.parentId)?.code ?? '') : '',
      applications: this.getApplications(j).join('|'),
      creationDate: j.createdAt ? new Date(j.createdAt).toISOString().slice(0, 10) : '',
    }));
    const header = 'code,libelle,jalonParentCode,applications,creationDate';
    const lines = rows.map((r) => [r.code, r.libelle, r.jalonParentCode, r.applications, r.creationDate].map((v) => this.csvEscape(v)).join(','));
    this.downloadFile('jalons-export.csv', [header, ...lines].join('\n'), 'text/csv;charset=utf-8;');
  }

  downloadTemplateCsv(): void {
    const header = 'code,libelle,jalonParentCode,applications';
    this.downloadFile('jalons-modele.csv', `${header}\n`, 'text/csv;charset=utf-8;');
  }

  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length <= 1) return;
      const existingCodes = new Set(this.settings.allJalons().map((j) => j.code.toUpperCase()));
      for (const line of lines.slice(1)) {
        const [codeRaw, labelRaw] = line.split(',');
        const code = (codeRaw ?? '').trim().toUpperCase();
        const label = (labelRaw ?? '').trim();
        if (!label) continue;
        if (code && existingCodes.has(code)) continue;
        this.settings.addJalon({
          id: this.settings.generateId(),
          code: code || label.toUpperCase().replace(/\s+/g, '_'),
          label,
          applicationIds: [],
          createdAt: new Date(),
          createdBy: 'Import CSV',
        });
      }
      input.value = '';
    };
    reader.readAsText(file, 'utf-8');
  }

  private csvEscape(value: string): string {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  private downloadFile(filename: string, content: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
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
      if (ok) {
        this.settings.deleteJalon(row.id);
      }
    });
  }
}
