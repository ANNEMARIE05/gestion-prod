import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getEnv } from '../utils/env.utils';
import { AuthStateService } from './auth-state.service';

interface JalonsPayload {
  id?: number;
  code: string;
  libelle: string;
  jalonId?: number; // ID du jalon parent pour l'enregistrement (format API)
  applications?: number[]; // IDs des applications liées au jalon
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})

export class JalonsService {
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
   * Transforme le payload frontend (jalonParentId) vers le format API (jalonId)
   */
  private transformToApiFormat(payload: any): any {
    const apiPayload: any = { ...payload };
    if (!apiPayload.libelle && apiPayload.name) {
      apiPayload.libelle = apiPayload.name;
      delete apiPayload.name;
    }
    if (!apiPayload.libelle && apiPayload.label) {
      apiPayload.libelle = apiPayload.label;
      delete apiPayload.label;
    }
    // Transformer jalonParentId en jalonId (le payload API attend jalonId, pas parent)
    if ('jalonParentId' in apiPayload && apiPayload.jalonParentId !== undefined && apiPayload.jalonParentId !== null) {
      apiPayload.jalonId = apiPayload.jalonParentId;
      delete apiPayload.jalonParentId;
    } else if ('jalonParentId' in apiPayload && (apiPayload.jalonParentId === null || apiPayload.jalonParentId === undefined)) {
      // Si jalonParentId est null/undefined, ne pas l'envoyer
      delete apiPayload.jalonParentId;
    }
    // Supprimer les champs qui ne doivent pas être envoyés à l'API
    delete apiPayload.parent;
    delete apiPayload.sousJalons;
    delete apiPayload.livrablesAttendus;
    delete apiPayload.active;
    return apiPayload;
  }

  /**
   * Transforme la réponse API (parent) vers le format frontend (jalonParentId)
   * L'API retourne "parent" comme objet Jalon ou null, on le conserve tel quel
   */
  private transformFromApiFormat(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.transformFromApiFormat(item));
    }
    if (data && typeof data === 'object') {
      const transformed: any = { ...data };
      // Conserver parent tel quel (objet Jalon ou null) et extraire l'ID dans jalonParentId si besoin
      if ('parent' in transformed) {
        if (transformed.parent && typeof transformed.parent === 'object') {
          // Parent est un objet Jalon - on le transforme récursivement et on extrait l'ID
          transformed.parent = this.transformFromApiFormat(transformed.parent);
          transformed.jalonParentId = transformed.parent.id;
        } else if (transformed.parent === null || transformed.parent === undefined) {
          // Parent est null ou undefined
          transformed.jalonParentId = undefined;
          // On garde parent: null tel quel car le frontend l'utilise
        }
      }
      return transformed;
    }
    return data;
  }

  /**
   * Appel POST /api/jalons (observe full response pour vérifier le status)
   */
  create(payload: JalonsPayload): Observable<HttpResponse<any>> {
    const apiPayload = this.transformToApiFormat(payload);
    return new Observable(observer => {
      this.http.post<any>(`${this.baseUrl}/jalons`, apiPayload, this.getAuthOptions()).subscribe(
        response => {
          if (response.body) {
            const transformedBody = this.transformFromApiFormat(response.body);
            observer.next({ ...response, body: transformedBody } as HttpResponse<any>);
          } else {
            observer.next(response);
          }
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  list(payload: JalonsPayload): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      this.http.get<any>(`${this.baseUrl}/jalons`, this.getAuthOptions()).subscribe(
        response => {
          if (response.body) {
            const transformedBody = this.transformFromApiFormat(response.body);
            observer.next({ ...response, body: transformedBody } as HttpResponse<any>);
          } else {
            observer.next(response);
          }
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  getById(id: number): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      this.http.get<any>(`${this.baseUrl}/jalons/${id}`, this.getAuthOptions()).subscribe(
        response => {
          if (response.body) {
            const transformedBody = this.transformFromApiFormat(response.body);
            observer.next({ ...response, body: transformedBody } as HttpResponse<any>);
          } else {
            observer.next(response);
          }
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  update(id: number, payload: JalonsPayload): Observable<HttpResponse<any>> {
    const apiPayload = this.transformToApiFormat(payload);
    return new Observable(observer => {
      this.http.put<any>(`${this.baseUrl}/jalons/${id}`, apiPayload, this.getAuthOptions()).subscribe(
        response => {
          if (response.body) {
            const transformedBody = this.transformFromApiFormat(response.body);
            observer.next({ ...response, body: transformedBody } as HttpResponse<any>);
          } else {
            observer.next(response);
          }
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  delete(id: number): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${this.baseUrl}/jalons/${id}`, this.getAuthOptions());
  }

  /**
   * Exporte les jalons au format CSV
   */
  exportCsv(): Observable<HttpResponse<Blob>> {
    const token = this.authState.getToken();
    return this.http.get(
      `${this.baseUrl}/jalons/export/csv`,
      {
        headers: token
          ? new HttpHeaders({ Authorization: `Bearer ${token}` })
          : undefined,
        responseType: 'blob' as const,
        observe: 'response' as const
      }
    );
  }

  /**
   * Importe les jalons à partir d'un fichier CSV
   */
  importCsv(file: File): Observable<HttpResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.authState.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.post<any>(
      `${this.baseUrl}/jalons/import/csv`,
      formData,
      { headers, observe: 'response' as const }
    );
  }

  /**
   * Télécharge le modèle CSV pour l'import des jalons
   */
  downloadTemplate(): Observable<HttpResponse<Blob>> {
    const token = this.authState.getToken();
    return this.http.get(
      `${this.baseUrl}/jalons/import/template`,
      {
        headers: token
          ? new HttpHeaders({ Authorization: `Bearer ${token}` })
          : undefined,
        responseType: 'blob' as const,
        observe: 'response' as const
      }
    );
  }
}
