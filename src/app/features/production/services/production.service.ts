import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { ProductionItem, ProductionType } from '../../../models/production';
import { AuthService } from '../../auth/services/auth.service';
import { ProjetsService } from '../../settings/services/projets.service';
import { AuditsService } from '../../audit-trail/services/audits.service';
import { VeillesService } from '../../settings/services/veilles.service';
import { SettingsService } from '../../settings/services/settings.service';
import { extractApiBody, extractApiItem, refId, extractApiCreatedAt } from '../../../utils/api-response.utils';

const TYPE_LABEL: Record<ProductionType, string> = {
  PROJECT: 'Projet',
  AUDIT: 'Audit IT',
  ENGINEERING: 'Veille / Ingénierie',
  MONITORING: 'Monitoring',
};

function mapProjet(p: any): ProductionItem {
  const resources = (p.ressources ?? p.equipes ?? [])
    .filter((r: unknown) => r != null)
    .map((r: unknown) => refId(r));
  return {
    id: String(p.id),
    type: 'PROJECT',
    code: p.code != null ? String(p.code) : undefined,
    libelle: String(p.libelle ?? ''),
    description: String(p.description ?? ''),
    tpm: p.tpm ? refId(p.tpm) : undefined,
    resources,
    createdAt: extractApiCreatedAt(p),
  };
}

/**
 * Audit IT et veille n'ont qu'une seule ressource (champ `ressource` au singulier).
 * On lit ce champ en priorité, avec repli sur `responsable` (legacy) puis `ressources[]`.
 */
function mapSingleResource(row: any): string[] {
  const single = row.ressource ?? row.responsable;
  if (single != null && single !== '') {
    return [refId(single)];
  }
  if (Array.isArray(row.ressources)) {
    return row.ressources.filter((r: unknown) => r != null).map((r: unknown) => refId(r));
  }
  return [];
}

function mapAudit(a: any): ProductionItem {
  return {
    id: String(a.id),
    type: 'AUDIT',
    code: a.code != null ? String(a.code) : undefined,
    libelle: String(a.libelle ?? a.code ?? ''),
    description: String(a.description ?? ''),
    resources: mapSingleResource(a),
    createdAt: extractApiCreatedAt(a),
  };
}

function mapVeille(v: any): ProductionItem {
  return {
    id: String(v.id),
    type: 'ENGINEERING',
    code: v.code != null ? String(v.code) : undefined,
    libelle: String(v.libelle ?? v.code ?? ''),
    description: String(v.description ?? v.sujet ?? ''),
    resources: mapSingleResource(v),
    createdAt: extractApiCreatedAt(v),
  };
}

@Injectable({
  providedIn: 'root',
})
export class ProductionService {
  private auth = inject(AuthService);
  private projetsApi = inject(ProjetsService);
  private auditsApi = inject(AuditsService);
  private veillesApi = inject(VeillesService);
  private settings = inject(SettingsService);

  private items = signal<ProductionItem[]>([]);
  private loaded = false;

