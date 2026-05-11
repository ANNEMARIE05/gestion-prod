/** Filtre tableau Material : texte + critères optionnels sérialisés en JSON. */
export interface TableFilterPayload {
  q: string;
  status?: string;
  priority?: string;
  specialty?: string;
  entity?: string;
  extra?: string;
  active?: string;
  profileId?: string;
  scope?: string;
  /** Parent production item id (planification : projet / audit / veille). */
  projectId?: string;
  /** Entité racine (filtre ressources). */
  entityRoot?: string;
  /** Sous-entité (filtre ressources, optionnel). */
  entitySub?: string;
}

const FILTER_KEYS: (keyof Omit<TableFilterPayload, 'q'>)[] = [
  'status',
  'priority',
  'specialty',
  'entity',
  'extra',
  'active',
  'profileId',
  'scope',
  'projectId',
  'entityRoot',
  'entitySub',
];

export function encodeTableFilter(payload: TableFilterPayload): string {
  return JSON.stringify(payload);
}

/** Décode un filtre JSON ou une ancienne chaîne « recherche seule ». */
export function decodeTableFilter(raw: string): TableFilterPayload {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed.startsWith('{')) {
    return { q: trimmed };
  }
  try {
    const o = JSON.parse(trimmed) as Record<string, unknown>;
    const q = typeof o['q'] === 'string' ? o['q'] : '';
    const out: TableFilterPayload = { q };
    for (const k of FILTER_KEYS) {
      const v = o[k];
      if (typeof v === 'string') {
        out[k] = v;
      }
    }
    return out;
  } catch {
    return { q: trimmed };
  }
}
