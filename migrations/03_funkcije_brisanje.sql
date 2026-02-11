CREATE OR REPLACE FUNCTION obrisi_proizvod(p_id_proizvod INT)
RETURNS INT AS $$
DECLARE
  obrisano_id INT;
BEGIN
  DELETE FROM proizvod 
  WHERE id_proizvod = p_id_proizvod
  RETURNING id_proizvod INTO obrisano_id;
  
  RETURN obrisano_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION obrisi_dobavljaca(p_id_dobavljac INT)
RETURNS INT AS $$
DECLARE
  obrisano_id INT;
BEGIN
  DELETE FROM dobavljac 
  WHERE id_dobavljac = p_id_dobavljac
  RETURNING id_dobavljac INTO obrisano_id;
  
  RETURN obrisano_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION obrisi_korisnika(p_id_korisnik INT)
RETURNS INT AS $$
DECLARE
  obrisano_id INT;
BEGIN
  DELETE FROM korisnik 
  WHERE id_korisnik = p_id_korisnik
  RETURNING id_korisnik INTO obrisano_id;
  
  RETURN obrisano_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION obrisi_narudzbenicu(p_id_narudzbenica INT)
RETURNS INT AS $$
DECLARE
  obrisano_id INT;
BEGIN
  -- Prvo se brišu stavke narudžbenice zbog CASCADE constraint-a
  DELETE FROM narudzbenica 
  WHERE id_narudzbenica = p_id_narudzbenica
  RETURNING id_narudzbenica INTO obrisano_id;
  
  RETURN obrisano_id;
END;
$$ LANGUAGE plpgsql;
