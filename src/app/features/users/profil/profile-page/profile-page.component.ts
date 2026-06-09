import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SettingsService } from '../../../settings/services/settings.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ButtonLoadingDirective } from '../../../../shared/directives/button-loading.directive';

interface ProfileRight {
  menuLabel: string;
  actions: string[];
}

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
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly permissionService = inject(PermissionService);

  readonly currentUser = this.authService.currentUser;
  readonly profileLabel = computed(() => {
    const user = this.currentUser();
    return user ? this.settingsService.getProfileLabel(user.profileId) : '-';
  });

  /** Droits (menus + actions) accordés au profil de l'utilisateur connecté. */
  readonly rights = computed<ProfileRight[]>(() => {
    const seen = new Set<string>();
    const result: ProfileRight[] = [];
    for (const pma of this.permissionService.profilMenuActions()) {
      const menu = (pma as { menu?: any })?.menu;
      if (!menu?.id) {
        continue;
      }
      const key = String(menu.id);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const menuLabel = String(menu.libelle ?? menu.label ?? menu.code ?? '').trim();
      const actions = Array.isArray(menu.actions)
        ? menu.actions
            .map((a: any) =>
              String(a?.libelle ?? a?.code ?? a?.id?.actionId ?? a?.id?.code ?? '').trim(),
            )
            .filter((label: string) => !!label)
        : [];
      result.push({ menuLabel, actions });
    }
    return result.sort((a, b) => a.menuLabel.localeCompare(b.menuLabel, 'fr'));
  });

  readonly savingPassword = signal(false);
  readonly savingProfile = signal(false);

  firstName = this.currentUser()?.firstName ?? '';
  lastName = this.currentUser()?.lastName ?? '';
  email = this.currentUser()?.email ?? '';
  contact = this.currentUser()?.contact ?? '';

  profileMessage = '';
  profileError = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  passwordMessage = '';
  passwordError = '';

  saveProfile(): void {
    if (this.savingProfile()) return;
    this.profileMessage = '';
    this.profileError = '';

    if (!this.firstName.trim() || !this.lastName.trim() || !this.email.trim()) {
      this.profileError = 'Le prénom, le nom et l’email sont obligatoires.';
      return;
    }

    this.savingProfile.set(true);
    this.authService
      .updateProfile({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        contact: this.contact,
      })
      .subscribe({
        next: () => {
          this.profileMessage = 'Profil mis à jour avec succès.';
          this.savingProfile.set(false);
        },
        error: (err) => {
          this.profileError = this.errorHandler.getErrorMessage(err);
          this.savingProfile.set(false);
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
