import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../../../services/settings.service';
import { AuthService } from '../../../services/auth.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { RessourcesService } from '../../../services/ressources.service';
import { ButtonLoadingDirective } from '../../../shared/directives/button-loading.directive';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ButtonLoadingDirective,
    MatSnackBarModule,
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent {
  private readonly authService = inject(AuthService);
  private readonly settingsService = inject(SettingsService);
  private readonly ressourcesApi = inject(RessourcesService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly snackBar = inject(MatSnackBar);

  readonly currentUser = this.authService.currentUser;
  readonly profileLabel = computed(() => {
    const user = this.currentUser();
    return user ? this.settingsService.getProfileLabel(user.profileId) : '-';
  });

  readonly savingInfos = signal(false);
  readonly savingPassword = signal(false);

  firstName = this.currentUser()?.firstName ?? '';
  lastName = this.currentUser()?.lastName ?? '';
  email = this.currentUser()?.email ?? '';
  contact = this.currentUser()?.contact ?? '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  infoMessage = '';
  infoError = '';
  passwordMessage = '';
  passwordError = '';

  saveInfos(): void {
    if (this.savingInfos()) return;
    this.infoMessage = '';
    this.infoError = '';
    const firstName = this.firstName.trim();
    const lastName = this.lastName.trim();
    const email = this.email.trim();

    if (!firstName || !lastName || !email) {
      this.infoError = 'Le nom, le prénom et l’email sont obligatoires.';
      return;
    }

    this.savingInfos.set(true);
    const user = this.authService.currentUser();
    if (!user) {
      this.infoError = 'Session invalide.';
      this.savingInfos.set(false);
      return;
    }

    this.ressourcesApi
      .update(Number(user.id), {
        prenoms: firstName,
        nom: lastName,
        email,
        contact: this.contact.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.authService.updateCurrentUser({
            firstName,
            lastName,
            email,
            contact: this.contact.trim() || undefined,
          });
          this.settingsService.refreshSettings();
          this.infoMessage = 'Informations mises à jour.';
          this.savingInfos.set(false);
        },
        error: (err) => {
          this.infoError = this.errorHandler.getErrorMessage(err);
          this.savingInfos.set(false);
        },
      });
  }

  savePassword(): void {
    if (this.savingPassword()) return;
    this.passwordMessage = '';
    this.passwordError = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'Tous les champs de mot de passe sont obligatoires.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'La confirmation ne correspond pas au nouveau mot de passe.';
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError = 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    this.savingPassword.set(true);
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (result) => {
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.passwordMessage = result.message;
        this.savingPassword.set(false);
      },
      error: (err) => {
        this.passwordError = this.errorHandler.getErrorMessage(err);
        this.savingPassword.set(false);
      },
    });
  }
}
