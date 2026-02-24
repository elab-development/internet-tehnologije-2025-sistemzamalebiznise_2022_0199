export type Uloga = 'VLASNIK' | 'RADNIK' | 'DOSTAVLJAC';

export interface User {
  userId: number;
  email: string;
  uloga: Uloga;
  iat: number;
  exp: number;
}

export interface Proizvod {
  id_proizvod: number;
  naziv: string;
  sifra: string;
  nabavna_cena: number;
  prodajna_cena: number;
  kolicina_na_lageru: number;
  minimalna_kolicina?: number;
  jedinica_mere: string;
  datum_kreiranja?: string;
  datum_izmene?: string;
}

export interface Dobavljac {
  id_dobavljac: number;
  naziv_firme: string;
  telefon?: string;
  email?: string;
  adresa?: string;
}

export type StatusNarudzbenice =
  | 'KREIRANA'
  | 'POSLATA'
  | 'U_TRANSPORTU'
  | 'PRIMLJENA'
  | 'ZAVRSENA'
  | 'OTKAZANA'
  | 'STORNIRANA';

export type TipNarudzbenice = 'NABAVKA' | 'PRODAJA';

export interface Narudzbenica {
  id_narudzbenica: number;
  datum: string;
  datum_kreiranja?: string;
  datum_izmene?: string;
  datum_zavrsetka?: string;
  tip: TipNarudzbenice;
  status: StatusNarudzbenice;
  ukupna_vrednost: number;
  kreirao_id: number;
  dobavljac_naziv?: string;
  dostavljac_id?: number;
  napomena?: string;
  stornirana: boolean;
  datum_storniranja?: string;
  razlog_storniranja?: string;
  prodajna_cena?: number; // snapshot za PRODAJU
  stornirao_id?: number;
}

export interface StavkaNarudzbenice {
  id_stavka: number;
  proizvod_id: number;
  kolicina: number;
  ukupna_cena: number;
  proizvod_naziv: string;
  proizvod_sifra: string;
  proizvod_cena: number;
}

export interface NarudzbenicaDetalji extends Narudzbenica {
  stavke: StavkaNarudzbenice[];
}

export interface Korisnik {
  id_korisnik: number;
  ime: string;
  prezime: string;
  email: string;
  uloga: Uloga;
}

export const STATUS_LABELS: Record<StatusNarudzbenice, string> = {
  KREIRANA: 'Kreirana',
  POSLATA: 'Poslata',
  U_TRANSPORTU: 'U transportu',
  PRIMLJENA: 'Primljena',
  ZAVRSENA: 'Završena',
  OTKAZANA: 'Otkazana',
  STORNIRANA: 'Stornirana',
};

export const ULOGA_LABELS: Record<Uloga, string> = {
  VLASNIK: 'Vlasnik',
  RADNIK: 'Radnik',
  DOSTAVLJAC: 'Dostavljač',
};

// Dozvoljeni prelazi statusa za NABAVKU (kupovina od dobavljača)
export const NABAVKA_TRANSITIONS: Record<StatusNarudzbenice, StatusNarudzbenice[]> = {
  KREIRANA: ['U_TRANSPORTU', 'OTKAZANA'],
  POSLATA: [],
  U_TRANSPORTU: ['ZAVRSENA'],
  PRIMLJENA: [],
  ZAVRSENA: [],
  OTKAZANA: [],
  STORNIRANA: [],
};

// Dozvoljeni prelazi statusa za PRODAJU (prodaja kupcu)
export const PRODAJA_TRANSITIONS: Record<StatusNarudzbenice, StatusNarudzbenice[]> = {
  KREIRANA: ['STORNIRANA', 'ZAVRSENA'],
  POSLATA: [],
  U_TRANSPORTU: [],
  PRIMLJENA: [],
  ZAVRSENA: [],
  OTKAZANA: [],
  STORNIRANA: [],
};

// Generička mapa (fallback) - unija svih prelaza
export const ALLOWED_STATUS_TRANSITIONS: Record<StatusNarudzbenice, StatusNarudzbenice[]> = {
  KREIRANA: ['POSLATA', 'ZAVRSENA', 'STORNIRANA', 'OTKAZANA'],
  POSLATA: ['U_TRANSPORTU', 'OTKAZANA'],
  U_TRANSPORTU: ['ZAVRSENA'],
  PRIMLJENA: [],
  ZAVRSENA: [],
  OTKAZANA: [],
  STORNIRANA: [],
};

// Helper: dobij tranzicije na osnovu tipa narudžbenice
export function getTransitionsForType(tip: TipNarudzbenice): Record<StatusNarudzbenice, StatusNarudzbenice[]> {
  return tip === 'NABAVKA' ? NABAVKA_TRANSITIONS : PRODAJA_TRANSITIONS;
}

// Alias za kompatibilnost
export const VALID_TRANSITIONS = ALLOWED_STATUS_TRANSITIONS;
