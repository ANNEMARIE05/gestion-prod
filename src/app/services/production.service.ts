import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ProductionItem, ProductionType } from '../models/production';
import { AuthService } from './auth.service';
import { AuditTrailService } from './audit-trail.service';
import { LS_PRODUCTION, readJson, writeJson } from '../utils/local-storage-json';

const TYPE_LABEL: Record<ProductionType, string> = {
  PROJECT: 'Projet',
  AUDIT: 'Audit IT',
  ENGINEERING: 'Veille / Ingénierie',
  MONITORING: 'Monitoring',
};

const PRODUCTION_TYPES: ProductionType[] = ['PROJECT', 'AUDIT', 'ENGINEERING', 'MONITORING'];

function mapProductionItem(item: Record<string, unknown>): ProductionItem {
  const rawType = item['type'];
  const type: ProductionType = PRODUCTION_TYPES.includes(rawType as ProductionType)
    ? (rawType as ProductionType)
    : 'PROJECT';
  const resources = Array.isArray(item['resources'])
    ? (item['resources'] as unknown[]).map((x) => String(x))
    : [];
  return {
    id: String(item['id'] ?? newId()),
    type,
    libelle: String(item['libelle'] ?? ''),
    description: String(item['description'] ?? ''),
    tpm: item['tpm'] ? String(item['tpm']) : undefined,
    resources,
    createdAt: item['createdAt'] ? new Date(String(item['createdAt'])) : undefined,
  };
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12);
}

@Injectable({
  providedIn: 'root',
})
export class ProductionService {
  private auth = inject(AuthService);
  private auditTrail = inject(AuditTrailService);

  private items = signal<ProductionItem[]>([]);
  allProductionItems = computed(() => this.items());

  constructor() {
    this.reloadFromStorage();
    queueMicrotask(() => {
      if (this.items().length) {
        this.persist();
      }
    });
  }

  private reloadFromStorage(): void {
    const raw = readJson<Record<string, unknown>[]>(LS_PRODUCTION);
    if (raw?.length) {
      this.items.set(raw.map((row) => mapProductionItem(row)));
    }
  }

  private persist(): void {
    writeJson(LS_PRODUCTION, this.items());
  }

  refreshItems(): void {
    this.reloadFromStorage();
  }

  getItemsByType(type: ProductionType) {
    return computed(() => this.items().filter((item) => item.type === type));
  }

  addItem(item: Omit<ProductionItem, 'id'>): Observable<ProductionItem> {
    const created = mapProductionItem({
      ...(item as unknown as Record<string, unknown>),
      id: newId(),
    });
    this.items.update((list) => [...list, created]);
    this.persist();
    this.log('CREATE', `Fiche ${TYPE_LABEL[item.type]} créée : ${item.libelle}`);
    return of(created);
  }

  updateItem(updatedItem: ProductionItem): Observable<ProductionItem> {
    const mapped = mapProductionItem({ ...(updatedItem as unknown as Record<string, unknown>) });
    this.items.update((list) => list.map((i) => (i.id === mapped.id ? mapped : i)));
    this.persist();
    this.log('UPDATE', `Fiche ${TYPE_LABEL[mapped.type]} modifiée : ${mapped.libelle}`);
    return of(mapped);
  }

  deleteItem(id: string): Observable<void> {
    const removed = this.items().find((item) => item.id === id);
    this.items.update((list) => list.filter((item) => item.id !== id));
    this.persist();
    if (removed) {
      this.log('DELETE', `Fiche ${TYPE_LABEL[removed.type]} supprimée : ${removed.libelle}`);
    }
    return of(undefined);
  }

  private log(action: 'CREATE' | 'UPDATE' | 'DELETE', details: string): void {
    const u = this.auth.currentUser();
    this.auditTrail.logAction({
      userId: u?.id ?? '-',
      userName: u?.name ?? 'Invité',
      action,
      module: 'PRODUCTION',
      details,
    });
  }
}
