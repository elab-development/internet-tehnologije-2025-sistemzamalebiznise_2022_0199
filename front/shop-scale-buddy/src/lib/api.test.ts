import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config module pre importa api modula
vi.mock('@/lib/config', () => ({
  getApiBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));

describe('api klijent', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset fetch mock pre svakog testa
    globalThis.fetch = vi.fn();
  });

  const mockFetch = (status: number, body: any) => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    });
  };

  it('api.get šalje GET zahtev na ispravan URL', async () => {
    mockFetch(200, { data: 'test' });

    // Dinamički importuj api nakon mock-ovanja
    const { api } = await import('@/lib/api');
    const result = await api.get('/api/proizvodi');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/proizvodi',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual({ data: 'test' });
  });

  it('api.post šalje POST zahtev sa telom', async () => {
    mockFetch(201, { message: 'Kreirano' });

    const { api } = await import('@/lib/api');
    const body = { naziv: 'Test proizvod', cena: 100 };
    const result = await api.post('/api/proizvodi', body);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/proizvodi',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
        credentials: 'include',
      })
    );
    expect(result).toEqual({ message: 'Kreirano' });
  });

  it('baca grešku za HTTP status >= 400', async () => {
    mockFetch(401, { error: 'Niste prijavljeni' });

    const { api } = await import('@/lib/api');

    await expect(api.get('/api/dashboard')).rejects.toThrow('Niste prijavljeni');
  });

  it('api.delete šalje DELETE zahtev', async () => {
    mockFetch(200, { message: 'Obrisano' });

    const { api } = await import('@/lib/api');
    await api.delete('/api/proizvodi/1');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/proizvodi/1',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      })
    );
  });

  it('api.patch šalje PATCH zahtev sa telom', async () => {
    mockFetch(200, { message: 'Ažurirano' });

    const { api } = await import('@/lib/api');
    const body = { status: 'ZAVRSENA' };
    await api.patch('/api/narudzbenice/1', body);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/narudzbenice/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(body),
        credentials: 'include',
      })
    );
  });
});
