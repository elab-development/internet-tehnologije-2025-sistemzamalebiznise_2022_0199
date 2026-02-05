CREATE TABLE IF NOT EXISTS narudzbenica (
    id_narudzbenica SERIAL PRIMARY KEY,
    id_korisnik INTEGER REFERENCES korisnik(id_korisnik),
    ukupna_cena NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'u_obradi',
    datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stavka_narudzbenice (
    id_stavka SERIAL PRIMARY KEY,
    id_narudzbenica INTEGER REFERENCES narudzbenica(id_narudzbenica) ON DELETE CASCADE,
    id_proizvod INTEGER REFERENCES proizvod(id_proizvod),
    kolicina INTEGER NOT NULL CHECK (kolicina > 0),
    cena_po_komadu NUMERIC(10, 2) NOT NULL
);