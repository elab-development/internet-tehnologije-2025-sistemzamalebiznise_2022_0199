-- Dodavanje novih polja u tabelu proizvod
ALTER TABLE proizvod
  ADD COLUMN nabavna_cena NUMERIC NOT NULL DEFAULT 0 CHECK (nabavna_cena >= 0),
  ADD COLUMN prodajna_cena NUMERIC NOT NULL DEFAULT 0 CHECK (prodajna_cena >= 0),
  ADD COLUMN minimalna_kolicina INTEGER,
  ADD COLUMN datum_kreiranja TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN datum_izmene TIMESTAMP;

-- Migracija postojećeg polja cena u prodajnu_cenu
UPDATE proizvod SET prodajna_cena = cena WHERE prodajna_cena = 0;
UPDATE proizvod SET nabavna_cena = cena WHERE nabavna_cena = 0;

-- Uklanjanje NOT NULL constraint sa stare kolone cena (deprecated)
ALTER TABLE proizvod ALTER COLUMN cena DROP NOT NULL;
ALTER TABLE proizvod ALTER COLUMN cena SET DEFAULT 0;

-- Dodavanje statusa PRIMLJENA i STORNIRANA
ALTER TYPE status_narudzbenice ADD VALUE IF NOT EXISTS 'PRIMLJENA';
ALTER TYPE status_narudzbenice ADD VALUE IF NOT EXISTS 'STORNIRANA';

-- Dodavanje novih polja u tabelu narudzbenica
ALTER TABLE narudzbenica
  ADD COLUMN datum_izmene TIMESTAMP,
  ADD COLUMN datum_zavrsetka TIMESTAMP,
  ADD COLUMN stornirana BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN datum_storniranja TIMESTAMP,
  ADD COLUMN razlog_storniranja TEXT,
  ADD COLUMN stornirao_id INTEGER REFERENCES korisnik(id_korisnik) ON DELETE SET NULL;

-- Dodavanje polja u stavka_narudzbenice
ALTER TABLE stavka_narudzbenice
  ADD COLUMN prodajna_cena NUMERIC,
  ADD COLUMN datum_kreiranja TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Kreiranje indeksa za optimizaciju upita
CREATE INDEX IF NOT EXISTS idx_korisnik_uloga ON korisnik(uloga);
CREATE INDEX IF NOT EXISTS idx_proizvod_kolicina ON proizvod(kolicina_na_lageru);
CREATE INDEX IF NOT EXISTS idx_narudzbenica_tip ON narudzbenica(tip);
CREATE INDEX IF NOT EXISTS idx_narudzbenica_status ON narudzbenica(status);
CREATE INDEX IF NOT EXISTS idx_narudzbenica_stornirana ON narudzbenica(stornirana);

-- Funkcija za ažuriranje datum_izmene automatski
CREATE OR REPLACE FUNCTION azuriraj_datum_izmene()
RETURNS TRIGGER AS $$
BEGIN
  NEW.datum_izmene = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger za proizvod
DROP TRIGGER IF EXISTS trg_proizvod_datum_izmene ON proizvod;
CREATE TRIGGER trg_proizvod_datum_izmene
  BEFORE UPDATE ON proizvod
  FOR EACH ROW
  EXECUTE FUNCTION azuriraj_datum_izmene();

-- Trigger za narudzbenicu
DROP TRIGGER IF EXISTS trg_narudzbenica_datum_izmene ON narudzbenica;
CREATE TRIGGER trg_narudzbenica_datum_izmene
  BEFORE UPDATE ON narudzbenica
  FOR EACH ROW
  EXECUTE FUNCTION azuriraj_datum_izmene();

-- Funkcija za validaciju i izmenu statusa narudzbenice sa lager logikom
CREATE OR REPLACE FUNCTION izmeni_status_narudzbenice_sa_lagerom(
  p_id_narudzbenica INT,
  p_novi_status status_narudzbenice,
  p_razlog_storniranja TEXT DEFAULT NULL,
  p_stornirao_id INT DEFAULT NULL
)
RETURNS TABLE (
  id_narudzbenica INT,
  status status_narudzbenice,
  datum_zavrsetka TIMESTAMP,
  stornirana BOOLEAN
) AS $$
DECLARE
  v_stari_status status_narudzbenice;
  v_tip tip_narudzbenice;
  v_stavka RECORD;
  v_kolicina_na_stanju INT;
