
export function getApiBaseUrl(): string {
  // Prefer environment variable set by Vercel or .env file
  const envUrl = import.meta.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  throw new Error('API base URL is not configured!');
}

export function setApiBaseUrl(_url: string): void {
  // No-op: API URL should be set via environment variable
}

export function isApiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL);
}
