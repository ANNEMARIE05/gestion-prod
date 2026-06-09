import { AxiosHttpClient } from '../../../core/services/axios-http-client.service';
import { Injectable } from '@angular/core';
import { HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getEnv } from '../../../utils/env.utils';
import { AuthStateService } from '../../auth/services/auth-state.service';

interface ApplicationsPayload {
  id?: number;
  code: string;
  libelle: string;
  description?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})

export class ApplicationsService {
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
   * Appel POST /api/applications (observe full response pour vérifier le status)
   */
  create(payload: ApplicationsPayload): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.baseUrl}/applications`, payload, this.getAuthOptions());
  }

  list(payload: ApplicationsPayload): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/applications`, this.getAuthOptions());
  }

  getById(id: number): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/applications/${id}`, this.getAuthOptions());
  }

  update(id: number, payload: ApplicationsPayload): Observable<HttpResponse<any>> {
    return this.http.put<any>(`${this.baseUrl}/applications/${id}`, payload, this.getAuthOptions());
  }

  delete(id: number): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${this.baseUrl}/applications/${id}`, this.getAuthOptions());
  }

  // Ajoutez d'autres endpoints ici selon vos besoins
}

