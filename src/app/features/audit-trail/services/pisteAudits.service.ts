import { AxiosHttpClient } from '../../../core/services/axios-http-client.service';
import { Injectable } from '@angular/core';
import { HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getEnv } from '../../../utils/env.utils';
import { AuthStateService } from '../../auth/services/auth-state.service';

export interface PisteAuditsPayload {
  id?: number;
  action?: string;
  tableName?: string;
  oldValues?: string;
  newValues?: string;
  ressourceId?: number;
  responsableNom?: string;
  responsableEmail?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})

export class PisteAuditsService {
  private baseUrl: string;

  constructor(private http: AxiosHttpClient, private authState: AuthStateService) {
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
   * Appel POST /api/piste-audits (observe full response pour vérifier le status)
   */
  create(payload: PisteAuditsPayload): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.baseUrl}/piste-audits`, payload, this.getAuthOptions());
  }

  list(): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/piste-audits`, this.getAuthOptions());
  }

  getById(id: number): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/piste-audits/${id}`, this.getAuthOptions());
  }

  update(id: number, payload: PisteAuditsPayload): Observable<HttpResponse<any>> {
    return this.http.put<any>(`${this.baseUrl}/piste-audits/${id}`, payload, this.getAuthOptions());
  }

  delete(id: number): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${this.baseUrl}/piste-audits/${id}`, this.getAuthOptions());
  }

  // Ajoutez d'autres endpoints ici selon vos besoins
}
