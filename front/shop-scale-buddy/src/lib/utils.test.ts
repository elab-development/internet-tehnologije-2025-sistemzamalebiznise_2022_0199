import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (className utility)', () => {
  it('spaja jednostavne klase', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('uklanja duplikate tailwind klasa (merge)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('ignoriše undefined i null vrednosti', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('ignoriše false vrednosti (conditional klase)', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('vraća prazan string bez argumenata', () => {
    expect(cn()).toBe('');
  });

  it('radi sa tailwind color klasama', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('čuva različite utility klase', () => {
    const result = cn('p-4', 'mt-2', 'bg-white');
    expect(result).toBe('p-4 mt-2 bg-white');
  });
});
