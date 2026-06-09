import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getEnv } from '../utils/env.utils';
import { AuthStateService } from './auth-state.service';

interface ActionsPayload {
  id?: number;
  code: string;
  libelle: string;
  icone?: string;
  isActive?: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})

export class ActionsService {
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
   * Appel POST /api/actions (observe full response pour vérifier le status)
   */
  create(payload: ActionsPayload): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.baseUrl}/actions`, payload, this.getAuthOptions());
  }

  list(payload: ActionsPayload): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/actions`, this.getAuthOptions());
  }

  getById(id: number): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/actions/${id}`, this.getAuthOptions());
  }

  update(id: number, payload: ActionsPayload): Observable<HttpResponse<any>> {
    return this.http.put<any>(`${this.baseUrl}/actions/${id}`, payload, this.getAuthOptions());
  }

  updateByCode(code: string, payload: ActionsPayload): Observable<HttpResponse<any>> {
    return this.http.put<any>(`${this.baseUrl}/actions/${code}`, payload, this.getAuthOptions());
  }

  delete(id: number): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${this.baseUrl}/actions/${id}`, this.getAuthOptions());
  }

  deleteByCode(code: string): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${this.baseUrl}/actions/${code}`, this.getAuthOptions());
  }

  // Ajoutez d'autres endpoints ici selon vos besoins
}

