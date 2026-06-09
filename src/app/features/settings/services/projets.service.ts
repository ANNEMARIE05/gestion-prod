import { AxiosHttpClient } from '../../../core/services/axios-http-client.service';
import { Injectable } from '@angular/core';
import { HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getEnv } from '../../../utils/env.utils';
import { AuthStateService } from '../../auth/services/auth-state.service';

interface ProjetsPayload {
  id?: number;
  code: string;
  libelle: string;
  description?: string;
  tpm: string;
  ressources: [string];
  createdAt?: string;
}


@Injectable({
  providedIn: 'root'
})

export class ProjetsService {
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

  private getAuthOptionsBlob() {
    const token = this.authState.getToken();

    return {
      headers: token
        ? new HttpHeaders({ Authorization: `Bearer ${token}` })
        : undefined,
      responseType: 'blob' as const,
      observe: 'response' as const
    };
  }

  /**
   * Appel POST /api/projets (observe full response pour vérifier le status)
   */
  create(payload: ProjetsPayload): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.baseUrl}/projets`, payload, this.getAuthOptions());
  }

  list(payload: ProjetsPayload): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/projets`, this.getAuthOptions());
  }

  getById(id: number): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/projets/${id}`, this.getAuthOptions());
  }

  update(id: number, payload: ProjetsPayload): Observable<HttpResponse<any>> {
    return this.http.put<any>(`${this.baseUrl}/projets/${id}`, payload, this.getAuthOptions());
  }

  delete(id: number): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${this.baseUrl}/projets/${id}`, this.getAuthOptions());
  }

  /**
   * Exporte les projets au format CSV
   */
  exportCsv(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.baseUrl}/projets/export/csv`,
      this.getAuthOptionsBlob()
    );
  }

  /**
   * Importe les projets depuis un fichier CSV
   */
  importCsv(file: File): Observable<HttpResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(
      `${this.baseUrl}/projets/import/csv`,
      formData,
      this.getAuthOptions()
    );
  }

  /**
   * Télécharge le modèle CSV pour l'import des projets
   */
  downloadTemplate(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.baseUrl}/projets/import/template`,
      this.getAuthOptionsBlob()
    );
  }

  // Ajoutez d'autres endpoints ici selon vos besoins
}
