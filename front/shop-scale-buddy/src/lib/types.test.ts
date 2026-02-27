import { describe, it, expect } from 'vitest';
import {
  STATUS_LABELS,
  ULOGA_LABELS,
  NABAVKA_TRANSITIONS,
  PRODAJA_TRANSITIONS,
  ALLOWED_STATUS_TRANSITIONS,
  getTransitionsForType,
  VALID_TRANSITIONS,
} from '@/lib/types';
import type {
  StatusNarudzbenice,
  TipNarudzbenice,
} from '@/lib/types';

// 
// 1. STATUS_LABELS testovi
// 
describe('STATUS_LABELS', () => {
  it('sadrži labele za sve statuse', () => {
    const statusi: StatusNarudzbenice[] = [
      'KREIRANA', 'POSLATA', 'U_TRANSPORTU', 'PRIMLJENA',
      'ZAVRSENA', 'OTKAZANA', 'STORNIRANA',
    ];
    for (const s of statusi) {
      expect(STATUS_LABELS[s]).toBeDefined();
      expect(typeof STATUS_LABELS[s]).toBe('string');
      expect(STATUS_LABELS[s].length).toBeGreaterThan(0);
    }
  });

  it('KREIRANA ima labelu "Kreirana"', () => {
    expect(STATUS_LABELS.KREIRANA).toBe('Kreirana');
  });

  it('ZAVRSENA ima labelu "Završena"', () => {
    expect(STATUS_LABELS.ZAVRSENA).toBe('Završena');
  });
});

// 
// 2. ULOGA_LABELS testovi
// 
describe('ULOGA_LABELS', () => {
  it('sadrži sve tri uloge', () => {
    expect(ULOGA_LABELS.VLASNIK).toBe('Vlasnik');
    expect(ULOGA_LABELS.RADNIK).toBe('Radnik');
    expect(ULOGA_LABELS.DOSTAVLJAC).toBe('Dostavljač');
  });
});

// 
// 3. NABAVKA tranzicije testovi
// 
describe('NABAVKA_TRANSITIONS', () => {
  it('KREIRANA može preći u U_TRANSPORTU ili OTKAZANA', () => {
    expect(NABAVKA_TRANSITIONS.KREIRANA).toContain('U_TRANSPORTU');
    expect(NABAVKA_TRANSITIONS.KREIRANA).toContain('OTKAZANA');
  });

  it('KREIRANA NE može preći direktno u ZAVRSENA', () => {
    expect(NABAVKA_TRANSITIONS.KREIRANA).not.toContain('ZAVRSENA');
  });

  it('U_TRANSPORTU može preći samo u ZAVRSENA', () => {
    expect(NABAVKA_TRANSITIONS.U_TRANSPORTU).toEqual(['ZAVRSENA']);
  });

  it('ZAVRSENA je završni status (nema prelaza)', () => {
    expect(NABAVKA_TRANSITIONS.ZAVRSENA).toEqual([]);
  });

  it('OTKAZANA je završni status (nema prelaza)', () => {
    expect(NABAVKA_TRANSITIONS.OTKAZANA).toEqual([]);
  });

  it('STORNIRANA je završni status (nema prelaza)', () => {
    expect(NABAVKA_TRANSITIONS.STORNIRANA).toEqual([]);
  });
});

// 
// 4. PRODAJA tranzicije testovi
// 
describe('PRODAJA_TRANSITIONS', () => {
  it('KREIRANA može preći u STORNIRANA ili ZAVRSENA', () => {
    expect(PRODAJA_TRANSITIONS.KREIRANA).toContain('STORNIRANA');
    expect(PRODAJA_TRANSITIONS.KREIRANA).toContain('ZAVRSENA');
  });

  it('KREIRANA NE može preći u U_TRANSPORTU', () => {
    expect(PRODAJA_TRANSITIONS.KREIRANA).not.toContain('U_TRANSPORTU');
  });

  it('ZAVRSENA je završni status', () => {
    expect(PRODAJA_TRANSITIONS.ZAVRSENA).toEqual([]);
  });

  it('STORNIRANA je završni status', () => {
    expect(PRODAJA_TRANSITIONS.STORNIRANA).toEqual([]);
  });
});

// 
// 5. getTransitionsForType helper testovi
// 
describe('getTransitionsForType', () => {
  it('vraća NABAVKA tranzicije za tip NABAVKA', () => {
    const result = getTransitionsForType('NABAVKA');
    expect(result).toBe(NABAVKA_TRANSITIONS);
  });

  it('vraća PRODAJA tranzicije za tip PRODAJA', () => {
    const result = getTransitionsForType('PRODAJA');
    expect(result).toBe(PRODAJA_TRANSITIONS);
  });

  it('NABAVKA i PRODAJA imaju različite prelaze iz KREIRANA', () => {
    const nabavka = getTransitionsForType('NABAVKA');
    const prodaja = getTransitionsForType('PRODAJA');
    expect(nabavka.KREIRANA).not.toEqual(prodaja.KREIRANA);
  });
});

// 
// 6. VALID_TRANSITIONS alias test
// 
describe('VALID_TRANSITIONS', () => {
  it('je alias za ALLOWED_STATUS_TRANSITIONS', () => {
    expect(VALID_TRANSITIONS).toBe(ALLOWED_STATUS_TRANSITIONS);
  });
});
