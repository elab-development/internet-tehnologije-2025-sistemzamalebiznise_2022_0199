-- =====================================================
-- 00_uml_schema.sql
-- JEDINA I ISTINITA SHEMA – USKLAĐENA SA UML DIJAGRAMOM
-- =====================================================

-- =========================
-- DROP POSTOJEĆE OBJEKTE
-- =========================

DROP TABLE IF EXISTS stavka_narudzbenice CASCADE;
DROP TABLE IF EXISTS narudzbenica CASCADE;
DROP TABLE IF EXISTS proizvod CASCADE;
DROP TABLE IF EXISTS dobavljac CASCADE;
DROP TABLE IF EXISTS korisnik CASCADE;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'uloga_korisnika') THEN
    DROP TYPE uloga_korisnika;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tip_narudzbenice') THEN
    DROP TYPE tip_narudzbenice;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_narudzbenice') THEN
    DROP TYPE status_narudzbenice;
  END IF;
END $$;

-- =========================
-- ENUM TIPOVI (UML)
-- =========================

CREATE TYPE uloga_korisnika AS ENUM (
  'VLASNIK',
  'RADNIK',
  'DOSTAVLJAC'
);

CREATE TYPE tip_narudzbenice AS ENUM (
  'NABAVKA',
  'PRODAJA'
);

CREATE TYPE status_narudzbenice AS ENUM (
  'KREIRANA',
  'POSLATA',
  'U_TRANSPORTU',
  'ISPORUCENA',
  'ZAVRSENA',
  'OTKAZANA'
);

-- =========================
-- TABELE (UML)
-- =========================

CREATE TABLE korisnik (
  id_korisnik SERIAL PRIMARY KEY,
  ime TEXT NOT NULL,
  prezime TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  lozinka_hash TEXT NOT NULL,
  uloga uloga_korisnika NOT NULL
);

CREATE TABLE dobavljac (
  id_dobavljac SERIAL PRIMARY KEY,
  naziv_firme TEXT NOT NULL,
  telefon TEXT,
  email TEXT,
  adresa TEXT
);

CREATE TABLE proizvod (
  id_proizvod SERIAL PRIMARY KEY,
  naziv TEXT NOT NULL,
  sifra TEXT NOT NULL UNIQUE,
  cena DOUBLE PRECISION NOT NULL CHECK (cena >= 0),
  kolicina_na_lageru INT NOT NULL DEFAULT 0 CHECK (kolicina_na_lageru >= 0),
  jedinica_mere TEXT NOT NULL
);

CREATE TABLE narudzbenica (
  id_narudzbenica SERIAL PRIMARY KEY,
  datum_kreiranja TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tip tip_narudzbenice NOT NULL,
  status status_narudzbenice NOT NULL DEFAULT 'KREIRANA',
  napomena TEXT,
  ukupna_vrednost DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (ukupna_vrednost >= 0),
  pdf_putanja TEXT,

  -- kreirao: Korisnik
  kreirao_id INT NOT NULL
    REFERENCES korisnik(id_korisnik)
    ON DELETE RESTRICT,

  -- dobavljač: samo za NABAVKA
  dobavljac_id INT NULL
    REFERENCES dobavljac(id_dobavljac)
    ON DELETE SET NULL,

  -- (potrebno zbog use-case: dodeljene narudžbenice dostavljaču)
  dostavljac_id INT NULL
    REFERENCES korisnik(id_korisnik)
    ON DELETE SET NULL,

  CONSTRAINT chk_tip_dobavljac
    CHECK (
      ("tip" = 'PRODAJA' AND dobavljac_id IS NULL)
      OR                                                      
      ("tip" = 'NABAVKA' AND dobavljac_id IS NOT NULL)
    )
);

CREATE TABLE stavka_narudzbenice (
  id_stavka SERIAL PRIMARY KEY,
  kolicina INT NOT NULL CHECK (kolicina > 0),
  ukupna_cena DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (ukupna_cena >= 0),

  proizvod_id INT NOT NULL
    REFERENCES proizvod(id_proizvod)
    ON DELETE RESTRICT,

  narudzbenica_id INT NOT NULL
    REFERENCES narudzbenica(id_narudzbenica)
    ON DELETE CASCADE
);

-- =========================
-- INDEKSI (performanse)
-- =========================

CREATE INDEX idx_narudzbenica_kreirao
  ON narudzbenica(kreirao_id);

CREATE INDEX idx_narudzbenica_dobavljac
  ON narudzbenica(dobavljac_id);

CREATE INDEX idx_narudzbenica_dostavljac
  ON narudzbenica(dostavljac_id);

CREATE INDEX idx_stavka_narudzbenica
  ON stavka_narudzbenice(narudzbenica_id);

CREATE INDEX idx_stavka_proizvod
  ON stavka_narudzbenice(proizvod_id);