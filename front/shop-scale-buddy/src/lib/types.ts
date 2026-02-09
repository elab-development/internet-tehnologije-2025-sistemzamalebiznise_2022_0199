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
  cena: number;
  kolicina_na_lageru: number;
  jedinica_mere: string;
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
  | 'ISPORUCENA'
  | 'ZAVRSENA'
  | 'OTKAZANA';

export type TipNarudzbenice = 'NABAVKA' | 'PRODAJA';

export interface Narudzbenica {
  id_narudzbenica: number;
  datum: string;
  tip: TipNarudzbenice;
  status: StatusNarudzbenice;
  ukupna_vrednost: number;
  dobavljac_naziv?: string;
  dostavljac_id?: number;
  napomena?: string;
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
  ISPORUCENA: 'Isporučena',
  ZAVRSENA: 'Završena',
  OTKAZANA: 'Otkazana',
};

export const ULOGA_LABELS: Record<Uloga, string> = {
  VLASNIK: 'Vlasnik',
  RADNIK: 'Radnik',
  DOSTAVLJAC: 'Dostavljač',
};

export const VALID_TRANSITIONS: Record<StatusNarudzbenice, StatusNarudzbenice[]> = {
  KREIRANA: ['POSLATA', 'OTKAZANA'],
  POSLATA: ['U_TRANSPORTU', 'OTKAZANA'],
  U_TRANSPORTU: ['ISPORUCENA'],
  ISPORUCENA: ['ZAVRSENA'],
  ZAVRSENA: [],
  OTKAZANA: [],
};
