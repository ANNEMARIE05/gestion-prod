import { AxiosHttpClient } from '../../../core/services/axios-http-client.service';
import { Injectable } from '@angular/core';
import { HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApplicationsService } from '../../settings/services/applications.service';
import { AuthStateService } from '../../auth/services/auth-state.service';
import { ProjetsService } from '../../settings/services/projets.service';
import { SpecialitesService } from '../../settings/services/specialites.service';
import { JalonsService } from '../../settings/services/jalons.service';
import { RessourcesService } from '../../users/services/ressources.service';
import { getEnv } from '../../../utils/env.utils';

interface PlanificationProjetPayload {
  id?: number;
  numero?: string;
  projetId?: number;
  applicationId?: number;
  serviceId?: number;
  responsableId?: number;
  typeDeProduction?: string;
  dateDeDebut?: string;
  dateDeFin?: string;
  etatAvancement?: number;
  jalonId?: number;
  problemeRencontrer?: string;
  actionCorrective?: string;
  statut?: string;
  dateDeFinRelle?: string;
  commentaire?: string;
  createdAt?: string;
}


@Injectable({
  providedIn: 'root'
})

export class PlanificationProjetService {
  private baseUrl: string;

  constructor(
    private http: AxiosHttpClient,
    private authState: AuthStateService,
    private projetsService: ProjetsService,
    private specialitesService: SpecialitesService,
    private jalonsService: JalonsService,
    private ressourcesService: RessourcesService,
    private applicationsService: ApplicationsService
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
   * Formate une date au format ISO avec l'heure
   * @param dateString Date au format YYYY-MM-DD
   * @param hour Heure (HH:mm:ss), par défaut "00:00:00"
   * @returns Date au format YYYY-MM-DDTHH:mm:ss
   */
  private formatDateWithTime(dateString: string | null | undefined, hour: string = "00:00:00"): string {
    if (!dateString) {
      return '';
    }
    // Si la date est déjà au format ISO avec l'heure, la retourner telle quelle
    if (dateString.includes('T')) {
      return dateString;
    }
    // Sinon, ajouter l'heure au format YYYY-MM-DD
    return `${dateString}T${hour}`;
  }

  /**
   * Transforme le payload frontend vers le format API selon PlanificationProjetPayload
   */
  private transformToApiFormat(payload: any): PlanificationProjetPayload {
    // Extraire la date au format YYYY-MM-DD (sans l'heure)
    const formatDateOnly = (dateString: string | undefined | null): string | undefined => {
      if (!dateString) return undefined;
      // Si la date contient 'T', extraire seulement la partie date
      if (dateString.includes('T')) {
        return dateString.split('T')[0];
      }
      return dateString;
    };

    // Convertir etatDAvancement en nombre si c'est une chaîne
    const parseEtatAvancement = (value: string | number | undefined): number | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Extraire le nombre de la chaîne (ex: "50%" -> 50, "50" -> 50)
        const num = parseFloat(value.replace('%', '').trim());
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    };

    return {
      numero: payload.numero || payload.code,
      projetId: payload.projetId,
      applicationId: payload.applicationId !== undefined && payload.applicationId !== null ? payload.applicationId : 0,
      serviceId: payload.serviceId || payload.specialiteId, // mapper specialiteId vers serviceId
      responsableId: payload.responsableId || payload.ressourceId, // mapper ressourceId vers responsableId
      typeDeProduction: payload.typeDeProduction || payload.typeProduction || "",
      dateDeDebut: formatDateOnly(payload.dateDeDebut || payload.dateDebut),
      dateDeFin: formatDateOnly(payload.dateDeFin || payload.dateFin),
      etatAvancement: parseEtatAvancement(payload.etatAvancement || payload.etatDAvancement),
      jalonId: payload.jalonId,
      problemeRencontrer: payload.problemeRencontrer || "",
      actionCorrective: payload.actionCorrective || "",
      statut: payload.statut || "NOK",
      dateDeFinRelle: formatDateOnly(payload.dateDeFinRelle),
      commentaire: payload.commentaire || ""
    };
  }

