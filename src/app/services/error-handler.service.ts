import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../shared/components/error-dialog/error-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private dialog = inject(MatDialog);

  /**
   * Message utilisateur à partir d'un corps de réponse API JSON.
   * Priorité : `details`, `detail`, puis `message`.
   */
  getApiPayloadMessage(body: any): string | null {
    return this.extractApiUserMessage(body);
  }

  /**
   * Obtient un message d'erreur utilisateur à partir d'une erreur HTTP
   */
  getErrorMessage(error: any): string {
    if (error && (error as any).httpError) {
      const httpErr = (error as any).httpError as HttpErrorResponse;
      const fromBody = this.extractApiUserMessage(httpErr.error);
      if (fromBody) {
        return fromBody;
      }
      return error.message;
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0 || error.error instanceof ErrorEvent) {
        return 'Erreur de connexion à l\'API. Veuillez vérifier votre connexion réseau.';
      }

      if (error.status >= 500) {
        return 'Erreur serveur. Veuillez réessayer plus tard.';
      }

      if (error.status === 404) {
        return 'Ressource non trouvée.';
      }

      if (error.status === 401) {
        return 'Session expirée. Veuillez vous reconnecter.';
      }

      if (error.status === 403) {
        return 'Accès interdit. Vous n\'avez pas les permissions nécessaires.';
      }

      if (error.status === 400) {
        const fromBody = this.extractApiUserMessage(error.error);
        if (fromBody) {
          return fromBody;
        }
        if (error.error && typeof error.error === 'string') {
          return error.error;
        }
        return 'Requête invalide. Veuillez vérifier les données saisies.';
      }

      const fromBody = this.extractApiUserMessage(error.error);
      if (fromBody) {
        return fromBody;
      }

      return `Erreur lors de la communication avec l'API (${error.status}).`;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return (error as any).message;
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  /**
   * Extrait le texte le plus pertinent d'un corps d'erreur (objet ou chaîne).
   */
  private extractApiUserMessage(body: any): string | null {
    if (body == null) {
      return null;
    }
    if (typeof body === 'string') {
      const t = body.trim();
      return t.length ? t : null;
    }
    if (typeof body !== 'object') {
      return null;
    }

    const rawDetail = (body as any).details ?? (body as any).detail;
    if (rawDetail != null) {
      if (typeof rawDetail === 'string') {
        const t = rawDetail.trim();
        if (t.length) {
          return t;
        }
      } else if (Array.isArray(rawDetail)) {
        const parts = rawDetail
          .map((x) => (typeof x === 'string' ? x.trim() : String(x)))
          .filter(Boolean);
        if (parts.length) {
          return parts.join(' ');
        }
      }
    }

    const msg = (body as any).message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }

    return null;
  }

  /**
   * Liste des messages d'erreur à présenter à l'utilisateur.
   * Renvoie tous les détails (`details`/`detail` en tableau) quand ils existent,
   * sinon un message unique synthétique.
   */
  getErrorMessages(error: any): string[] {
    const body = this.extractErrorBody(error);
    const details = this.extractApiUserMessageList(body);
    if (details.length) {
      return details;
    }
    return [this.getErrorMessage(error)];
  }

  /**
   * Affiche une erreur à l'utilisateur dans une modal.
   */
  showError(error: any, title?: string): void {
    this.openErrorModal(this.getErrorMessages(error), title);
  }

  /**
   * Affiche un ou plusieurs messages d'erreur personnalisés dans une modal.
   */
  showCustomError(message: string | string[], title?: string): void {
    const messages = (Array.isArray(message) ? message : [message]).filter(Boolean);
    this.openErrorModal(messages.length ? messages : ['Une erreur est survenue. Veuillez réessayer.'], title);
  }

  private openErrorModal(messages: string[], title?: string): void {
    this.dialog.open(ErrorDialogComponent, {
      width: '480px',
      maxWidth: '92vw',
      panelClass: 'app-rounded-dialog',
      data: { title, messages },
    });
  }

  /** Extrait le corps JSON pertinent depuis les différentes formes d'erreur. */
  private extractErrorBody(error: any): any {
    if (error && (error as any).httpError) {
      return ((error as any).httpError as HttpErrorResponse).error;
    }
    if (error instanceof HttpErrorResponse) {
      return error.error;
    }
    return error;
  }

  /** Extrait une liste de messages depuis `details`/`detail` (tableau ou chaîne). */
  private extractApiUserMessageList(body: any): string[] {
    if (body == null || typeof body !== 'object') {
      return [];
    }
    const rawDetail = (body as any).details ?? (body as any).detail;
    if (Array.isArray(rawDetail)) {
      return rawDetail
        .map((x) => (typeof x === 'string' ? x.trim() : String(x).trim()))
        .filter(Boolean);
    }
    if (typeof rawDetail === 'string' && rawDetail.trim()) {
      return [rawDetail.trim()];
    }
    return [];
  }
}
