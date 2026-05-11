/** Clés de persistance locale (pas d’API). */
export const LS_PRODUCTION = 'gestion_prod_items_v1';
export const LS_PLANIFICATION = 'gestion_prod_plan_v1';
export const LS_AUDIT_TRAIL = 'gestion_prod_audit_v1';

export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === '') {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}
