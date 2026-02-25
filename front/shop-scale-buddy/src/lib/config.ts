
const STORAGE_KEY = 'API_BASE_URL';

export function getApiBaseUrl(): string {
  // 1. Prefer environment variable (prod)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  // 2. Try localStorage (test/dev)
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return saved.replace(/\/+$/, '');
  }
  // 3. Fallback to hostname (test/dev)
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    return `http://${host}:3000`;
  }
  throw new Error('API base URL is not configured!');
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    const cleaned = url.replace(/\/+$/, '');
    window.localStorage.setItem(STORAGE_KEY, cleaned);
  }
}

export function isApiConfigured(): boolean {
  return true;
}
