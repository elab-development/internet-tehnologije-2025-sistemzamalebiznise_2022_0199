CREATE OR REPLACE FUNCTION izmeni_proizvod(
  p_id_proizvod INT,
  p_naziv TEXT DEFAULT NULL,
  p_sifra TEXT DEFAULT NULL,
  p_cena DOUBLE PRECISION DEFAULT NULL,
  p_kolicina_na_lageru INT DEFAULT NULL,
  p_jedinica_mere TEXT DEFAULT NULL
)
RETURNS TABLE (
  id_proizvod INT,
  naziv TEXT,
  sifra TEXT,
  cena DOUBLE PRECISION,
  kolicina_na_lageru INT,
  jedinica_mere TEXT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE proizvod SET
    naziv = COALESCE(p_naziv, proizvod.naziv),
    sifra = COALESCE(p_sifra, proizvod.sifra),
    cena = COALESCE(p_cena, proizvod.cena),
    kolicina_na_lageru = COALESCE(p_kolicina_na_lageru, proizvod.kolicina_na_lageru),
    jedinica_mere = COALESCE(p_jedinica_mere, proizvod.jedinica_mere)
  WHERE proizvod.id_proizvod = p_id_proizvod
  RETURNING 
    proizvod.id_proizvod,
    proizvod.naziv,
    proizvod.sifra,
    proizvod.cena,
    proizvod.kolicina_na_lageru,
    proizvod.jedinica_mere;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION izmeni_dobavljaca(
  p_id_dobavljac INT,
  p_naziv_firme TEXT DEFAULT NULL,
  p_telefon TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_adresa TEXT DEFAULT NULL
)
RETURNS TABLE (
  id_dobavljac INT,
  naziv_firme TEXT,
  telefon TEXT,
  email TEXT,
  adresa TEXT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE dobavljac SET
    naziv_firme = COALESCE(p_naziv_firme, dobavljac.naziv_firme),
    telefon = COALESCE(p_telefon, dobavljac.telefon),
    email = COALESCE(p_email, dobavljac.email),
    adresa = COALESCE(p_adresa, dobavljac.adresa)
  WHERE dobavljac.id_dobavljac = p_id_dobavljac
  RETURNING 
    dobavljac.id_dobavljac,
    dobavljac.naziv_firme,
    dobavljac.telefon,
    dobavljac.email,
    dobavljac.adresa;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION izmeni_status_narudzbenice(
  p_id_narudzbenica INT,
  p_status status_narudzbenice
)
RETURNS TABLE (
  id_narudzbenica INT,
  status status_narudzbenice
) AS $$
BEGIN
  RETURN QUERY
  UPDATE narudzbenica SET
    status = p_status
  WHERE narudzbenica.id_narudzbenica = p_id_narudzbenica
  RETURNING 
    narudzbenica.id_narudzbenica,
    narudzbenica.status;
END;
$$ LANGUAGE plpgsql;

-- Ažuriranje svih proizvoda da imaju validne cene
UPDATE proizvod 
SET 
  cena = COALESCE(prodajna_cena, cena, 0),
  nabavna_cena = COALESCE(nabavna_cena, cena, 0),
  prodajna_cena = COALESCE(prodajna_cena, cena, 0)
WHERE cena IS NULL OR nabavna_cena IS NULL OR prodajna_cena IS NULL;

-- Provera da nema NULL vrednosti
SELECT COUNT(*) as proizvoda_sa_null_cenom 
FROM proizvod 
WHERE cena IS NULL OR nabavna_cena IS NULL OR prodajna_cena IS NULL;
