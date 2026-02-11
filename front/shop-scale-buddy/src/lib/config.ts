const STORAGE_KEY = 'API_BASE_URL';

export function getApiBaseUrl(): string {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved;
  // Ako se pristupa sa druge masine na mrezi, koristi IP umesto localhost
  const host = window.location.hostname;
  return `http://${host}:3000`;
}

export function setApiBaseUrl(url: string): void {
  const cleaned = url.replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY, cleaned);
}

export function isApiConfigured(): boolean {
  return true;
}