  allProductionItems = computed(() => this.items());

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.refreshItems().subscribe();
    }
  }

  refreshItems(force = false): Observable<ProductionItem[]> {
    if (this.loaded && !force) {
      return of(this.items());
    }
    return forkJoin([
      this.projetsApi.list({} as any),
      this.auditsApi.list({} as any),
      this.veillesApi.list({} as any),
    ]).pipe(
      map(([projResp, auditResp, veilleResp]) => {
        const projets = extractApiBody(projResp).map(mapProjet);
        const audits = extractApiBody(auditResp).map(mapAudit);
        const veilles = extractApiBody(veilleResp).map(mapVeille);
        return [...projets, ...audits, ...veilles];
      }),
      tap((all) => {
        this.items.set(all);
        this.loaded = true;
      }),
      catchError(() => {
        this.items.set([]);
        return of([]);
      }),
    );
  }

  getItemsByType(type: ProductionType) {
    return computed(() => this.items().filter((item) => item.type === type));
  }

  /**
   * Recherche un élément par type ET id.
   * Indispensable : projets / audits / veilles ont des ids numériques indépendants
   * (un projet et un audit peuvent partager le même id), une recherche par id seul
   * renverrait potentiellement le mauvais élément.
   */
  findItem(type: ProductionType, id: string): ProductionItem | undefined {
    return this.items().find((item) => item.type === type && item.id === id);
  }

  addItem(item: Omit<ProductionItem, 'id'>): Observable<ProductionItem> {
    const api$ = this.apiForType(item.type);
    const payload = this.payloadForType(item);
    return api$.create(payload as any).pipe(
      switchMap((resp) => {
        const body = extractApiItem(resp);
        if (!body) {
          return throwError(() => new Error('Création production : réponse vide.'));
        }
        const created = this.mapApiItem(item.type, body);
        this.items.update((list) => [...list, created]);
        return of(created);
      }),
    );
  }

  updateItem(updatedItem: ProductionItem): Observable<ProductionItem> {
    const id = Number(updatedItem.id);
    const api$ = this.apiForType(updatedItem.type);
    const payload = this.payloadForType(updatedItem);
    return api$.update(id, payload as any).pipe(
      switchMap((resp) => {
        const body = extractApiItem(resp) ?? updatedItem;
        const mapped = this.mapApiItem(updatedItem.type, body);
        this.items.update((list) =>
          list.map((i) => (i.type === mapped.type && i.id === mapped.id ? mapped : i)),
        );
        return of(mapped);
      }),
    );
  }

  deleteItem(id: string, type: ProductionType): Observable<void> {
    const existing = this.findItem(type, id);
    if (!existing) {
      return of(undefined);
    }
    const api$ = this.apiForType(type);
    return api$.delete(Number(id)).pipe(
      tap(() => {
        this.items.update((list) => list.filter((i) => !(i.type === type && i.id === id)));
      }),
      map(() => undefined),
    );
  }

  private apiForType(type: ProductionType) {
    switch (type) {
      case 'AUDIT':
        return this.auditsApi;
      case 'ENGINEERING':
        return this.veillesApi;
      default:
        return this.projetsApi;
    }
  }

  private payloadForType(item: Omit<ProductionItem, 'id'> | ProductionItem): Record<string, unknown> {
    switch (item.type) {
      case 'AUDIT':
        return {
          code: item.code ?? item.libelle,
          libelle: item.libelle,
          description: item.description ?? '',
          ressource: this.resolveEmail(item.resources?.[0]),
        };
      case 'ENGINEERING':
        return {
          code: item.code ?? item.libelle,
          libelle: item.libelle,
          description: item.description ?? '',
          ressource: this.resolveEmail(item.resources?.[0]),
        };
      default:
        return {
          code: item.code ?? item.libelle?.slice(0, 20) ?? '',
          libelle: item.libelle,
          description: item.description ?? '',
          tpm: this.resolveEmail(item.tpm),
          ressources: (item.resources ?? [])
            .map((r) => this.resolveEmail(r))
            .filter((email) => email !== ''),
        };
    }
  }

  /**
   * Convertit un identifiant utilisateur (id interne) en email attendu par l'API.
   * Repli sur la valeur d'origine si aucun utilisateur ne correspond (ex. email déjà fourni).
   */
  private resolveEmail(value?: string): string {
    if (!value) {
      return '';
    }
    const match = this.settings
      .allUsers()
      .find((u) => u.id === value || u.email === value || u.name === value);
    return match?.email || value;
  }

  private mapApiItem(type: ProductionType, body: any): ProductionItem {
    switch (type) {
      case 'AUDIT':
        return mapAudit(body);
      case 'ENGINEERING':
        return mapVeille(body);
      default:
        return mapProjet(body);
    }
  }

  exportCsv(type: ProductionType): Observable<Blob> {
    const api = this.apiForType(type);
    if ('exportCsv' in api && typeof (api as any).exportCsv === 'function') {
      return (api as any).exportCsv().pipe(map((r: any) => r.body as Blob));
    }
    return throwError(() => new Error('Export non disponible pour ce type.'));
  }

  /**
   * Importe des éléments de production depuis un fichier CSV (selon le type).
   * Rafraîchit la liste en mémoire après un import réussi.
   */
  importCsv(type: ProductionType, file: File): Observable<HttpResponse<any>> {
    const api = this.apiForType(type);
    if ('importCsv' in api && typeof (api as any).importCsv === 'function') {
      return (api as any).importCsv(file).pipe(
        switchMap((resp: HttpResponse<any>) =>
          this.refreshItems().pipe(map(() => resp)),
        ),
      );
    }
    return throwError(() => new Error('Import non disponible pour ce type.'));
  }

  /**
   * Télécharge le modèle CSV d'import pour le type de production donné.
   */
  downloadTemplate(type: ProductionType): Observable<Blob> {
    const api = this.apiForType(type);
    if ('downloadTemplate' in api && typeof (api as any).downloadTemplate === 'function') {
      return (api as any).downloadTemplate().pipe(map((r: any) => r.body as Blob));
    }
    return throwError(() => new Error('Modèle non disponible pour ce type.'));
  }
}
