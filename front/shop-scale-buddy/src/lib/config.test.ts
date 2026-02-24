import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApiBaseUrl, setApiBaseUrl, isApiConfigured } from '@/lib/config';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('config', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('getApiBaseUrl', () => {
    it('vraća sačuvan URL iz localStorage ako postoji', () => {
      localStorageMock.setItem('API_BASE_URL', 'http://moj-server:3000');
      expect(getApiBaseUrl()).toBe('http://moj-server:3000');
    });

    it('vraća fallback URL baziran na hostname ako nema sačuvanog', () => {
      const result = getApiBaseUrl();
      expect(result).toContain(':3000');
      expect(result).toContain('http://');
    });
  });

  describe('setApiBaseUrl', () => {
    it('čuva URL u localStorage', () => {
      setApiBaseUrl('http://example.com:3000');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'API_BASE_URL',
        'http://example.com:3000'
      );
    });

    it('uklanja trailing slash', () => {
      setApiBaseUrl('http://example.com:3000///');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'API_BASE_URL',
        'http://example.com:3000'
      );
    });
  });

  describe('isApiConfigured', () => {
    it('uvek vraća true', () => {
      expect(isApiConfigured()).toBe(true);
    });
  });
});
