import { Component, DestroyRef, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { AuthStateService } from '../../../services/auth-state.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { SettingsService } from '../../../services/settings.service';
import { getLandingRoute } from '../../../utils/app-routes';

/** Délai après succès avant navigation (laisse l'animation se lire). */
const POST_LOGIN_REDIRECT_MS = 780;

@Component({
  selector: 'app-login',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  readonly submitting = signal(false);
  /** Affiche la couche de succès avant redirection vers le dashboard. */
  readonly postLoginTransition = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private authState: AuthStateService,
    private errorHandler: ErrorHandlerService,
    private settingsService: SettingsService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
    this.destroyRef.onDestroy(() => this.clearRedirectTimer());
  }

  onSubmit() {
    if (!this.loginForm.valid || this.submitting()) {
      return;
    }
    const email = (this.loginForm.value.email as string).trim();
    const password = this.loginForm.value.password as string;
    this.submitting.set(true);
    this.authService.login(email, password).subscribe({
      next: () => {
        this.settingsService.refreshSettings();
        this.submitting.set(false);
        this.postLoginTransition.set(true);
        this.clearRedirectTimer();
        this.redirectTimer = setTimeout(() => {
          this.redirectTimer = null;
          void this.router.navigate([getLandingRoute(this.authState.userInfos())]);
        }, POST_LOGIN_REDIRECT_MS);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const msg =
          err instanceof Error && (err as any).httpError
            ? this.errorHandler.getErrorMessage(err)
            : loginErrorMessage(err);
        this.snackBar.open(msg, 'Fermer', { duration: 8000 });
      },
    });
  }

  private clearRedirectTimer(): void {
    if (this.redirectTimer != null) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
  }
}

function loginErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Connexion impossible (réseau ou configuration). En mode local, vérifiez vos identifiants.';
    }
    if (err.status === 401 || err.status === 403) {
      return 'Email ou mot de passe incorrect.';
    }
    const body = err.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body && typeof body === 'object' && 'message' in body && typeof (body as { message: unknown }).message === 'string') {
      return (body as { message: string }).message;
    }
    return `Erreur serveur (${err.status}). Réessayez ou contactez l’administrateur.`;
  }
  return 'Connexion impossible. Réessayez.';
}
