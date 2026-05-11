import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SettingsService } from '../../../services/settings.service';
import { AuthService } from '../../../services/auth.service';
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
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent {
  private readonly authService = inject(AuthService);
  private readonly settingsService = inject(SettingsService);

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
    setTimeout(() => {
      this.authService.updateCurrentUser({
        firstName,
        lastName,
        email,
        contact: this.contact.trim() || undefined,
      });

      const updated = this.authService.currentUser();
      if (updated) {
        this.settingsService.updateUser(updated);
      }
      this.infoMessage = 'Informations mises à jour.';
      this.savingInfos.set(false);
    }, 600);
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

    this.savingPassword.set(true);
    setTimeout(() => {
      const result = this.authService.changePassword(this.currentPassword, this.newPassword);
      if (!result.success) {
        this.passwordError = result.message;
        this.savingPassword.set(false);
        return;
      }

      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.passwordMessage = result.message;
      this.savingPassword.set(false);
    }, 600);
  }
}
