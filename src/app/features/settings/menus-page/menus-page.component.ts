import { AfterViewInit, Component, ViewChild, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MenuItem } from '../../../models/menu';
import { AppAction } from '../../../models/authorization';
import { SettingsService } from '../../../services/settings.service';
import { flattenMenuWithDepth } from '../../../utils/menu-tree';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface MenuRow {
  id: string;
  label: string;
  icon: string;
  route: string;
  active: boolean;
  depth: number;
  raw: MenuItem;
  habActions: AppAction[];
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
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns: string[] = ['numero', 'label', 'icon', 'route', 'habilitations', 'active', 'actions'];
  readonly dataSource = new MatTableDataSource<MenuRow>([]);

  readonly rows = computed<MenuRow[]>(() => {
    const hab = this.settings.allHabilitation();
    const allActions = this.settings.allActions();
    const actionsById = new Map(allActions.map((a) => [a.id, a]));
    return flattenMenuWithDepth(this.settings.allMenus()).map(({ item, depth }) => {
      const ids = hab[item.id] ?? [];
      const habActions = ids
        .map((id) => actionsById.get(id))
        .filter((a): a is AppAction => !!a);
      return {
        id: item.id,
        label: item.label,
        icon: item.icon,
        route: item.route,
        active: item.active,
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
      return [row.label, row.icon, row.route, ...row.habActions.map((a) => `${a.label} ${a.code}`)]
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
    return row.habActions.map((a) => `${a.label} (${a.code})`).join(', ');
  }

  goToEdit(row: MenuRow): void {
    void this.router.navigate(['/settings/menus/edit', row.id]);
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
      if (ok) {
        this.settings.deleteMenuItem(row.id);
      }
    });
  }
}
