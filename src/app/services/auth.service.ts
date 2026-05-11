import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/menu';
import { AuditTrailService } from './audit-trail.service';
import {
  DEMO_LOGIN_EMAIL,
  DEMO_LOGIN_PASSWORD,
  createDemoUser,
} from '../data/local-app-defaults';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private static readonly PASSWORD_KEY = 'user_password';

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(
    private router: Router,
    private auditTrail: AuditTrailService,
  ) {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }

  login(email: string, password: string): Observable<User> {
    const ok =
      email.trim().toLowerCase() === DEMO_LOGIN_EMAIL && password === DEMO_LOGIN_PASSWORD;
    if (!ok) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
          }),
      );
    }
    const user = createDemoUser();
    return of(user).pipe(
      tap((u) => {
        this.currentUser.set(u);
        localStorage.setItem('user', JSON.stringify(u));
        if (!localStorage.getItem(AuthService.PASSWORD_KEY)) {
          localStorage.setItem(AuthService.PASSWORD_KEY, DEMO_LOGIN_PASSWORD);
        }
        this.auditTrail.logAction({
          userId: u.id,
          userName: u.name,
          action: 'LOGIN',
          module: 'AUTH',
          details: `Connexion locale (${email.trim()})`,
        });
      }),
    );
  }

  updateCurrentUser(partial: Partial<User>) {
    const existing = this.currentUser();
    if (!existing) {
      return;
    }
    const next: User = {
      ...existing,
      ...partial,
    };
    next.firstName = next.firstName.trim();
    next.lastName = next.lastName.trim();
    next.name = `${next.firstName} ${next.lastName}`.trim();
    next.email = next.email.trim();
    next.contact = next.contact?.trim() || undefined;
    this.currentUser.set(next);
    localStorage.setItem('user', JSON.stringify(next));
    this.auditTrail.logAction({
      userId: next.id,
      userName: next.name,
      action: 'UPDATE',
      module: 'PROFILE',
      details: 'Profil utilisateur (coordonnées) mis à jour',
    });
  }

  changePassword(currentPassword: string, newPassword: string): { success: boolean; message: string } {
    const saved = localStorage.getItem(AuthService.PASSWORD_KEY);
    if (!saved) {
      return {
        success: false,
        message:
          'Aucun mot de passe local n’est enregistré sur cet appareil. Définissez d’abord un mot de passe via cette page après une première connexion, ou utilisez le backend lorsqu’il sera branché.',
      };
    }
    if (currentPassword !== saved) {
      return { success: false, message: 'Mot de passe actuel incorrect.' };
    }
    if (newPassword.length < 8) {
      return { success: false, message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' };
    }
    localStorage.setItem(AuthService.PASSWORD_KEY, newPassword);
    const u = this.currentUser();
    if (u) {
      this.auditTrail.logAction({
        userId: u.id,
        userName: u.name,
        action: 'PASSWORD_CHANGE',
        module: 'AUTH',
        details: 'Mot de passe modifié',
      });
    }
    return { success: true, message: 'Mot de passe mis à jour avec succès.' };
  }

  logout() {
    const u = this.currentUser();
    this.currentUser.set(null);
    localStorage.removeItem('user');
    if (u) {
      this.auditTrail.logAction({
        userId: u.id,
        userName: u.name,
        action: 'LOGOUT',
        module: 'AUTH',
        details: 'Déconnexion',
      });
    }
    this.router.navigate(['/login']);
  }
}
