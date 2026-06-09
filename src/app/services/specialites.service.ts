import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getEnv } from '../utils/env.utils';
import { AuthStateService } from './auth-state.service';

interface SpecialitesPayload {
  id?: number;
  code: string;
  libelle: string;
  description: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})

export class SpecialitesService {
  private baseUrl: string;

  constructor(private http: HttpClient, private authState: AuthStateService) {
    this.baseUrl = getEnv('apiBaseUrl');
  }

  private getAuthOptions() {
    const token = this.authState.getToken();
    if (token) {
      return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }), observe: 'response' as const } as const;
    }
    return { observe: 'response' as const } as const;
  }

  /**
   * Appel POST /api/specialites (observe full response pour vérifier le status)
   */
  create(payload: SpecialitesPayload): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.baseUrl}/specialites`, payload, this.getAuthOptions());
  }

  list(payload: SpecialitesPayload): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/specialites`, this.getAuthOptions());
  }

  getById(id: number): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/specialites/${id}`, this.getAuthOptions());
  }

  update(id: number, payload: SpecialitesPayload): Observable<HttpResponse<any>> {
    return this.http.put<any>(`${this.baseUrl}/specialites/${id}`, payload, this.getAuthOptions());
  }

  delete(id: number): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${this.baseUrl}/specialites/${id}`, this.getAuthOptions());
  }

  // Ajoutez d'autres endpoints ici selon vos besoins
}
