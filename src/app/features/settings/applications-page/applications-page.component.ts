import { AfterViewInit, Component, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Application, SettingsService } from '../../../services/settings.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { PermissionService } from '../../../services/permission.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-applications-page',
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
  templateUrl: './applications-page.component.html',
})
export class ApplicationsPageComponent implements AfterViewInit {
  readonly perm = inject(PermissionService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly displayedColumns: string[] = ['numero', 'code', 'label', 'description', 'creation', 'actions'];
  readonly dataSource = new MatTableDataSource<Application>([]);

  constructor() {
    this.dataSource.filterPredicate = (row: Application, filter: string) => {
      const q = filter.trim().toLowerCase();
      if (!q) return true;
      const code = row.code || `APP-${row.id}`;
      return [code, row.label, row.description ?? ''].join(' ').toLowerCase().includes(q);
    };

    effect(() => {
      this.dataSource.data = [...this.settings.allApplications()];
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

  displayCode(row: Application): string {
    return row.code || `APP-${row.id}`;
  }

  goToDetail(row: Application): void {
    void this.router.navigate(['/parametrages/applications', row.id]);
  }

  goToEdit(row: Application): void {
    void this.router.navigate(['/parametrages/applications/edit', row.id]);
  }

  remove(row: Application): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l’application',
        message: `Supprimer « ${row.label} » (${row.code}) ? Cette action est irréversible.`,
        isDelete: true,
        confirmText: 'Supprimer',
      },
    });
    dialogRef.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.settings.deleteApplication(row.id).subscribe({
        next: () => this.snackBar.open('Application supprimée avec succès', 'Fermer', { duration: 3000 }),
        error: (err: unknown) =>
          this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
      });
    });
  }

}
