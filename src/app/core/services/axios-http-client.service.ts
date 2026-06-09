import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { AuthStateService } from '../../features/auth/services/auth-state.service';
import { LoaderService } from './loader.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AxiosHttpClient {
  private axiosInstance: AxiosInstance;
  private loaderService = inject(LoaderService);
  private authState = inject(AuthStateService);
  private router = inject(Router);
  private activeRequests = 0;

  constructor() {
    this.axiosInstance = axios.create();

    // Intercepteur de requête : attache le token et active le loader
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.showLoader();

        const token = this.authState.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        this.hideLoader();
        return Promise.reject(error);
      }
    );

    // Intercepteur de réponse : gère les redirections 401/403 et coupe le loader
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.hideLoader();
        return response;
      },
      (error) => {
        this.hideLoader();

        if (error.response) {
          const status = error.response.status;
          const url = error.config?.url || '';
          const isLoginRequest = url.includes('auth/login');

          // Si session expirée ou interdite (hors login)
          if ((status === 401 || status === 403) && !isLoginRequest && !this.router.url.startsWith('/login')) {
            this.authState.clearUser();
            localStorage.clear();
            this.router.navigate(['/login']);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private showLoader() {
    this.activeRequests++;
    this.loaderService.show();
  }

  private hideLoader() {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      this.loaderService.hide();
    }
  }

  private mapResponse<T>(res: AxiosResponse<T>) {
    // Fournit une structure compatible avec le HttpResponse d'Angular
    return {
      body: res.data,
      status: res.status,
      statusText: res.statusText,
      headers: {
        get: (name: string) => {
          const val = res.headers[name.toLowerCase()];
          return Array.isArray(val) ? val.join(', ') : (val || null);
        },
        keys: () => Object.keys(res.headers),
      },
    };
  }

  get<T>(url: string, options?: any): Observable<any> {
    const config = this.buildConfig(options);
    return from(this.axiosInstance.get<T>(url, config)).pipe(
      map((res) => this.mapResponse(res))
    );
  }

  post<T>(url: string, body: any, options?: any): Observable<any> {
    const config = this.buildConfig(options);
    return from(this.axiosInstance.post<T>(url, body, config)).pipe(
      map((res) => this.mapResponse(res))
    );
  }

  put<T>(url: string, body: any, options?: any): Observable<any> {
    const config = this.buildConfig(options);
    return from(this.axiosInstance.put<T>(url, body, config)).pipe(
      map((res) => this.mapResponse(res))
    );
  }

  delete<T>(url: string, options?: any): Observable<any> {
    const config = this.buildConfig(options);
    return from(this.axiosInstance.delete<T>(url, config)).pipe(
      map((res) => this.mapResponse(res))
    );
  }

  private buildConfig(options?: any): AxiosRequestConfig {
    const config: AxiosRequestConfig = {};
    if (options) {
      if (options.responseType) {
        config.responseType = options.responseType;
      }
      if (options.headers) {
        // Optionnel : conversion des headers s'il y a des cas spécifiques
      }
    }
    return config;
  }
}
