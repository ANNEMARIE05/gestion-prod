import { AxiosHttpClient } from '../../../core/services/axios-http-client.service';
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable, tap, map, switchMap, of, catchError, throwError } from 'rxjs';
import { User } from '../../../models/menu';
import { AuthStateService } from './auth-state.service';
import { ProfilsService } from '../../users/services/profils.service';
import { RessourcesService } from '../../users/services/ressources.service';
import { getEnv } from '../../../utils/env.utils';
import { extractApiItem } from '../../../utils/api-response.utils';

interface LoginPayload {
  email: string;
  password: string;
}

interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

function mapUserInfosToUser(userInfos: any): User | null {
  if (!userInfos || typeof userInfos !== 'object') {
    return null;
  }
  const prenoms = String(userInfos.prenoms ?? userInfos.firstName ?? '').trim();
  const nom = String(userInfos.nom ?? userInfos.lastName ?? '').trim();
  const name = `${prenoms} ${nom}`.trim() || String(userInfos.email ?? 'Utilisateur');
  return {
    id: String(userInfos.id ?? userInfos.code ?? ''),
    name,
    firstName: prenoms,
    lastName: nom,
    email: String(userInfos.email ?? ''),
    profileId: String(
      userInfos.profil?.id ??
        userInfos.profilId ??
        (typeof userInfos.profil === 'string' || typeof userInfos.profil === 'number'
          ? userInfos.profil
          : ''),
    ),
    entityId: String(userInfos.entite?.id ?? userInfos.entite ?? ''),
    specialtyId: String(userInfos.specialite?.id ?? userInfos.specialite ?? ''),
    avatar: userInfos.avatar,
    contact: userInfos.contact ? String(userInfos.contact) : undefined,
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private static readonly LEGACY_USER_KEY = 'user';

  private baseUrl = getEnv('apiBaseUrl');
  private authState = inject(AuthStateService);
  private profilsApi = inject(ProfilsService);
  private ressourcesApi = inject(RessourcesService);
  private http = inject(AxiosHttpClient);
  private router = inject(Router);

  private userSignal = signal<User | null>(null);

  currentUser = computed(() => this.userSignal());
  isAuthenticated = computed(() => this.authState.isLoggedIn());

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    const userInfos = this.authState.userInfos();
    if (userInfos && this.authState.isLoggedIn()) {
      this.userSignal.set(mapUserInfosToUser(userInfos));
      return;
    }
    const legacy = localStorage.getItem(AuthService.LEGACY_USER_KEY);
    if (legacy) {
      try {
        this.userSignal.set(JSON.parse(legacy));
      } catch {
        localStorage.removeItem(AuthService.LEGACY_USER_KEY);
      }
    }
  }

  private getAuthOptions() {
    const token = this.authState.getToken();
    if (token) {
      return {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
        observe: 'response' as const,
      } as const;
    }
    return { observe: 'response' as const } as const;
  }

  login(email: string, password: string): Observable<User> {
    const payload: LoginPayload = { email: email.trim(), password };
    return this.http
      .post<any>(`${this.baseUrl}/auth/login`, payload, { observe: 'response' })
      .pipe(
        tap((res: HttpResponse<any>) => {
          const body = res.body ?? {};
          this.authState.setAuth(body);
          localStorage.removeItem(AuthService.LEGACY_USER_KEY);
        }),
        switchMap(() => this.enrichUserInfosWithProfil()),
        tap((userInfos) => {
          if (userInfos) {
            this.authState.setUserInfos(userInfos);
          }
          const user = mapUserInfosToUser(this.authState.userInfos());
          if (user) {
            this.userSignal.set(user);
          }
        }),
        map(() => {
          const user = this.userSignal();
          if (!user) {
            throw new Error('Réponse de connexion invalide : utilisateur absent.');
          }
          return user;
        }),
      );
  }

  /** Complète profilMenuActions depuis l'API profil si absent du login. */
  private enrichUserInfosWithProfil(): Observable<any | null> {
    const userInfos = this.authState.userInfos();
    if (!userInfos) {
      return of(null);
    }

    const existing = userInfos?.profil?.profilMenuActions;
    if (Array.isArray(existing) && existing.length > 0) {
      return of(userInfos);
    }

    const profilId = userInfos?.profil?.id ?? userInfos?.profilId;
    if (profilId == null || profilId === '') {
      return of(userInfos);
    }

    return this.profilsApi.getById(Number(profilId)).pipe(
      map((res) => {
        const profilData = extractApiItem(res) ?? res.body?.profil ?? res.body;
        if (!profilData || typeof profilData !== 'object') {
          return userInfos;
        }

        const profilMenuActions =
          profilData.profilMenuActions ??
          userInfos?.profil?.profilMenuActions ??
          [];

        return {
          ...userInfos,
          profil: {
            ...(typeof userInfos.profil === 'object' ? userInfos.profil : { id: profilId }),
            ...profilData,
            profilMenuActions: Array.isArray(profilMenuActions) ? profilMenuActions : [],
          },
        };
      }),
      catchError(() => of(userInfos)),
    );
  }

  loginWithPayload(payload: LoginPayload): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, payload, { observe: 'response' });
  }

  updateCurrentUser(partial: Partial<User>): void {
    const existing = this.userSignal();
    if (!existing) {
      return;
    }
    const next: User = {
      ...existing,
      ...partial,
      firstName: (partial.firstName ?? existing.firstName).trim(),
      lastName: (partial.lastName ?? existing.lastName).trim(),
    };
    next.name = `${next.firstName} ${next.lastName}`.trim();
    next.email = next.email.trim();
    next.contact = next.contact?.trim() || undefined;
    this.userSignal.set(next);

    const stored = this.authState.userInfos();
    if (stored) {
      this.authState.setUserInfos({
        ...stored,
        prenoms: next.firstName,
        nom: next.lastName,
        email: next.email,
        contact: next.contact,
      });
    }
  }

  /**
   * Met à jour les informations du profil de l'utilisateur connecté via
   * l'API (PUT /ressources/:id), puis synchronise la session locale.
   */
  updateProfile(partial: {
    firstName: string;
    lastName: string;
    email: string;
    contact?: string;
  }): Observable<User> {
    const existing = this.userSignal();
    if (!existing) {
      return throwError(() => new Error('Aucun utilisateur connecté.'));
    }
    const apiId = Number(existing.id);
    if (Number.isNaN(apiId)) {
      return throwError(() => new Error('Identifiant utilisateur invalide.'));
    }

    // Payload identique à l'ancien backoffice (ressources-create) :
    // tous les champs sont envoyés, profil/entite/specialite conservés tels quels.
    const payload: Record<string, unknown> = {
      code: existing.code ?? '',
      nom: partial.lastName.trim(),
      prenoms: partial.firstName.trim(),
      email: partial.email.trim(),
      contact: partial.contact?.trim() ?? '',
      profil: existing.profileId ?? '',
      entite: existing.entityId ?? '',
      specialite: existing.specialtyId ?? '',
    };

    return this.ressourcesApi.update(apiId, payload).pipe(
      map(() => {
        this.updateCurrentUser({
          firstName: partial.firstName,
          lastName: partial.lastName,
          email: partial.email,
          contact: partial.contact,
        });
        return this.userSignal()!;
      }),
    );
  }

  changePassword(
    currentPassword: string,
    newPassword: string,
  ): Observable<{ success: boolean; message: string }> {
    const payload: ChangePasswordPayload = {
      oldPassword: currentPassword,
      newPassword,
    };
    return this.http
      .post(`${this.baseUrl}/auth/change-password`, payload, {
        ...this.getAuthOptions(),
        responseType: 'text' as const,
      })
      .pipe(
        map(() => ({ success: true, message: 'Mot de passe mis à jour avec succès.' })),
      );
  }

  changePasswordSync(
    currentPassword: string,
    newPassword: string,
  ): { success: boolean; message: string } {
    return {
      success: false,
      message: 'Utilisez changePassword() avec l’API backend.',
    };
  }

  logout(): void {
    this.userSignal.set(null);
    this.authState.clearUser();
    localStorage.removeItem(AuthService.LEGACY_USER_KEY);
    this.router.navigate(['/login']);
  }

  userInfos(): any | null {
    return this.authState.userInfos();
  }

  getToken(): string | null {
    return this.authState.getToken();
  }
}
