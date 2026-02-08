# Sistem za upravljanje lagером - Inventory Management System

Kompletan Next.js sistem za upravljanje lagером, proizvodima, dobavljačima i narudžbenicama za male biznise.

## 🚀 Karakteristike

- ✅ Autentifikacija sa JWT tokenom
- ✅ Upravljanje proizvodima (CRUD operacije)
- ✅ Upravljanje dobavljačima
- ✅ Upravljanje kategorijama
- ✅ Upravljanje narudžbenicama (sa statusima: DRAFT, SENT, RECEIVED)
- ✅ Kontrolna tabla sa upozorenjima za nisko stanje lagera
- ✅ Prikaz vrednosti lagera
- ✅ Automatsko ažuriranje količine na lageru pri primanju narudžbenice
- ✅ PostgreSQL baza podataka
- ✅ Docker podrška za bazu

## 📋 Tehnologije

- **Frontend:** Next.js 16 (App Router)
- **Backend:** Next.js API Routes
- **Baza:** PostgreSQL
- **ORM:** Direktni SQL queries sa `pg` drajverom
- **Autentifikacija:** JWT sa `jsonwebtoken` i `jose`
- **Styling:** Tailwind CSS
- **Sigurnost:** bcryptjs za heširanje lozinki

## 🛠️ Instalacija i pokretanje

### 1. Preduslovi

- Node.js 18+ instaliran
- Docker i Docker Compose (opciono, za lokalnu bazu)
- PostgreSQL (ako ne koristiš Docker)

### 2. Kloniranje i instalacija zavisnosti

```bash
cd internet-tehnologije-2025-sistemzamalebiznise_2022_0199
npm install
```

### 3. PostgreSQL baza podataka

#### Opcija A: Korišćenje Docker-a (preporučeno)

```bash
docker-compose up -d
```

Ovo će pokrenuti PostgreSQL na `localhost:5432` sa kredencijalima:
- User: `admin`
- Password: `admin`
- Database: `iteh_baza`

#### Opcija B: Lokalni PostgreSQL

Uveri se da je PostgreSQL pokrenut i kreiraj bazu:

```sql
CREATE DATABASE iteh_baza;
```

### 4. Konfiguracija okruženja

Proveri da je `.env` fajl pravilno konfigurisan:

```env
DATABASE_URL="postgresql://admin:admin@localhost:5432/iteh_baza?schema=public"
JWT_SECRET="kljuc_za_jwt_token"
```

### 5. Pokretanje migracija baze

```bash
# Priključi se bazi i izvrši migracije
psql -h localhost -U admin -d iteh_baza < migrations/06_complete_schema.sql
psql -h localhost -U admin -d iteh_baza < migrations/07_seed_data.sql
```

Ili koristi PostgreSQL klijent (pgAdmin, DBeaver, itd.)

### 6. Pokretanje aplikacije

```bash
npm run dev
```

Aplikacija će biti dostupna na: **http://localhost:3000**

## 🔐 Test kredencijali

Nakon izvršavanja seed migracije, možeš se prijaviti sa:

- **Email (Admin):** admin@example.com
- **Password:** lozinka123
- **Role:** ADMIN

- **Email (Employee):** employee@example.com
- **Password:** lozinka123
- **Role:** EMPLOYEE

## 📚 API Dokumentacija

### Autentifikacija

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "lozinka": "lozinka123"
}
```

**Response (201):**
```json
{
  "message": "Uspešna prijava",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "uloga": "ADMIN"
  },
  "token": "eyJhbGc..."
}
```

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "lozinka": "password123",
  "uloga": "EMPLOYEE"
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>
```

### Proizvodi (Products)

#### Get All Products
```
GET /api/proizvodi
```

#### Create Product
```
POST /api/proizvodi
Authorization: Bearer <token>
Content-Type: application/json

{
  "naziv": "Laptop HP",
  "opis": "HP Pavilion 15",
  "sifra": "LAP-001",
  "cena_nabavke": 35000,
  "cena_prodaje": 45000,
  "kolicina_na_lageru": 5,
  "minimalna_kolicina": 2,
  "id_kategorija": 1,
  "id_dobavljac": 1
}
```

#### Get Product Details
```
GET /api/proizvodi/:id
```

#### Update Product
```
PUT /api/proizvodi/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### Delete Product
```
DELETE /api/proizvodi/:id
Authorization: Bearer <token>
```

### Dobavljači (Suppliers)

#### Get All Suppliers
```
GET /api/dobavljaci
```

#### Create Supplier
```
POST /api/dobavljaci
Authorization: Bearer <token>
Content-Type: application/json

{
  "naziv": "Distributor A",
  "email": "contact@distributora.com",
  "telefon": "+381112345678",
  "adresa": "Beograd, Serbia"
}
```

### Kategorije (Categories)

#### Get All Categories
```
GET /api/kategorije
```

#### Create Category
```
POST /api/kategorije
Authorization: Bearer <token>
Content-Type: application/json

