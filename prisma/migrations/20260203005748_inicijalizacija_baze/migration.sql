-- CreateTable
CREATE TABLE "Korisnik" (
    "idKorisnik" SERIAL NOT NULL,
    "ime" TEXT NOT NULL,
    "prezime" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lozinkaHash" TEXT NOT NULL,
    "uloga" TEXT NOT NULL,
    "aktivan" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Korisnik_pkey" PRIMARY KEY ("idKorisnik")
);

-- CreateTable
CREATE TABLE "Proizvod" (
    "idProizvod" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "sifra" TEXT NOT NULL,
    "cena" DOUBLE PRECISION NOT NULL,
    "kolicinaNaLageru" INTEGER NOT NULL,
    "jedinicaMere" TEXT NOT NULL,
    "aktivan" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Proizvod_pkey" PRIMARY KEY ("idProizvod")
);

-- CreateIndex
CREATE UNIQUE INDEX "Korisnik_email_key" ON "Korisnik"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Proizvod_sifra_key" ON "Proizvod"("sifra");
