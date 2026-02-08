-- TIP MIGRACIJE 1: Kreiranje tabela
CREATE TABLE IF NOT EXISTS "Korisnik" (
    idKorisnik SERIAL PRIMARY KEY,
    ime VARCHAR(100),
    prezime VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    "lozinkaHash" TEXT NOT NULL,
    uloga VARCHAR(50),
    aktivan BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS "Proizvod" (
    idProizvod SERIAL PRIMARY KEY,
    naziv VARCHAR(255),
    sifra VARCHAR(50) UNIQUE,
    cena DECIMAL(10,2),
    "kolicinaNaLageru" INTEGER,
    "jedinicaMere" VARCHAR(20),
    aktivan BOOLEAN DEFAULT true
);