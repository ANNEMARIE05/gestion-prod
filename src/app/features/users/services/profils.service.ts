import { AxiosHttpClient } from '../../../core/services/axios-http-client.service';
import { Injectable } from '@angular/core';
import { HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getEnv } from '../../../utils/env.utils';
import { AuthStateService } from '../../auth/services/auth-state.service';

interface ProfilsPayload {
  id?: string;
  code: string;
  libelle: string;
  createdAt?: string;
  permissionRequests?: Array<{
    menuId: number;
    actionIds: string[];
  }>;
}

@Injectable({
  providedIn: 'root'
})

export class ProfilsService {
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
   * Appel POST /api/profils (observe full response pour vérifier le status)
   */
  create(payload: ProfilsPayload): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.baseUrl}/profils`, payload, this.getAuthOptions());
  }

  list(): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/profils`, this.getAuthOptions());
  }

  getById(id: number): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/profils/${id}`, this.getAuthOptions());
  }

  update(id: number, payload: ProfilsPayload): Observable<HttpResponse<any>> {
    return this.http.put<any>(`${this.baseUrl}/profils/${id}`, payload, this.getAuthOptions());
  }

  delete(id: number): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${this.baseUrl}/profils/${id}`, this.getAuthOptions());
  }

  /**
   * Ajouter une habilitation (menu/actions) à un profil
   * Format attendu: { profilId: number, menuId: number, actionIds: string[] }
   * Un seul objet par appel
   */
  addMenuAction(habilitation: { profilId: number, menuId: number, actionIds: string[] }) {
    return this.http.post<any>(`${this.baseUrl}/profils/menu/actions/add`, habilitation, this.getAuthOptions());
  }

  /**
   * Exporte les profils au format CSV
   */
  exportCsv(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.baseUrl}/profils/export/csv`,
      this.getAuthOptionsBlob()
    );
  }

  /**
   * Importe les profils depuis un fichier CSV
   */
  importCsv(file: File): Observable<HttpResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(
      `${this.baseUrl}/profils/import/csv`,
      formData,
      this.getAuthOptions()
    );
  }

  /**
   * Télécharge le modèle CSV pour l'import des profils
   */
  downloadTemplate(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.baseUrl}/profils/import/template`,
      this.getAuthOptionsBlob()
    );
  }
}