export function getEnv(key: string): string {
  return (window as any).__env ? ((window as any).__env[key] || '') : '';
}