BEGIN
  -- Dohvati trenutni status i tip
  SELECT n.status, n.tip INTO v_stari_status, v_tip
  FROM narudzbenica n
  WHERE n.id_narudzbenica = p_id_narudzbenica;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Narudžbenica sa ID % ne postoji', p_id_narudzbenica;
  END IF;

  -- VALIDACIJA: Storniranje samo ako je status KREIRANA
  IF p_novi_status = 'STORNIRANA' AND v_stari_status != 'KREIRANA' THEN
    RAISE EXCEPTION 'Storniranje je dozvoljeno samo za narudžbenice sa statusom KREIRANA';
  END IF;

  -- NABAVKA: Status PRIMLJENA ili ZAVRSENA -> povećaj lager
  IF v_tip = 'NABAVKA' AND (p_novi_status = 'PRIMLJENA' OR p_novi_status = 'ZAVRSENA') THEN
    FOR v_stavka IN 
      SELECT sn.proizvod_id, sn.kolicina
      FROM stavka_narudzbenice sn
      WHERE sn.narudzbenica_id = p_id_narudzbenica
    LOOP
      UPDATE proizvod
      SET kolicina_na_lageru = kolicina_na_lageru + v_stavka.kolicina
      WHERE id_proizvod = v_stavka.proizvod_id;
    END LOOP;

    -- Postavi datum_zavrsetka
    UPDATE narudzbenica
    SET status = p_novi_status,
        datum_zavrsetka = CURRENT_TIMESTAMP
    WHERE narudzbenica.id_narudzbenica = p_id_narudzbenica
    RETURNING 
      narudzbenica.id_narudzbenica,
      narudzbenica.status,
      narudzbenica.datum_zavrsetka,
      narudzbenica.stornirana
    INTO id_narudzbenica, status, datum_zavrsetka, stornirana;

    RETURN NEXT;
    RETURN;
  END IF;

  -- PRODAJA: Status ZAVRSENA -> smanji lager
  IF v_tip = 'PRODAJA' AND p_novi_status = 'ZAVRSENA' THEN
    -- Proveri da li ima dovoljno zaliha
    FOR v_stavka IN 
      SELECT sn.proizvod_id, sn.kolicina, p.kolicina_na_lageru, p.naziv
      FROM stavka_narudzbenice sn
      JOIN proizvod p ON p.id_proizvod = sn.proizvod_id
      WHERE sn.narudzbenica_id = p_id_narudzbenica
    LOOP
      IF v_stavka.kolicina_na_lageru < v_stavka.kolicina THEN
        RAISE EXCEPTION 'Nema dovoljno zaliha za proizvod: % (dostupno: %, potrebno: %)', 
          v_stavka.naziv, v_stavka.kolicina_na_lageru, v_stavka.kolicina;
      END IF;
    END LOOP;

    -- Smanji lager
    FOR v_stavka IN 
      SELECT sn.proizvod_id, sn.kolicina
      FROM stavka_narudzbenice sn
      WHERE sn.narudzbenica_id = p_id_narudzbenica
    LOOP
      UPDATE proizvod
      SET kolicina_na_lageru = kolicina_na_lageru - v_stavka.kolicina
      WHERE id_proizvod = v_stavka.proizvod_id;
    END LOOP;

    -- Postavi datum_zavrsetka
    UPDATE narudzbenica
    SET status = p_novi_status,
        datum_zavrsetka = CURRENT_TIMESTAMP
    WHERE narudzbenica.id_narudzbenica = p_id_narudzbenica
    RETURNING 
      narudzbenica.id_narudzbenica,
      narudzbenica.status,
      narudzbenica.datum_zavrsetka,
      narudzbenica.stornirana
    INTO id_narudzbenica, status, datum_zavrsetka, stornirana;

    RETURN NEXT;
    RETURN;
  END IF;

  -- STORNIRANJE: Postavi polja storniranja, ne diraj lager
  IF p_novi_status = 'STORNIRANA' THEN
    IF p_razlog_storniranja IS NULL THEN
      RAISE EXCEPTION 'Razlog storniranja je obavezan';
    END IF;

    UPDATE narudzbenica
    SET status = 'STORNIRANA',
        stornirana = true,
        datum_storniranja = CURRENT_TIMESTAMP,
        razlog_storniranja = p_razlog_storniranja,
        stornirao_id = p_stornirao_id
    WHERE narudzbenica.id_narudzbenica = p_id_narudzbenica
    RETURNING 
      narudzbenica.id_narudzbenica,
      narudzbenica.status,
      narudzbenica.datum_zavrsetka,
      narudzbenica.stornirana
    INTO id_narudzbenica, status, datum_zavrsetka, stornirana;

    RETURN NEXT;
    RETURN;
  END IF;

  -- Obična promena statusa bez lager logike
  RETURN QUERY
  UPDATE narudzbenica
  SET status = p_novi_status
  WHERE narudzbenica.id_narudzbenica = p_id_narudzbenica
  RETURNING 
    narudzbenica.id_narudzbenica,
    narudzbenica.status,
    narudzbenica.datum_zavrsetka,
    narudzbenica.stornirana;
