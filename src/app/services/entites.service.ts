import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getEnv } from '../utils/env.utils';
import { AuthStateService } from './auth-state.service';

interface EntitiesPayload {
  id?: number;
  code?: string;
  libelle: string;
  isActive?: boolean;
  entiteId?: number; // ID de l'entité parente pour l'enregistrement
  createdAt?: string; // Support pour compatibilité avec l'API
}



@Injectable({
  providedIn: 'root'
})

export class EntitesService {
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
   * Transforme le payload frontend (active, entiteParentId) vers le format API (isActive, entiteId)
   */
  private transformToApiFormat(payload: any): any {
    const apiPayload: any = { ...payload };
    // Normaliser libelle depuis name si besoin
    if (!apiPayload.libelle && apiPayload.name) {
      apiPayload.libelle = apiPayload.name;
      delete apiPayload.name;
    }
    // Transformer active en isActive
    if ('active' in apiPayload && apiPayload.active !== undefined) {
      apiPayload.isActive = apiPayload.active;
      delete apiPayload.active;
    }
    // Transformer entiteParentId en entiteId (le payload API attend entiteId, pas parent)
    if ('entiteParentId' in apiPayload && apiPayload.entiteParentId !== undefined && apiPayload.entiteParentId !== null) {
      apiPayload.entiteId = apiPayload.entiteParentId;
      delete apiPayload.entiteParentId;
    } else if ('entiteParentId' in apiPayload && (apiPayload.entiteParentId === null || apiPayload.entiteParentId === undefined)) {
      // Si entiteParentId est null/undefined, ne pas l'envoyer ou le mettre à null explicitement
      delete apiPayload.entiteParentId;
    }
    return apiPayload;
  }

  /**
   * Transforme la réponse API (isActive, parent) vers le format frontend (active, parent)
   * L'API retourne "parent" comme objet Entite ou null, on le conserve tel quel
   */
  private transformFromApiFormat(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.transformFromApiFormat(item));
    }
    if (data && typeof data === 'object') {
      const transformed: any = { ...data };
      // Transformer isActive en active
      if ('isActive' in transformed) {
        transformed.active = transformed.isActive;
        delete transformed.isActive;
      }
      // Conserver parent tel quel (objet Entite ou null) et extraire l'ID dans entiteParentId si besoin
      if ('parent' in transformed) {
        if (transformed.parent && typeof transformed.parent === 'object') {
          // Parent est un objet Entite - on le transforme récursivement et on extrait l'ID
          transformed.parent = this.transformFromApiFormat(transformed.parent);
          transformed.entiteParentId = transformed.parent.id;
        } else if (transformed.parent === null || transformed.parent === undefined) {
          // Parent est null ou undefined
          transformed.entiteParentId = undefined;
          // On garde parent: null tel quel car le frontend l'utilise (voir entites-list.component.ts ligne 63)
        }
      }
      return transformed;
    }
    return data;
  }

  /**
   * Appel POST /api/entites (observe full response pour vérifier le status)
   */
  create(payload: EntitiesPayload): Observable<HttpResponse<any>> {
    const apiPayload = this.transformToApiFormat(payload);
    return this.http.post<any>(`${this.baseUrl}/entites`, apiPayload, this.getAuthOptions());
  }

  list(payload: EntitiesPayload): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      this.http.get<any>(`${this.baseUrl}/entites`, this.getAuthOptions()).subscribe(
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
      this.http.get<any>(`${this.baseUrl}/entites/${id}`, this.getAuthOptions()).subscribe(
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

  update(id: number, payload: EntitiesPayload): Observable<HttpResponse<any>> {
    const apiPayload = this.transformToApiFormat(payload);
    return new Observable(observer => {
      this.http.put<any>(`${this.baseUrl}/entites/${id}`, apiPayload, this.getAuthOptions()).subscribe(
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
    return this.http.delete<any>(`${this.baseUrl}/entites/${id}`, this.getAuthOptions());
  }

  /**
   * Exporte les entités au format CSV
   */
  exportCsv(): Observable<HttpResponse<Blob>> {
    const token = this.authState.getToken();
    return this.http.get(
      `${this.baseUrl}/entites/export/csv`,
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
   * Importe les entités à partir d'un fichier CSV
   */
  importCsv(file: File): Observable<HttpResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.authState.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.post<any>(
      `${this.baseUrl}/entites/import/csv`,
      formData,
      { headers, observe: 'response' as const }
    );
  }

  /**
   * Télécharge le modèle CSV pour l'import des entités
   */
  downloadTemplate(): Observable<HttpResponse<Blob>> {
    const token = this.authState.getToken();
    return this.http.get(
      `${this.baseUrl}/entites/import/template`,
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
