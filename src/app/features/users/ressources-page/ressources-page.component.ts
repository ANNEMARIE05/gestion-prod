import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PermissionService } from '../../../services/permission.service';
import { RessourcesService } from '../../../services/ressources.service';
import { SettingsService } from '../../../services/settings.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { UserManagementComponent } from '../../settings/user-management/user-management.component';

@Component({
  selector: 'app-ressources-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, UserManagementComponent],
  templateUrl: './ressources-page.component.html',
  styleUrl: './ressources-page.component.scss'
})
export class RessourcesPageComponent {
  readonly perm = inject(PermissionService);
  private readonly ressourcesApi = inject(RessourcesService);
  private readonly settings = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly errorHandler = inject(ErrorHandlerService);

  exportCsv(): void {
    this.ressourcesApi.exportCsv().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        const date = new Date().toISOString().split('T')[0];
        this.downloadBlob(response.body, `ressources_${date}.csv`);
      },
      error: (err: unknown) =>
        this.snackBar.open(this.errorHandler.getErrorMessage(err), 'Fermer', { duration: 5000 }),
    });
  }

  downloadTemplateCsv(): void {
    this.ressourcesApi.downloadTemplate().subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }
        this.downloadBlob(response.body, 'modele_ressources.csv');
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
    this.ressourcesApi.importCsv(file).subscribe({
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
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