END;
$$ LANGUAGE plpgsql;

-- Funkcija za kreiranje narudzbenice sa stavkama
CREATE OR REPLACE FUNCTION kreiraj_narudzbenicu(
  p_tip tip_narudzbenice,
  p_kreirao_id INT,
  p_dobavljac_id INT DEFAULT NULL,
  p_dostavljac_id INT DEFAULT NULL,
  p_napomena TEXT DEFAULT NULL,
  p_stavke JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  id_narudzbenica INT,
  datum_kreiranja TIMESTAMP,
  tip tip_narudzbenice,
  status status_narudzbenice,
  ukupna_vrednost DOUBLE PRECISION
) AS $$
DECLARE
  v_id_narudzbenica INT;
  v_stavka JSONB;
  v_ukupna_vrednost NUMERIC := 0;
  v_prodajna_cena NUMERIC;
  v_nabavna_cena NUMERIC;
  v_kolicina INT;
  v_proizvod_id INT;
BEGIN
  -- Kreiraj narudzbenicu
  INSERT INTO narudzbenica (
    tip, kreirao_id, dobavljac_id, dostavljac_id, napomena, status, ukupna_vrednost
  ) VALUES (
    p_tip, p_kreirao_id, p_dobavljac_id, p_dostavljac_id, p_napomena, 'KREIRANA', 0
  ) RETURNING narudzbenica.id_narudzbenica INTO v_id_narudzbenica;

  -- Dodaj stavke
  FOR v_stavka IN SELECT * FROM jsonb_array_elements(p_stavke)
  LOOP
    v_proizvod_id := (v_stavka->>'proizvod_id')::INT;
    v_kolicina := (v_stavka->>'kolicina')::INT;

    -- Kod PRODAJE, uzmi prodajnu cenu iz proizvoda (snapshot)
    IF p_tip = 'PRODAJA' THEN
      SELECT prodajna_cena INTO v_prodajna_cena
      FROM proizvod
      WHERE id_proizvod = v_proizvod_id;

      INSERT INTO stavka_narudzbenice (
        narudzbenica_id, proizvod_id, kolicina, prodajna_cena, ukupna_cena
      ) VALUES (
        v_id_narudzbenica, v_proizvod_id, v_kolicina, v_prodajna_cena, v_prodajna_cena * v_kolicina
      );

      v_ukupna_vrednost := v_ukupna_vrednost + (v_prodajna_cena * v_kolicina);
    ELSE
      -- Kod NABAVKE, uzmi nabavnu cenu iz proizvoda
      SELECT nabavna_cena INTO v_nabavna_cena
      FROM proizvod
      WHERE id_proizvod = v_proizvod_id;

      INSERT INTO stavka_narudzbenice (
        narudzbenica_id, proizvod_id, kolicina, ukupna_cena
      ) VALUES (
        v_id_narudzbenica, v_proizvod_id, v_kolicina, v_nabavna_cena * v_kolicina
      );

      v_ukupna_vrednost := v_ukupna_vrednost + (v_nabavna_cena * v_kolicina);
    END IF;
  END LOOP;

  -- Ažuriraj ukupnu vrednost
  UPDATE narudzbenica
  SET ukupna_vrednost = v_ukupna_vrednost
  WHERE narudzbenica.id_narudzbenica = v_id_narudzbenica;

  -- Vrati kreiranu narudzbenicu
  RETURN QUERY
  SELECT 
    n.id_narudzbenica,
    n.datum_kreiranja,
    n.tip,
    n.status,
    n.ukupna_vrednost
  FROM narudzbenica n
  WHERE n.id_narudzbenica = v_id_narudzbenica;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ISPRAVKE I ENHANCEMENTS
-- ============================================================================

-- Popravljanje stare kolone cena (iz 05_fix_cena_column.sql)
-- Setovanje cena na prodajnu cenu za sve postojeće proizvode gde je cena NULL
UPDATE proizvod 
SET cena = prodajna_cena 
WHERE cena IS NULL;

-- Modifikacija foreign key constraint-a za CASCADE delete na proizvod
-- Ovo omogućava brisanje proizvoda čak i ako ima stavke narudžbenice
ALTER TABLE stavka_narudzbenice 
  DROP CONSTRAINT IF EXISTS stavka_narudzbenice_proizvod_id_fkey;

ALTER TABLE stavka_narudzbenice 
  ADD CONSTRAINT stavka_narudzbenice_proizvod_id_fkey 
  FOREIGN KEY (proizvod_id) 
  REFERENCES proizvod(id_proizvod) 
  ON DELETE CASCADE;
