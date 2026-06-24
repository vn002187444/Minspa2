const isClient = typeof window !== 'undefined';

function safeStorage(method: 'getItem' | 'setItem' | 'removeItem', key: string, value?: string): string | null | undefined {
  if (!isClient) return null;
  try {
    if (method === 'getItem') return localStorage.getItem(key);
    if (method === 'setItem') { localStorage.setItem(key, value!); return undefined; }
    if (method === 'removeItem') { localStorage.removeItem(key); return undefined; }
  } catch {
    return null;
  }
}

export const storage = {
  get: (key: string): string | null => safeStorage('getItem', key) as string | null,
  set: (key: string, value: string): void => { safeStorage('setItem', key, value); },
  remove: (key: string): void => { safeStorage('removeItem', key); },
  getJson: <T>(key: string): T | null => {
    const raw = storage.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
  setJson: (key: string, value: unknown): void => {
    storage.set(key, JSON.stringify(value));
  },
};