  private transformFromApiFormat(data: any): any {
    // Si c'est un tableau, mapper chaque élément
    if (Array.isArray(data)) {
      return data.map(item => this.transformFromApiFormat(item));
    }
    // Si c'est un objet, transformer les champs de l'API vers le format frontend
    if (data && typeof data === 'object') {
      const isValidDate = (value: any): boolean => {
        if (!value || typeof value !== 'string') {
          return false;
        }
        const timestamp = Date.parse(value);
        return !isNaN(timestamp);
      };

      const transformed: any = {
        ...data,
        // Transformer numero en code pour la cohérence avec le frontend
        code: data.numero || data.code,
        // Transformer serviceId en specialiteId pour la cohérence avec le frontend
        specialiteId: data.serviceId !== undefined ? data.serviceId : data.specialiteId,
        // Transformer responsableId en ressourceId pour la cohérence avec le frontend
        ressourceId: data.responsableId !== undefined ? data.responsableId : data.ressourceId,
        // Transformer typeDeProduction en typeProduction pour la cohérence avec le frontend
        typeProduction: data.typeDeProduction !== undefined ? data.typeDeProduction : data.typeProduction,
        // Ne convertir en ISO que si la date est valide, sinon renvoyer la valeur brute
        dateDeDebut: isValidDate(data.dateDeDebut)
          ? new Date(data.dateDeDebut).toISOString()
          : (data.dateDeDebut || ""),
        dateDeFin: isValidDate(data.dateDeFin)
          ? new Date(data.dateDeFin).toISOString()
          : (data.dateDeFin || ""),
        dateDeFinRelle: isValidDate(data.dateDeFinRelle)
          ? new Date(data.dateDeFinRelle).toISOString()
          : (data.dateDeFinRelle || ""),
        // Ajouter aussi dateDebut et dateFin (alias) pour la compatibilité avec le formulaire
        dateDebut: isValidDate(data.dateDeDebut)
          ? new Date(data.dateDeDebut).toISOString()
          : (data.dateDeDebut || data.dateDebut || ""),
        dateFin: isValidDate(data.dateDeFin)
          ? new Date(data.dateDeFin).toISOString()
          : (data.dateDeFin || data.dateFin || ""),
        // Conserver etatAvancement tel quel (c'est déjà un nombre dans l'API)
        etatAvancement: data.etatAvancement,
        // Ajouter aussi etatDAvancement (chaîne) pour la compatibilité avec le formulaire
        etatDAvancement: data.etatAvancement !== undefined && data.etatAvancement !== null
          ? String(data.etatAvancement)
          : data.etatDAvancement
      };

      return transformed;
    }
    return data;
  }

  /**
   * Appel POST /api/planification-projets (observe full response pour vérifier le status)
   */
  create(payload: PlanificationProjetPayload): Observable<HttpResponse<any>> {
    const apiPayload = this.transformToApiFormat(payload);
    return this.http.post<any>(`${this.baseUrl}/planification-projets`, apiPayload, this.getAuthOptions());
  }

  list(payload: PlanificationProjetPayload): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      this.http.get<any>(`${this.baseUrl}/planification-projets`, this.getAuthOptions()).subscribe(
        response => {
          // Pour la liste, on retourne les données telles quelles car elles sont déjà dans le bon format
          // avec les objets imbriqués (projetId, ressourceId, jalonId, specialiteId)
          observer.next(response);
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  getById(id: number): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      this.http.get<any>(`${this.baseUrl}/planification-projets/${id}`, this.getAuthOptions()).subscribe(
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

  update(id: number, payload: PlanificationProjetPayload): Observable<HttpResponse<any>> {
    const apiPayload = this.transformToApiFormat(payload);
    return new Observable(observer => {
      this.http.put<any>(`${this.baseUrl}/planification-projets/${id}`, apiPayload, this.getAuthOptions()).subscribe(
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
    return this.http.delete<any>(`${this.baseUrl}/planification-projets/${id}`, this.getAuthOptions());
  }

  /**
   * Récupère la liste des projets depuis l'API
   */
  getProjets(): Observable<HttpResponse<any>> {
    return this.projetsService.list({} as any);
  }

  /**
   * Récupère la liste des spécialités depuis l'API
   */
  getSpecialites(): Observable<HttpResponse<any>> {
    return this.specialitesService.list({} as any);
  }

  /**
   * Récupère la liste des jalons depuis l'API
   */
  getJalons(): Observable<HttpResponse<any>> {
    return this.jalonsService.list({} as any);
  }

  /**
   * Récupère la liste des ressources depuis l'API
   */
  getRessources(): Observable<HttpResponse<any>> {
    return this.ressourcesService.list({} as any);
  }

  /**
   * Récupère la liste des applications depuis l'API
   */
  getApplications(): Observable<HttpResponse<any>> {
    return this.applicationsService.list({} as any);
  }

  /**
   * Exporte les planifications de projets au format CSV
   */
  exportCsv(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.baseUrl}/planification-projets/export/csv`,
      {
        responseType: 'blob',
        observe: 'response'
      }
    );
  }

  /**
   * Importe les planifications de projets depuis un fichier CSV
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
      `${this.baseUrl}/planification-projets/import/csv`,
      formData,
      {
        headers: headers,
        observe: 'response' as const
      }
    );
  }

  /**
   * Télécharge le modèle CSV pour l'import des planifications de projets
   */
  downloadTemplate(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.baseUrl}/planification-projets/import/template`,
      this.getAuthOptionsBlob()
    );
  }
}
