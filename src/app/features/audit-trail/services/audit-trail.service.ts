import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { PisteAuditsService } from './pisteAudits.service';
import { AuthService } from '../../auth/services/auth.service';
import { extractApiBody, extractApiCreatedAt, parseApiDate } from '../../../utils/api-response.utils';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  tableName: string;
  oldValues: string;
  newValues: string;
  ressourceId: string;
  responsableNom: string;
  responsableEmail: string;
  timestamp: Date;
}

function normalizeAction(value: unknown): AuditAction {
  const raw = String(value ?? 'UPDATE').toUpperCase();
  if (raw.includes('CREATE') || raw.includes('CREER') || raw.includes('INSERT') || raw.includes('AJOUT')) {
    return 'CREATE';
  }
  if (raw.includes('DELETE') || raw.includes('SUPPR') || raw.includes('REMOVE')) {
    return 'DELETE';
  }
  if (raw.includes('LOGIN') || raw.includes('CONNEXION')) return 'LOGIN';
  if (raw.includes('LOGOUT') || raw.includes('DECONNEXION')) return 'LOGOUT';
  if (raw.includes('PASSWORD') || raw.includes('MOT_DE_PASSE')) return 'PASSWORD_CHANGE';
  return 'UPDATE';
}

function mapPisteAudit(row: any): AuditEntry {
  return {
    id: String(row.id ?? row.ressourceId ?? Math.random().toString(36).slice(2)),
    action: normalizeAction(row.action),
    tableName: String(row.tableName ?? '-'),
    oldValues: String(row.oldValues ?? ''),
    newValues: String(row.newValues ?? ''),
    ressourceId: String(row.ressourceId ?? '-'),
    responsableNom: String(row.responsableNom ?? 'Système'),
    responsableEmail: String(row.responsableEmail ?? ''),
    timestamp: parseApiDate(row.createdAt ?? row.timestamp) ?? extractApiCreatedAt(row) ?? new Date(),
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuditTrailService {
  private pisteApi = inject(PisteAuditsService);
  private auth = inject(AuthService);

  private entries = signal<AuditEntry[]>([]);

  allEntries = computed(() =>
    [...this.entries()].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    ),
  );

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.refreshEntries().subscribe();
    }
  }

  refreshEntries(): Observable<AuditEntry[]> {
    return this.pisteApi.list().pipe(
      map((resp) => extractApiBody(resp).map(mapPisteAudit)),
      tap((list) => this.entries.set(list)),
      catchError(() => {
        this.entries.set([]);
        return of([]);
      }),
    );
  }

  logAction(entry: Partial<AuditEntry> & { action: AuditAction }): void {
    const full: AuditEntry = {
      id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12),
      action: entry.action,
      tableName: entry.tableName ?? '-',
      oldValues: entry.oldValues ?? '',
      newValues: entry.newValues ?? '',
      ressourceId: entry.ressourceId ?? '-',
      responsableNom: entry.responsableNom ?? 'Système',
      responsableEmail: entry.responsableEmail ?? '',
      timestamp: new Date(),
    };
    this.entries.update((list) => [full, ...list]);
  }
}
