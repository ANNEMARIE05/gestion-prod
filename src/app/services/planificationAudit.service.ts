import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServicesService } from './services.service';
import { AuthStateService } from './auth-state.service';
import { JalonsService } from './jalons.service';
import { SpecialitesService } from './specialites.service';
import { EntitesService } from './entites.service';
import { AuditsService } from './audits.service';
import { RessourcesService } from './ressources.service';
import { getEnv } from '../utils/env.utils';

interface PlanificationAuditPayload {
  id?: number;
  code?: string;
  auditId?: number;
  typeAudit?: string;
  objectifAudit?: string;
  dateRealisation?: string;
  serviceId?: number;
  auditeurId?: number;
  jalonId?: number;
  resultats?: string;
  nonConformitesDetectees?: string;
  recommandations?: string;
  responsableId?: number;
  echeanceActions?: string;
  tauxRealisation?: number;
  commentaires?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})

export class PlanificationAuditService {
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private authState: AuthStateService,
    private jalonsService: JalonsService,
    private specialitesService: SpecialitesService,
    private entitesService: EntitesService,
    private auditsService: AuditsService,
    private ressourcesService: RessourcesService,
    private servicesService: ServicesService
  ) {
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
   * Transforme le payload frontend (active) vers le format API (isActive)
   */
  private transformToApiFormat(payload: any): any {
    const apiPayload: any = { ...payload };
    if ('active' in apiPayload && apiPayload.active !== undefined) {
      apiPayload.isActive = apiPayload.active;
      delete apiPayload.active;
    }
    if ('entiteParentId' in apiPayload && apiPayload.entiteParentId !== undefined) {
      apiPayload.parent = apiPayload.entiteParentId;
      delete apiPayload.entiteParentId;
    }
    return apiPayload;
  }

  /**
   * Transforme la réponse API (isActive) vers le format frontend (active)
   */
  private transformFromApiFormat(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.transformFromApiFormat(item));
    }
    if (data && typeof data === 'object') {
      const transformed: any = { ...data };
      if ('isActive' in transformed) {
        transformed.active = transformed.isActive;
        delete transformed.isActive;
      }
      if ('parent' in transformed) {
        transformed.entiteParentId = transformed.parent;
        delete transformed.parent;
      }
      return transformed;
    }
    return data;
  }

  /**
   * Appel POST /api/planification-audits (observe full response pour vérifier le status)
   */
  create(payload: PlanificationAuditPayload): Observable<HttpResponse<any>> {
    const apiPayload = this.transformToApiFormat(payload);
    return this.http.post<any>(`${this.baseUrl}/planification-audits`, apiPayload, this.getAuthOptions());
  }

  list(payload: PlanificationAuditPayload): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      this.http.get<any>(`${this.baseUrl}/planification-audits`, this.getAuthOptions()).subscribe(
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
      this.http.get<any>(`${this.baseUrl}/planification-audits/${id}`, this.getAuthOptions()).subscribe(
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

  update(id: number, payload: PlanificationAuditPayload): Observable<HttpResponse<any>> {
    const apiPayload = this.transformToApiFormat(payload);
    return new Observable(observer => {
      this.http.put<any>(`${this.baseUrl}/planification-audits/${id}`, apiPayload, this.getAuthOptions()).subscribe(
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
    return this.http.delete<any>(`${this.baseUrl}/planification-audits/${id}`, this.getAuthOptions());
  }

  /**
   * Récupère la liste des jalons depuis l'API
   */
  getJalons(): Observable<HttpResponse<any>> {
    return this.jalonsService.list({} as any);
  }

  /**
   * Récupère la liste des spécialités depuis l'API
   */
  getSpecialites(): Observable<HttpResponse<any>> {
    return this.specialitesService.list({} as any);
  }

  /**
   * Récupère la liste des entités depuis l'API
   */
  getEntites(): Observable<HttpResponse<any>> {
    return this.entitesService.list({} as any);
  }

  /**
   * Récupère la liste des audits depuis l'API
   */
  getAudits(): Observable<HttpResponse<any>> {
    return this.auditsService.list({} as any);
  }

  /**
   * Récupère la liste des ressources depuis l'API
   */
  getRessources(): Observable<HttpResponse<any>> {
    return this.ressourcesService.list({} as any);
  }

  /**
   * Récupère la liste des services depuis l'API
   */
  getServices(): Observable<HttpResponse<any>> {
    return this.servicesService.list({} as any);
  }

  /**
   * Exporte les planifications d'audits au format CSV
   */
  exportCsv(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.baseUrl}/planification-audits/export/csv`,
      this.getAuthOptionsBlob()
    );
  }

  /**
   * Importe les planifications d'audits depuis un fichier CSV
   */
  importCsv(file: File): Observable<HttpResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.authState.getToken();
    const headers = new HttpHeaders();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post<any>(
      `${this.baseUrl}/planification-audits/import/csv`,
      formData,
      {
        headers: headers,
        observe: 'response' as const
      }
    );
  }

  /**
   * Télécharge le modèle CSV pour l'import des planifications d'audits
   */
  downloadTemplate(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.baseUrl}/planification-audits/import/template`,
      this.getAuthOptionsBlob()
    );
  }
}
