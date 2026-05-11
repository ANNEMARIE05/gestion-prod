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
import { SettingsService, Specialty } from '../../../services/settings.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { encodeTableFilter, decodeTableFilter } from '../../../utils/table-filter';

@Component({
  selector: 'app-specialites-page',
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
  templateUrl: './specialites-page.component.html',
  styleUrl: './specialites-page.component.scss',
})
export class SpecialitesPageComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns: string[] = ['numero', 'label', 'active', 'createdAt', 'actions'];
  readonly dataSource = new MatTableDataSource<Specialty>([]);

  readonly rows = computed<Specialty[]>(() => this.settings.allSpecialties());

  readonly filterSearch = signal('');
  readonly activeFilter = signal<'all' | 'active' | 'inactive'>('all');

  constructor() {
    this.dataSource.filterPredicate = (row: Specialty, raw: string) => {
      const f = decodeTableFilter(raw);
      const active = f.active as 'active' | 'inactive' | '' | undefined;
      if (active === 'active' && !row.active) {
        return false;
      }
      if (active === 'inactive' && row.active) {
        return false;
      }
      const q = (f.q ?? '').trim().toLowerCase();
      if (!q) {
        return true;
      }
      return row.label.toLowerCase().includes(q);
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

  goToEdit(row: Specialty): void {
    void this.router.navigate(['/settings/specialites/edit', row.id]);
  }

  remove(row: Specialty): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la spécialité',
        message: `Supprimer « ${row.label} » ? Les ressources rattachées seront mises à jour.`,
        isDelete: true,
        confirmText: 'Supprimer',
      },
    });
    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (ok) {
        this.settings.deleteSpecialty(row.id);
      }
    });
  }
}
