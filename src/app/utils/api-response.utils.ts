import { HttpResponse } from '@angular/common/http';

/** Extrait le corps JSON d'une réponse HTTP (tableau ou objet). */
export function extractApiBody<T = any>(resp: HttpResponse<any> | null | undefined): T[] {
  const data = resp?.body;
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (data && Array.isArray((data as any).data)) {
    return (data as any).data as T[];
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return [data as T];
  }
  return [];
}

/** Extrait un objet unique depuis une réponse HTTP. */
export function extractApiItem<T = any>(resp: HttpResponse<any> | null | undefined): T | null {
  const data = resp?.body;
  if (!data) {
    return null;
  }
  if (data && typeof data === 'object' && 'data' in data && (data as any).data) {
    return (data as any).data as T;
  }
  return data as T;
}

/** Identifiant ressource (objet ou scalaire). */
export function refId(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: unknown }).id);
  }
  return String(value);
}

/** Nom affichable d'une personne API. */
export function personLabel(value: unknown): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    const p = value as Record<string, unknown>;
    const parts = [p['prenoms'], p['nom']].filter(Boolean);
    return parts.join(' ').trim();
  }
  return String(value);
}

/** Date ISO → Date ou undefined. */
export function parseApiDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Alias de date de création renvoyés par l'API legacy / refonte. */
const API_CREATED_AT_KEYS = [
  'createdAt',
  'dateCreation',
  'date_creation',
  'created_at',
  'dateAudit',
  'dateDecouverte',
  'date',
] as const;

/** Extrait la date de création depuis un objet API (plusieurs noms de champs). */
export function extractApiCreatedAt(row: Record<string, unknown> | null | undefined): Date | undefined {
  if (!row || typeof row !== 'object') {
    return undefined;
  }
  for (const key of API_CREATED_AT_KEYS) {
    const parsed = parseApiDate(row[key]);
    if (parsed) {
      return parsed;
    }
  }
  return undefined;
}

/** Extrait l'auteur de création (chaîne ou objet ressource). */
export function extractApiCreatedBy(row: Record<string, unknown> | null | undefined): string | undefined {
  if (!row || typeof row !== 'object') {
    return undefined;
  }
  const raw = row['createdBy'] ?? row['createur'] ?? row['auteur'] ?? row['created_by'];
  if (raw == null || raw === '') {
    return undefined;
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const parts = [o['prenoms'], o['nom']].filter(Boolean);
    const name = parts.join(' ').trim();
    return name || String(o['email'] ?? o['libelle'] ?? o['id'] ?? '').trim() || undefined;
  }
  const label = String(raw).trim();
  return label || undefined;
}

/** Map statut API vers PlanTaskStatus. */
export function mapApiStatut(statut: unknown): 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' {
  const s = String(statut ?? '').toUpperCase();
  if (s === 'OK' || s === 'TERMINE' || s === 'TERMINÉ' || s === 'DONE') {
    return 'DONE';
  }
  if (s === 'EN_COURS' || s === 'ENCOURS' || s === 'IN_PROGRESS') {
    return 'IN_PROGRESS';
  }
  if (s === 'ANNULE' || s === 'ANNULÉ' || s === 'CANCELLED') {
    return 'CANCELLED';
  }
  return 'TODO';
}
