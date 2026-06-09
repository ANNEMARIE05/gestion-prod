export function useLocalStorage<T>(key: string) {
  const get = (): T | null => {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  };

  const set = (value: T | null) => {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  };

  const remove = () => localStorage.removeItem(key);

  const update = (cb: (current: T | null) => T | null) => {
    const current = get();
    const next = cb(current);
    set(next);
  };

  return { get, set, remove, update } as const;
}