{
  "naziv": "Elektronika",
  "opis": "Računarska oprema"
}
```

### Narudžbenice (Purchase Orders)

#### Get All Orders
```
GET /api/narudzbenice
GET /api/narudzbenice?status=DRAFT
GET /api/narudzbenice?status=SENT
GET /api/narudzbenice?status=RECEIVED
```

#### Create Order
```
POST /api/narudzbenice
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_dobavljac": 1,
  "stavke": [
    {
      "id_proizvod": 1,
      "kolicina": 10,
      "cena_po_komadu": 35000
    }
  ],
  "ukupna_cena": 350000,
  "napomene": "Dostava do 10.02.2025"
}
```

#### Get Order Details
```
GET /api/narudzbenice/:id
```

#### Update Order Status
```
PATCH /api/narudzbenice/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "SENT"
}
```

Statusi: `DRAFT` → `SENT` → `RECEIVED`

Primer: Kada status postane `RECEIVED`, količine proizvoda se automatski ažuriraju u bazi.

#### Delete Order
```
DELETE /api/narudzbenice/:id
Authorization: Bearer <token>
```

(Samo DRAFT narudžbenice mogu biti obrisane)

### Kontrolna tabla (Dashboard)

#### Get Dashboard Data
```
GET /api/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "lowStockAlerts": [
    {
      "id_proizvod": 1,
      "naziv": "Tastatura Mehanička",
      "kolicina_na_lageru": 2,
      "minimalna_kolicina": 5,
      "nedostaje": 3
    }
  ],
  "inventoryValue": {
    "ukupna_vrednost_nabavke": 650000,
    "ukupna_vrednost_prodaje": 950000
  },
  "orderStats": {
    "draft_orders": 2,
    "sent_orders": 1,
    "received_orders": 5,
    "total_orders": 8
  },
  "productStats": {
    "total_products": 6,
    "active_products": 6
  }
}
```

## 📖 Korisničke stranice

### Prijava
- URL: `http://localhost:3000/login`
- Unesi email i lozinku
- Automatski preusmeri na kontrolnu tablu nakon uspešne prijave

### Kontrolna tabla
- URL: `http://localhost:3000/dashboard`
- Prikazi sažete statistike
- Upozorenja za proizvode sa niskom količinom
- Brzi linkovi za često korišćene radnje

### Proizvodi
- URL: `http://localhost:3000/proizvodi`
- Prikazi sve proizvode u tabeli
- Klikni na proizvod za detalje i ažuriranje
- Dodaj nove proizvode

### Dobavljači
- URL: `http://localhost:3000/dobavljaci`
- Prikazi sve dobavljače
- Dodaj nove dobavljače

### Narudžbenice
- URL: `http://localhost:3000/narudzbenice`
- Filtriraj po statusu (DRAFT, SENT, RECEIVED)
- Pregled detalja narudžbenice
- Prosledi status
- Kada je status `RECEIVED`, količine proizvoda se ažuriraju

## 🗄️ Šema baze podataka

### Korisnik (user)
```sql
id_korisnik | username | email | lozinka_hash | uloga | aktivan | datum_kreiranja
```

### Kategorija (category)
```sql
id_kategorija | naziv | opis | aktivan
```

### Dobavljač (supplier)
```sql
id_dobavljac | naziv | email | telefon | adresa | aktivan | datum_kreiranja
```

### Proizvod (product)
```sql
id_proizvod | naziv | opis | sifra | cena_nabavke | cena_prodaje | 
kolicina_na_lageru | minimalna_kolicina | id_kategorija | id_dobavljac | 
aktivan | datum_kreiranja
```

### Narudžbenica (purchase_order)
```sql
id_narudzbenica | id_dobavljac | id_korisnik | status | ukupna_cena | 
napomene | datum_kreiranja | datum_slanja | datum_prijema
```

### Stavka narudžbenice (order_item)
```sql
id_stavka | id_narudzbenica | id_proizvod | kolicina | cena_po_komadu | datum_kreiranja
```

## 🐛 Rešavanje problema

### Greška: "Cannot find database"
- Proveri je li PostgreSQL pokrenut: `docker-compose up -d`
- Proveri `.env` konfiguraciju

### Greška: "Unauthorized" na zaštićenim rutama
- Proveri da li je token pravilno postavljen
- Obriši kolačić i ponovo se prijavi

### Greška: "Port 5432 already in use"
- Promeni port u `docker-compose.yml` ili zaustavi postojeći PostgreSQL proces

### Greška pri brisanju proizvoda
- Proizvod može biti obrisan samo ako nema veza sa narudžbenicama u toku

## 📝 Napomene za razvoj

- Sve rute u `/api` zahtevaju JWT token (osim `/auth/login`, `/auth/register`)
- Tokeni se čuvaju u HTTP-only kolačيću (sigurnije)
- Lozinke se hešuju sa bcryptjs pre nego što se čuvaju
- Sve transakcije sa bazom koriste parameterizovane upite (zaštita od SQL injection)

## 🚀 Produkcija (Production)

```bash
npm run build
npm run start
```

Takođe postavi `NODE_ENV=production` u `.env`

## 📄 Licenca

MIT

## 👨‍💻 Autor

ITEH Projekat 2025
