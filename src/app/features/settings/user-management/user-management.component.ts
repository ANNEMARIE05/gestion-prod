import { Component, ViewChild, AfterViewInit, computed, effect, inject, signal } from '@angular/core';
import { PermissionService } from '../../../services/permission.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../models/menu';
import { Entity, SettingsService } from '../../../services/settings.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSkeletonTableComponent } from '../../../shared/components/loading-skeleton-table/loading-skeleton-table.component';
import {
  encodeTableFilter,
  decodeTableFilter,
  type TableFilterPayload,
} from '../../../utils/table-filter';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    LoadingSkeletonTableComponent,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements AfterViewInit {
  readonly perm = inject(PermissionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<User>([]);

  displayedColumns: string[] = [
    'numero',
    'code',
    'name',
    'email',
    'entity',
    'specialty',
    'profile',
    'createdAt',
    'actions',
  ];
  isLoading = true;

  readonly filterSearch = signal('');
  readonly filterProfileId = signal('');
  /** Entité racine (sans parent dans l’arborescence). */
  readonly filterRootEntityId = signal('');
  /** Sous-entité directe choisie sous une racine qui a des enfants. */
  readonly filterSubEntityId = signal('');
  readonly filterSpecialtyId = signal('');

  readonly profileFilterOptions = computed(() =>
    this.settingsService.allProfiles().map((p) => ({ id: p.id, label: p.label })),
  );

  /** Racines seules (entités sans parent). */
  readonly rootEntityFilterOptions = computed(() =>
    this.settingsService.allEntities().map((e) => ({ id: e.id, label: e.name })),
  );

  readonly selectedRootEntity = computed(() => {
    const id = this.filterRootEntityId();
    return id ? this.settingsService.getEntityById(id) : undefined;
  });

  /** Enfants directs de la racine sélectionnée. */
  readonly subEntityFilterOptions = computed(() => {
    const root = this.selectedRootEntity();
    const children = root?.children ?? [];
    return children.map((c: any) => ({ id: c.id, label: c.name }));
  });

  readonly showSubEntityFilter = computed(
    () => !!this.filterRootEntityId() && (this.selectedRootEntity()?.children?.length ?? 0) > 0,
  );

  readonly specialtyFilterOptions = computed(() =>
    this.settingsService.allSpecialties().map((s) => ({ id: s.id, label: s.label })),
  );

  constructor(
    private settingsService: SettingsService,
    private router: Router,
    private dialog: MatDialog,
  ) {
    this.dataSource.filterPredicate = (data: User, raw: string) => {
      const f = decodeTableFilter(raw);
      if (f.profileId && data.profileId !== f.profileId) {
        return false;
      }
      if (!this.userMatchesEntityFilter(data.entityId, f)) {
        return false;
      }
      if (f.specialty && data.specialtyId !== f.specialty) {
        return false;
      }
      const q = (f.q ?? '').trim().toLowerCase();
      if (!q) {
        return true;
      }
      const profileLabel = this.settingsService.getProfileLabel(data.profileId);
      const entityLabel = this.settingsService.getEntityLabel(data.entityId);
      const specialtyLabel = this.settingsService.getSpecialtyLabel(data.specialtyId);
      const haystack = [data.code ?? '', data.name, data.email, profileLabel, entityLabel, specialtyLabel, data.avatar ?? '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    };

    effect(() => {
      this.dataSource.data = [...this.settingsService.allUsers()];
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.syncFilter();
    });

    window.setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  profileLabel(profileId: string): string {
    return this.settingsService.getProfileLabel(profileId);
  }

  entityLabel(entityId: string): string {
    return this.settingsService.getEntityLabel(entityId);
  }

  specialtyLabel(specialtyId: string): string {
    return this.settingsService.getSpecialtyLabel(specialtyId);
  }

  goToEdit(user: User): void {
    void this.router.navigate(['/utilisateurs/ressources/edit', user.id]);
  }

  goToDetail(user: User): void {
    void this.router.navigate(['/utilisateurs/ressources', user.id]);
  }

  rowNumber(user: User): number {
    const rows = this.dataSource.filteredData;
    const i = rows.findIndex((u) => u.id === user.id);
    return i >= 0 ? i + 1 : 0;
  }

  deleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l’utilisateur',
        message: `Êtes-vous sûr de vouloir supprimer « ${user.name} » ? Cette action est irréversible.`,
        isDelete: true,
        confirmText: 'Supprimer',
      },
    });
    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.settingsService.deleteUser(user.id).subscribe({
        next: () => this.snackBar.open('Ressource supprimée avec succès', 'Fermer', { duration: 3000 }),
        error: (err: unknown) =>
          this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
      });
    });
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
      profileId: this.filterProfileId() || undefined,
      entityRoot: this.filterRootEntityId() || undefined,
      entitySub: this.filterSubEntityId() || undefined,
      specialty: this.filterSpecialtyId() || undefined,
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

  entityRootFilterTrigger(): { primary: string } | null {
    const id = this.filterRootEntityId();
    if (!id) {
      return null;
    }
    const e = this.settingsService.getEntityById(id);
    return e ? { primary: e.name } : null;
  }

  onRootEntityFilterChange(value: string): void {
    this.filterRootEntityId.set(value);
    this.filterSubEntityId.set('');
    this.syncFilter();
  }

  entitySubFilterTrigger(): { primary: string } | null {
    const id = this.filterSubEntityId();
    if (!id) {
      return null;
    }
    const e = this.settingsService.getEntityById(id);
    return e ? { primary: e.name } : null;
  }

  onSubEntityFilterChange(value: string): void {
    this.filterSubEntityId.set(value);
    this.syncFilter();
  }

  private userMatchesEntityFilter(userEntityId: string, f: TableFilterPayload): boolean {
    const rootId = f.entityRoot ?? '';
    const subId = f.entitySub ?? '';
    const legacy = f.entity ?? '';

    if (!rootId && !subId) {
      if (legacy) {
        return userEntityId === legacy;
      }
      return true;
    }

    if (subId) {
      return userEntityId === subId;
    }

    const root = this.settingsService.getEntityById(rootId);
    if (!root) {
      return userEntityId === rootId;
    }

    const hasChildren = !!(root.children?.length);
    if (!hasChildren) {
      return userEntityId === rootId;
    }

    const inBranch = new Set<string>([rootId, ...this.collectDescendantIds(root)]);
    return inBranch.has(userEntityId);
  }

  private collectDescendantIds(entity: Entity): string[] {
    const out: string[] = [];
    for (const c of entity.children ?? []) {
      out.push(c.id, ...this.collectDescendantIds(c));
    }
    return out;
  }

  specialtyFilterTrigger(): { primary: string } | null {
    const id = this.filterSpecialtyId();
    if (!id) {
      return null;
    }
    const s = this.settingsService.allSpecialties().find((x) => x.id === id);
    if (!s) {
      return null;
    }
    return { primary: s.label };
  }

  onSpecialtyFilterChange(value: string): void {
    this.filterSpecialtyId.set(value);
    this.syncFilter();
  }
}
