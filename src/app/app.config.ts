import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { LoaderInterceptor } from './interceptors/loader.interceptor';

export function appConfigFactory(http: HttpClient) {
  return () =>
    firstValueFrom(http.get('/assets/config.json'))
      .then((cfg) => {
        (window as any).__env = { ...((window as any).__env || {}), ...cfg };
      })
      .catch(() => {
        (window as any).__env = (window as any).__env || {};
      });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom(HttpClientModule),
    {
      provide: APP_INITIALIZER,
      useFactory: appConfigFactory,
      deps: [HttpClient],
      multi: true,
    },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
  ],
};
