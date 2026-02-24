# Sistem za Male Biznise (ShopScale Buddy)

> Projekat iz predmeta **Internet tehnologije** — FON, Univerzitet u Beogradu  
> Studenti: **2022/0199, 2022/0024**

---

## O aplikaciji

**Sistem za male biznise** je full-stack web aplikacija za upravljanje poslovanjem malih preduzeća. Aplikacija omogućava praćenje proizvoda, dobavljača, narudžbenica (nabavke i prodaje), lagera, korisnika i analitike profita.

### Glavne funkcionalnosti

| Modul | Opis |
|-------|------|
| **Autentifikacija** | Registracija i prijava korisnika sa JWT tokenima (HttpOnly kolačići) |
| **Dashboard** | Pregled osnovnih statistika — broj proizvoda, dobavljača, narudžbenica, korisnika i upozorenja na nizak lager |
| **Proizvodi** | CRUD operacije nad proizvodima (naziv, šifra, nabavna/prodajna cena, količina na lageru, jedinica mere) |
| **Dobavljači** | Pregled i dodavanje dobavljača (naziv firme, telefon, email, adresa) |
| **Narudžbenice** | Kreiranje i praćenje narudžbenica sa stavkama — posebne logike za NABAVKU i PRODAJU |
| **Lager** | Automatsko ažuriranje lagera pri završetku narudžbenica + obaveštenja putem email-a za nizak lager (≤5) |
| **Korisnici** | Upravljanje korisnicima i ulogama (samo za VLASNIKA) |
| **Analitika** | Vizualizacija profita — ukupan profit, profit po danima (linijski grafikon), top 5 proizvoda po profitu (bar grafikon) |

### Korisničke uloge (RBAC)

| Uloga | Pristup |
|-------|---------|
| **VLASNIK** | Pun pristup — upravljanje proizvodima, korisnicima, narudžbenicama, analitika, dodeljivanje dostavljača |
| **RADNIK** | Pregled proizvoda i dobavljača, kreiranje i upravljanje narudžbenicama, lager pregled |
| **DOSTAVLJAČ** | Pregled dodeljenih narudžbenica, promena statusa na njima |

### Status narudžbenica

**NABAVKA** (od dobavljača):  
`KREIRANA` → `U_TRANSPORTU` / `OTKAZANA` → `ZAVRSENA` (povećava lager)

**PRODAJA** (ka kupcu):  
`KREIRANA` → `ZAVRSENA` (smanjuje lager, proverava dostupnost) / `STORNIRANA`

---

## Tehnologije

| Sloj | Tehnologija |
|------|-------------|
| **Backend** | Next.js 16 (API Routes), TypeScript |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Baza podataka** | PostgreSQL 15 (Docker) |
| **Autentifikacija** | JWT (jose + bcryptjs), HttpOnly kolačići |
| **Vizualizacija** | react-google-charts (Google Charts API) |
| **Email** | Nodemailer — obaveštenja za nizak lager |
| **Testiranje** | Vitest + @testing-library/jest-dom |

### Bezbednost

- **SQL Injection** — parametrizovani upiti (pg Pool)
- **CORS** — whitelist dozvoljenih origin-a
- **XSS** — sigurnosni HTTP zaglavlja (CSP, X-Frame-Options, X-Content-Type-Options)
- **Lozinke** — bcrypt hash (10 salt rounds)
- **Sesija** — JWT u HttpOnly/Secure kolačićima

---

## Struktura projekta

```
├── app/                    # Next.js backend (API routes)
│   ├── api/
│   │   ├── auth/           # Login, registracija, logout, /me
│   │   ├── analitika/      # Profit analitika
│   │   ├── dashboard/      # Statistike za dashboard
│   │   ├── dobavljaci/     # CRUD dobavljaca
│   │   ├── korisnici/      # CRUD korisnika (VLASNIK)
│   │   ├── lager/          # Lager pregled i obavestenja
│   │   ├── narudzbenice/   # CRUD narudzbenica + status
│   │   └── proizvodi/      # CRUD proizvoda
│   └── layout.tsx, page.tsx
├── lib/                    # Pomocne biblioteke
│   ├── auth.ts             # JWT verifikacija
│   ├── cors.ts             # CORS konfiguracija
│   ├── db.ts               # PostgreSQL pool
│   └── lowStockMailer.ts   # Email obavestenja
├── middleware.ts            # Sigurnosni HTTP headeri
├── migrations/             # SQL migracije za bazu
├── front/shop-scale-buddy/ # React frontend (Vite)
│   └── src/
│       ├── pages/          # Stranice aplikacije
│       ├── components/     # UI komponente (shadcn/ui)
│       ├── contexts/       # Auth kontekst
│       ├── hooks/          # Custom hooks
│       └── lib/            # API klijent, tipovi, konfiguracija
├── docker-compose.yml      # PostgreSQL kontejner
└── package.json            # Backend zavisnosti
```

---

## Pokretanje projekta

### Preduslov

- **Docker Desktop** (za PostgreSQL bazu)
- **Node.js** (v18+) i **npm**

### Korak 1 — Pokretanje baze podataka

```bash
docker-compose up -d
```

Sačekati ~10 sekundi da se PostgreSQL inicijalizuje.

### Korak 2 — Kreiranje tabela (samo prvi put)

Pokrenuti SQL migracije redom:

```bash
Get-Content "migrations\01_kreiranje_tabela.sql" | docker exec -i (docker ps --format "{{.Names}}" | Select-Object -First 1) psql -U admin -d iteh_baza
Get-Content "migrations\02_funkcije_izmena.sql" | docker exec -i (docker ps --format "{{.Names}}" | Select-Object -First 1) psql -U admin -d iteh_baza
Get-Content "migrations\03_funkcije_brisanje.sql" | docker exec -i (docker ps --format "{{.Names}}" | Select-Object -First 1) psql -U admin -d iteh_baza
Get-Content "migrations\04_lager_dopuna_tabela.sql" | docker exec -i (docker ps --format "{{.Names}}" | Select-Object -First 1) psql -U admin -d iteh_baza
```

### Korak 3 — Pokretanje backend-a (Next.js)

```bash
npm install       # samo prvi put
npm run dev
```

Backend radi na: **http://localhost:3000**

### Korak 4 — Pokretanje frontend-a (u novom terminalu)

```bash
cd front/shop-scale-buddy
npm install       # samo prvi put
npm run dev
```

Frontend radi na: **http://localhost:8080**

### Korak 5 — Otvaranje aplikacije

Otvoriti browser na: **http://localhost:8080**

- Registracija: `/register`
- Prijava: `/login`
- Dashboard: `/dashboard`

---

## Pokretanje testova

```bash
cd front/shop-scale-buddy
npx vitest run
```

---

## Gašenje

1. Ctrl+C u terminalu frontend-a
2. Ctrl+C u terminalu backend-a
3. Gašenje baze: `docker-compose down`

---

## Portovi

| Servis | Port |
|--------|------|
| PostgreSQL | localhost:5432 (user: admin, pass: admin, db: iteh_baza) |
| Backend API | localhost:3000 |
| Frontend | localhost:8080 |

---

## Čest problem: "Greška 500" ili "Failed to fetch"

1. Proveriti da li je Docker Desktop pokrenut
2. Proveriti da li je baza pokrenuta: `docker ps`
3. Proveriti da li je backend pokrenut (terminal sa `npm run dev`)
4. Proveriti da li je frontend pokrenut (drugi terminal sa `npm run dev`)
5. Ako ništa ne pomaže, resetovati bazu (ponoviti Korak 2)
