-- Dodavanje UNIQUE ograničenja na email korisnika
-- ili na šifru proizvoda
ALTER TABLE "Proizvod" 
ADD CONSTRAINT unique_sifra_proizvoda UNIQUE (sifra);