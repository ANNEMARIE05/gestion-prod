import { AxiosHttpClient } from '../../../core/services/axios-http-client.service';
import { Injectable } from '@angular/core';
import { HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getEnv } from '../../../utils/env.utils';
import { AuthStateService } from '../../auth/services/auth-state.service';

interface ServicesPayload {
  id?: number;
  code: string;
  libelle: string;
  departementId?: number;
  active?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})

export class ServicesService {
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
   * Appel POST /api/services (observe full response pour vérifier le status)
   */
  create(payload: ServicesPayload): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.baseUrl}/services`, payload, this.getAuthOptions());
  }

  list(payload: ServicesPayload): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/services`, this.getAuthOptions());
  }

  getById(id: number): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/services/${id}`, this.getAuthOptions());
  }

  update(id: number, payload: ServicesPayload): Observable<HttpResponse<any>> {
    return this.http.put<any>(`${this.baseUrl}/services/${id}`, payload, this.getAuthOptions());
  }

  delete(id: number): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${this.baseUrl}/services/${id}`, this.getAuthOptions());
  }

  // Ajoutez d'autres endpoints ici selon vos besoins
}

