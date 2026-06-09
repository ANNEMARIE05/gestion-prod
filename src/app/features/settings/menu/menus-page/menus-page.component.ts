import { AfterViewInit, Component, ViewChild, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MenuItem } from '../../../../models/menu';
import { MenuAssignedAction } from '../../../../models/authorization';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { SettingsService } from '../../services/settings.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { findParentIdOf, flattenMenuWithDepth } from '../../../../utils/menu-tree';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

interface MenuRow {
  id: string;
  label: string;
  icon: string;
  route: string;
  parentLabel: string;
  active: boolean;
  createdAt?: Date;
  depth: number;
  raw: MenuItem;
  habActions: MenuAssignedAction[];
}

@Component({
  selector: 'app-menus-page',
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
  ],
  templateUrl: './menus-page.component.html',
})
export class MenusPageComponent implements AfterViewInit {
  readonly perm = inject(PermissionService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly displayedColumns: string[] = [
    'numero',
    'label',
    'icon',
    'route',
    'parent',
    'habilitations',
    'active',
    'createdAt',
    'actions',
  ];
  readonly dataSource = new MatTableDataSource<MenuRow>([]);

  readonly rows = computed<MenuRow[]>(() => {
    this.settings.allMenuAssignedActions();
    const roots = this.settings.allMenus();
    return flattenMenuWithDepth(roots).map(({ item, depth }) => {
      const habActions = this.settings.getAssignedActionsForMenu(item.id);
      const parentId = findParentIdOf(roots, item.id);
      const parentLabel = parentId
        ? (this.settings.getMenuById(parentId)?.label ?? '—')
        : '—';
      return {
        id: item.id,
        label: item.label,
        icon: item.icon,
        route: item.route,
        parentLabel,
        active: item.active,
        createdAt: item.createdAt,
        depth,
        raw: item,
        habActions,
      };
    });
  });

  constructor() {
    this.dataSource.filterPredicate = (row: MenuRow, filter: string) => {
      const q = filter.trim().toLowerCase();
      if (!q) return true;
      return [row.label, row.icon, row.route, ...row.habActions.map((a) => a.actionId)]
        .join(' ')
        .toLowerCase()
        .includes(q);
    };

    effect(() => {
      this.dataSource.data = this.rows();
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  rowNumber(indexOnPage: number): number {
    const p = this.paginator;
    if (!p) return indexOnPage + 1;
    return p.pageIndex * p.pageSize + indexOnPage + 1;
  }

  habTooltip(row: MenuRow): string {
    return row.habActions.map((a) => a.actionId).join(', ');
  }

  goToDetail(row: MenuRow): void {
    void this.router.navigate(['/parametrages/menus', row.id]);
  }

  goToEdit(row: MenuRow): void {
    void this.router.navigate(['/parametrages/menus/edit', row.id]);
  }

  remove(row: MenuRow): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le menu',
        message: `Supprimer « ${row.label} » et ses sous-menus éventuels ? Cette action est irréversible.`,
        isDelete: true,
        confirmText: 'Supprimer',
      },
    });
    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.settings.deleteMenuItem(row.id).subscribe({
        next: () => this.snackBar.open('Menu supprimé avec succès', 'Fermer', { duration: 3000 }),
        error: (err: unknown) =>
          this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
      });
    });
  }
}
