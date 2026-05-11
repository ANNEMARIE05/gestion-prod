import { AfterViewInit, Component, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AppAction } from '../../../models/authorization';
import { SettingsService } from '../../../services/settings.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-actions-page',
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
  templateUrl: './actions-page.component.html',
})
export class ActionsPageComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns: string[] = ['numero', 'icon', 'code', 'label', 'active', 'actions'];
  readonly dataSource = new MatTableDataSource<AppAction>([]);

  constructor() {
    this.dataSource.filterPredicate = (row: AppAction, filter: string) => {
      const q = filter.trim().toLowerCase();
      if (!q) return true;
      return [row.code, row.label, row.active ? 'actif active' : 'inactif inactive']
        .join(' ')
        .toLowerCase()
        .includes(q);
    };

    effect(() => {
      this.dataSource.data = [...this.settings.allActions()];
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

  goToEdit(row: AppAction): void {
    void this.router.navigate(['/settings/actions/edit', row.id]);
  }

  remove(row: AppAction): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l’action',
        message: `Supprimer l’action « ${row.label} » (${row.code}) ? Les habilitations qui l’utilisent seront affectées.`,
        isDelete: true,
        confirmText: 'Supprimer',
      },
    });
    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (ok) {
        this.settings.deleteAction(row.id);
      }
    });
  }
}
