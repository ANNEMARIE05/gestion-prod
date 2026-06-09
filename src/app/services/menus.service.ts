import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getEnv } from '../utils/env.utils';
import { AuthStateService } from './auth-state.service';

interface MenusPayload {
  id?: number;
  code: string;
  libelle: string;
  icone?: string;
  lien?: string;
  menuId?: number;
  isActive?: boolean;
  actions: string[];
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MenusService {
  private baseUrl: string;

  constructor(private http: HttpClient, private authState: AuthStateService) {
    this.baseUrl = getEnv('apiBaseUrl');
  }

  private getAuthOptions() {
    const token = this.authState.getToken();
    if (token) {
      return {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
        observe: 'response' as const
      } as const;
    }
    return { observe: 'response' as const } as const;
  }

  create(payload: MenusPayload): Observable<HttpResponse<any>> {
    return this.http.post(`${this.baseUrl}/menus`, payload, this.getAuthOptions());
  }

  list(): Observable<HttpResponse<any>> {
    return this.http.get(`${this.baseUrl}/menus`, this.getAuthOptions());
  }

  getById(id: number): Observable<HttpResponse<any>> {
    return this.http.get(`${this.baseUrl}/menus/${id}`, this.getAuthOptions());
  }

  update(id: number, payload: MenusPayload): Observable<HttpResponse<any>> {
    return this.http.put(`${this.baseUrl}/menus/${id}`, payload, this.getAuthOptions());
  }

  delete(id: number): Observable<HttpResponse<any>> {
    return this.http.delete(`${this.baseUrl}/menus/${id}`, this.getAuthOptions());
  }
}