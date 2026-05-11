import { Component, ViewChild, AfterViewInit, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Profile, SettingsService } from '../../../services/settings.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSkeletonTableComponent } from '../../../shared/components/loading-skeleton-table/loading-skeleton-table.component';
import { encodeTableFilter, decodeTableFilter } from '../../../utils/table-filter';

@Component({
  selector: 'app-profils-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    LoadingSkeletonTableComponent,
  ],
  templateUrl: './profils-list.component.html',
  styleUrl: './profils-list.component.scss',
})
export class ProfilsListComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<Profile>([]);

  displayedColumns: string[] = ['numero', 'label', 'scope', 'actions'];
  isLoading = true;

  readonly filterSearch = signal('');
  readonly filterProfileId = signal('');

  readonly profileFilterOptions = computed(() =>
    this.settingsService.allProfiles().map((p) => ({ id: p.id, label: p.label })),
  );

  constructor(
    private settingsService: SettingsService,
    private router: Router,
    private dialog: MatDialog,
  ) {
    this.dataSource.filterPredicate = (data: Profile, raw: string) => {
      const f = decodeTableFilter(raw);
      if (f.profileId && data.id !== f.profileId) {
        return false;
      }
      const q = (f.q ?? '').trim().toLowerCase();
      if (!q) {
        return true;
      }
      const scopeText = data.visibleMenuIds.join(' ');
      const haystack = [data.label, scopeText].join(' ').toLowerCase();
      return haystack.includes(q);
    };

    effect(() => {
      this.dataSource.data = [...this.settingsService.allProfiles()];
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

  goToEdit(row: Profile): void {
    void this.router.navigate(['/utilisateurs/profils/edit', row.id]);
  }

  deleteProfile(row: Profile): void {
    if (row.id === '1') {
      return;
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le profil',
        message: `Êtes-vous sûr de vouloir supprimer « ${row.label} » ? Cette action est irréversible.`,
        isDelete: true,
        confirmText: 'Supprimer',
      },
    });
    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (ok) {
        this.settingsService.deleteProfile(row.id);
      }
    });
  }

  applyFilter(event: Event): void {
    this.filterSearch.set((event.target as HTMLInputElement).value);
    this.syncFilter();
  }

  syncFilter(): void {
    this.dataSource.filter = encodeTableFilter({
      q: this.filterSearch(),
      profileId: this.filterProfileId() || undefined,
    });
  }

  profileFilterTrigger(): { primary: string } | null {
    const id = this.filterProfileId();
    if (!id) {
      return null;
    }
    const p = this.settingsService.allProfiles().find((x) => x.id === id);
    if (!p) {
      return null;
    }
    return { primary: p.label };
  }

  onProfileFilterChange(value: string): void {
    this.filterProfileId.set(value);
    this.syncFilter();
  }

  rowNumber(indexOnPage: number): number {
    const p = this.paginator;
    if (!p) return indexOnPage + 1;
    return p.pageIndex * p.pageSize + indexOnPage + 1;
  }
}
