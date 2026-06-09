import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PermissionService } from '../../../services/permission.service';
import { ProfilsService } from '../../../services/profils.service';
import { SettingsService } from '../../../services/settings.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { ProfilsListComponent } from '../profils-list/profils-list.component';

@Component({
  selector: 'app-profils-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, ProfilsListComponent],
  templateUrl: './profils-page.component.html',
  styleUrl: './profils-page.component.scss',
})
export class ProfilsPageComponent {
  readonly perm = inject(PermissionService);
  private readonly profilsApi = inject(ProfilsService);
  private readonly settings = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);

  exportCsv(): void {
    this.profilsApi.exportCsv().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        const date = new Date().toISOString().split('T')[0];
        this.downloadBlob(response.body, `profils_${date}.csv`);
      },
      error: (err: unknown) =>
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
    });
  }

  downloadTemplateCsv(): void {
    this.profilsApi.downloadTemplate().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        this.downloadBlob(response.body, 'modele_profils.csv');
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
    this.profilsApi.importCsv(file).subscribe({
      next: (response) => {
        input.value = '';
        if (response.status >= 200 && response.status < 300) {
          this.settings.refreshSettings();
          this.snackBar.open('Import réussi', 'Fermer', { duration: 3000 });
        } else {
          this.snackBar.open("Erreur lors de l'import", 'Fermer', { duration: 5000 });
        }
      },
      error: (err: unknown) => {
        input.value = '';
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 });
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
