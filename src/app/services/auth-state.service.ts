import { Injectable } from '@angular/core';
import { useLocalStorage } from '../utils/useLocalStorage';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private userInfosStore = useLocalStorage<any>('userInfos');
  private tokenStore = useLocalStorage<string>('token');

  private extractUserInfos(auth: any): any | null {
    if (!auth) return null;

    const candidate =
      auth.userInfos ??
      auth.user ??
      auth.utilisateur ??
      auth.ressource ??
      auth.ressources ??
      auth.data?.user ??
      auth.data?.userInfos ??
      auth.data?.utilisateur ??
      null;

    if (!candidate) return null;
    if (Array.isArray(candidate)) return null;
    if (typeof candidate !== 'object') return null;

    return candidate;
  }

  /** Normalise profil + profilMenuActions comme l'ancien backoffice. */
  private normalizeUserInfos(userInfos: any, auth: any): any {
    const profilMenuActions =
      userInfos?.profil?.profilMenuActions ??
      userInfos?.profilMenuActions ??
      auth?.profilMenuActions ??
      auth?.data?.profilMenuActions ??
      auth?.profil?.profilMenuActions ??
      auth?.data?.profil?.profilMenuActions ??
      [];

    const baseProfil =
      userInfos?.profil && typeof userInfos.profil === 'object'
        ? userInfos.profil
        : userInfos?.profil != null
          ? { id: userInfos.profil }
          : {};

    return {
      ...userInfos,
      profil: {
        ...baseProfil,
        profilMenuActions: Array.isArray(profilMenuActions) ? profilMenuActions : [],
      },
    };
  }

  /** Store user info and token from auth response */
  setAuth(auth: any) {
    if (!auth) return;

    const token =
      auth?.token ??
      auth?.access_token ??
      auth?.accessToken ??
      auth?.jwt ??
      auth?.data?.token ??
      auth?.data?.access_token ??
      auth?.data?.accessToken ??
      auth?.data?.jwt ??
      null;

    if (typeof token === 'string' && token.trim().length > 0) {
      this.tokenStore.set(token);
    }

    const userInfos = this.extractUserInfos(auth);
    if (userInfos) {
      this.userInfosStore.set(this.normalizeUserInfos(userInfos, auth));
    }
  }

  setUserInfos(userInfos: any) {
    if (!userInfos) return;
    this.userInfosStore.set(this.normalizeUserInfos(userInfos, userInfos));
  }

  userInfos(): any | null {
    return this.userInfosStore.get();
  }

  clearUser() {
    this.userInfosStore.remove();
    this.tokenStore.remove();
    localStorage.removeItem('currentMenu');
  }

  setToken(token: string) {
    this.tokenStore.set(token);
  }

  getToken(): string | null {
    return this.tokenStore.get();
  }

  /**
   * Décode le payload d'un JWT (base64url). Renvoie null si le token
   * n'est pas un JWT exploitable (ex. mode local sans JWT).
   */
  private decodeTokenPayload(token: string): Record<string, any> | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const json = decodeURIComponent(
        atob(padded)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const payload = JSON.parse(json);
      return payload && typeof payload === 'object' ? payload : null;
    } catch {
      return null;
    }
  }

  /**
   * Indique si le token courant est expiré (claim `exp`).
   * Un token non-JWT ou sans `exp` est considéré comme non expiré
   * pour ne pas casser les modes sans JWT.
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }
    const payload = this.decodeTokenPayload(token);
    const exp = payload?.['exp'];
    if (typeof exp !== 'number') {
      return false;
    }
    return Date.now() >= exp * 1000;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    if (this.isTokenExpired()) {
      this.clearUser();
      return false;
    }
    return true;
  }
}
