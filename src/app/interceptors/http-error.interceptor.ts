import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ErrorHandlerService } from '../services/error-handler.service';
import { AuthStateService } from '../services/auth-state.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private errorHandler: ErrorHandlerService,
    private authState: AuthStateService,
    private router: Router,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error?.status === 401 || error?.status === 403) {
          const url = request.url || '';
          const isLoginRequest = url.includes('auth/login');
          const isAssetRequest = url.includes('/assets/');

          if (!isAssetRequest && !isLoginRequest && !this.router.url.startsWith('/login')) {
            this.authState.clearUser();
            localStorage.clear();
            this.router.navigate(['/login']);
          }
        }

        const errorMessage = this.errorHandler.getErrorMessage(error);
        const customError = new Error(errorMessage);
        (customError as any).httpError = error;

        return throwError(() => customError);
      }),
    );
  }
}
