============================================================
  POSTUPAK ZA POKRETANJE PROJEKTA - KORAK PO KORAK
============================================================

PREDUSLOV: Mora biti instaliran Docker Desktop, Node.js i npm.

============================================================
KORAK 1: POKRETANJE DOCKER DESKTOP-A
============================================================

Otvori Docker Desktop sa Start menija.
Sacekaj da se potpuno pokrene (zelena ikona u taskbar-u).

============================================================
KORAK 2: POKRETANJE BAZE PODATAKA (PostgreSQL)
============================================================

Otvori PowerShell terminal i pokreni:

  cd C:\Users\Marijana\Documents\FON\ITEH\ITEH_PROJEKAT\internet-tehnologije-2025-sistemzamalebiznise_2022_0199
  docker-compose up -d

Sacekaj 10 sekundi da se PostgreSQL inicijalizuje.

============================================================
KORAK 3: KREIRANJE TABELA U BAZI (migracija)
============================================================

U istom terminalu pokreni:

  Get-Content "migrations\00_uml_schema.sql" | docker exec -i (docker ps --format "{{.Names}}" | Select-Object -First 1) psql -U admin -d iteh_baza

Trebalo bi da vidis: DROP TABLE, CREATE TYPE, CREATE TABLE, CREATE INDEX itd.

NAPOMENA: Ovo je potrebno samo PRVI PUT ili ako zelis da resetujes bazu.

============================================================
KORAK 4: POKRETANJE BACKEND-A (Next.js API server)
============================================================

U istom terminalu pokreni:

  cd C:\Users\Marijana\Documents\FON\ITEH\ITEH_PROJEKAT\internet-tehnologije-2025-sistemzamalebiznise_2022_0199
  npm install
  npm run dev

Backend ce raditi na: http://localhost:3000
API endpoint:         http://localhost:3000/api

NAPOMENA: npm install je potreban samo PRVI PUT.
NAPOMENA: Ovaj terminal OSTAJE OTVOREN dok radis sa aplikacijom.

============================================================
KORAK 5: POKRETANJE FRONTEND-A (Vite React app)
============================================================

Otvori NOVI PowerShell terminal (ne zatvaraj prethodni!) i pokreni:

  cd C:\Users\Marijana\Documents\FON\ITEH\ITEH_PROJEKAT\internet-tehnologije-2025-sistemzamalebiznise_2022_0199\front\shop-scale-buddy
  npm install
  npm run dev

Frontend ce raditi na: http://localhost:8080

NAPOMENA: npm install je potreban samo PRVI PUT.
NAPOMENA: Ovaj terminal OSTAJE OTVOREN dok radis sa aplikacijom.

============================================================
KORAK 6: OTVARANJE APLIKACIJE
============================================================

Otvori browser i idi na: http://localhost:8080

- Registracija: http://localhost:8080/register
- Login:        http://localhost:8080/login
- Dashboard:    http://localhost:8080/dashboard (potrebna prijava)

============================================================
GASENJE SVEGA
============================================================

1. U terminalu gde radi frontend: Ctrl + C
2. U terminalu gde radi backend:  Ctrl + C
3. Za gasenje baze:
   cd C:\Users\Marijana\Documents\FON\ITEH\ITEH_PROJEKAT\internet-tehnologije-2025-sistemzamalebiznise_2022_0199
   docker-compose down

============================================================
REZIME - STA RADI NA KOM PORTU
============================================================

  PostgreSQL baza:   localhost:5432  (user: admin, pass: admin, db: iteh_baza)
  Backend API:       localhost:3000  (Next.js)
  Frontend:          localhost:8080  (Vite React)

============================================================
CEST PROBLEM: "Greska 500" ili "Failed to fetch"
============================================================

1. Proveri da li je Docker Desktop pokrenut
2. Proveri da li je baza pokrenuta:  docker ps
3. Proveri da li je backend pokrenut (terminal sa npm run dev)
4. Proveri da li je frontend pokrenut (drugi terminal sa npm run dev)
5. Ako nista ne pomaze, resetuj bazu (ponovi Korak 3)
