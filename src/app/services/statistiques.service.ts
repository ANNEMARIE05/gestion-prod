import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getEnv } from '../utils/env.utils';
import { AuthStateService } from './auth-state.service';

export interface StatistiquesResponse {
  total_ressources: number;
  ressources_planifiees: number;
  ressources_disponibles: number;
  total_projets: number;
  projets_en_cours: number;
  projets_termines: number;
  total_audits_informatiques: number;
  audits_en_cours: number;
  audits_termines: number;
  total_veille_ingenierie: number;
  veille_en_cours: number;
  veille_termines: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatistiquesService {
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
   * Récupère les statistiques globales depuis l'API
   */
  getStatistiques(): Observable<HttpResponse<StatistiquesResponse>> {
    return this.http.get<StatistiquesResponse>(`${this.baseUrl}/statistiques`, this.getAuthOptions());
  }
}
