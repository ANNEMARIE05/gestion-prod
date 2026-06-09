const KEEP_KEYS = new Set(['userInfos', 'token', 'currentMenu']);

try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !KEEP_KEYS.has(key)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
} catch {
  // ignore
}
