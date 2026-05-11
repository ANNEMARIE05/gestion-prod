import { Injectable, signal, computed } from '@angular/core';
import { LS_AUDIT_TRAIL, readJson, writeJson } from '../utils/local-storage-json';

export type AuditModule =
  | 'AUTH'
  | 'PROFILE'
  | 'PRODUCTION'
  | 'PLANIFICATION'
  | 'SETTINGS';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE';

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  module: AuditModule;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

function parseEntry(row: Record<string, unknown>): AuditEntry {
  return {
    ...(row as unknown as AuditEntry),
    timestamp: row['timestamp'] ? new Date(row['timestamp'] as string) : new Date(),
  };
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12);
}

@Injectable({
  providedIn: 'root',
})
export class AuditTrailService {
  private entries = signal<AuditEntry[]>([]);

  allEntries = computed(() =>
    [...this.entries()].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  );

  constructor() {
    this.reloadFromStorage();
  }

  private reloadFromStorage(): void {
    const raw = readJson<Record<string, unknown>[]>(LS_AUDIT_TRAIL);
    if (raw?.length) {
      this.entries.set(raw.map((row) => parseEntry(row)));
    }
  }

  refreshEntries(): void {
    this.reloadFromStorage();
  }

  logAction(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    const full: AuditEntry = {
      ...entry,
      id: newId(),
      timestamp: new Date(),
    };
    this.entries.update((list) => [full, ...list]);
    writeJson(LS_AUDIT_TRAIL, this.entries());
  }
}
