import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServicesService } from './services.service';
import { AuthStateService } from './auth-state.service';
import { VeillesService } from './veilles.service';
import { JalonsService } from './jalons.service';
import { SpecialitesService } from './specialites.service';
import { RessourcesService } from './ressources.service';
import { getEnv } from '../utils/env.utils';

interface PlanificationVeillePayload {
  id?: number;
  identification?: string;
  veilleId?: number;
  thematique?: string;
  serviceId?: number;
  source?: string;
  dateDecouverte?: string;
  jalonId?: number;
  opportuniteDetectee?: string;
  niveauMaturite?: string;
  responsableId?: number;
  impactPotentiel?: string;
  actionEntreprise?: string;
  statut?: string;
  dateFin?: string;
  commentaires?: string;
  createdAt?: string;
}


@Injectable({
  providedIn: 'root'
})

export class PlanificationVeilleService {
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private authState: AuthStateService,
    private veillesService: VeillesService,
    private jalonsService: JalonsService,
    private specialitesService: SpecialitesService,
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
   * Transforme le payload frontend vers le format API attendu
   * Mappe correctement les champs selon le format attendu par l'API
   */
  private transformToApiFormat(payload: any): any {
    const apiPayload: any = {};

    // Mapper identification (code) - chaîne optionnelle
    if (payload.code !== undefined && payload.code !== null && payload.code !== '') {
      apiPayload.identification = payload.code;
    }

    // Mapper les IDs numériques - seulement si définis et non nuls/non zéro
    if (payload.veilleId !== undefined && payload.veilleId !== null && payload.veilleId !== 0) {
      apiPayload.veilleId = payload.veilleId;
    }

    if (payload.specialiteId !== undefined && payload.specialiteId !== null && payload.specialiteId !== 0) {
      apiPayload.serviceId = payload.specialiteId;
    }

    if (payload.jalonId !== undefined && payload.jalonId !== null && payload.jalonId !== 0) {
      apiPayload.jalonId = payload.jalonId;
    }

    if (payload.ressourceId !== undefined && payload.ressourceId !== null && payload.ressourceId !== 0) {
      apiPayload.responsableId = payload.ressourceId;
    }

    // Mapper les chaînes - seulement si définies et non vides (sauf pour les champs optionnels)
    if (payload.thematique !== undefined && payload.thematique !== null && payload.thematique !== '') {
      apiPayload.thematique = payload.thematique;
    }

    if (payload.source !== undefined && payload.source !== null && payload.source !== '') {
      apiPayload.source = payload.source;
    }

    if (payload.dateDecouverte !== undefined && payload.dateDecouverte !== null && payload.dateDecouverte !== '') {
      apiPayload.dateDecouverte = payload.dateDecouverte;
    }

    if (payload.opportuniteDetectee !== undefined && payload.opportuniteDetectee !== null && payload.opportuniteDetectee !== '') {
      apiPayload.opportuniteDetectee = payload.opportuniteDetectee;
    }

    if (payload.niveauMaturite !== undefined && payload.niveauMaturite !== null && payload.niveauMaturite !== '') {
      apiPayload.niveauMaturite = payload.niveauMaturite;
    }

    if (payload.impactPotentiel !== undefined && payload.impactPotentiel !== null && payload.impactPotentiel !== '') {
      apiPayload.impactPotentiel = payload.impactPotentiel;
    }

    if (payload.actionEntreprise !== undefined && payload.actionEntreprise !== null && payload.actionEntreprise !== '') {
      apiPayload.actionEntreprise = payload.actionEntreprise;
    }

    if (payload.statut !== undefined && payload.statut !== null && payload.statut !== '') {
      apiPayload.statut = payload.statut;
    }

    // Champs optionnels - peuvent être des chaînes vides ou omis
    if (payload.dateFin !== undefined && payload.dateFin !== null && payload.dateFin !== '') {
      apiPayload.dateFin = payload.dateFin;
    }

    if (payload.commentaires !== undefined && payload.commentaires !== null && payload.commentaires !== '') {
      apiPayload.commentaires = payload.commentaires;
    }

    return apiPayload;
  }

  /**
   * Transforme la réponse API vers le format frontend
   * Gère les objets imbriqués et extrait les IDs correctement
   */
  private transformFromApiFormat(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.transformFromApiFormat(item));
    }
    if (data && typeof data === 'object') {
      const transformed: any = { ...data };

      // Mapper identification vers code
      if ('identification' in transformed && transformed.identification !== undefined) {
        transformed.code = transformed.identification;
      }

      // Préserver les objets imbriqués (veilleId, jalonId, serviceId, responsableId) car on en a besoin pour afficher les libelles
      // Ne pas transformer en IDs, garder les objets complets

      // Mapper serviceId vers specialiteId (mais garder serviceId aussi)
      if ('serviceId' in transformed && transformed.serviceId !== undefined) {
        transformed.specialiteId = transformed.serviceId;
      }

      // Mapper responsableId vers ressourceId (mais garder responsableId aussi)
      if ('responsableId' in transformed && transformed.responsableId !== undefined) {
        transformed.ressourceId = transformed.responsableId;
      }

      // Transformation pour active/isActive (si présent)
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
   * Crée une planification de veille
   * Le payload peut être au format frontend (code, specialiteId, ressourceId) ou API
   * La transformation gère la conversion vers le format API attendu
   */
  create(payload: any): Observable<HttpResponse<any>> {
    const apiPayload = this.transformToApiFormat(payload);
    return this.http.post<any>(`${this.baseUrl}/planification-veilles`, apiPayload, this.getAuthOptions());
  }

  list(payload: any): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      this.http.get<any>(`${this.baseUrl}/planification-veilles`, this.getAuthOptions()).subscribe(
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
      this.http.get<any>(`${this.baseUrl}/planification-veilles/${id}`, this.getAuthOptions()).subscribe(
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

  /**
   * Met à jour une planification de veille
   * Le payload peut être au format frontend (code, specialiteId, ressourceId) ou API
   * La transformation gère la conversion vers le format API attendu
   */
  update(id: number, payload: any): Observable<HttpResponse<any>> {
    const apiPayload = this.transformToApiFormat(payload);
    return new Observable(observer => {
      this.http.put<any>(`${this.baseUrl}/planification-veilles/${id}`, apiPayload, this.getAuthOptions()).subscribe(
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
    return this.http.delete<any>(`${this.baseUrl}/planification-veilles/${id}`, this.getAuthOptions());
  }

  /**
   * Récupère la liste des veilles depuis l'API
   */
  getVeilles(): Observable<HttpResponse<any>> {
    return this.veillesService.list({} as any);
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
   * Exporte les planifications de veille au format CSV
   */
  exportCsv(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.baseUrl}/planification-veilles/export/csv`,
      this.getAuthOptionsBlob()
    );
  }

  /**
   * Importe les planifications de veille depuis un fichier CSV
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
      `${this.baseUrl}/planification-veilles/import/csv`,
      formData,
      {
        headers: headers,
        observe: 'response' as const
      }
    );
  }

  /**
   * Télécharge le modèle CSV pour l'import des planifications de veille
   */
  downloadTemplate(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.baseUrl}/planification-veilles/import/template`,
      this.getAuthOptionsBlob()
    );
  }
}
