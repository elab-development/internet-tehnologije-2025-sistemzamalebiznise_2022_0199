-- Izmena tipa kolone i dodavanje nove kolone za opis
ALTER TABLE "Proizvod" 
ALTER COLUMN naziv TYPE VARCHAR(300),
ADD COLUMN opis TEXT;