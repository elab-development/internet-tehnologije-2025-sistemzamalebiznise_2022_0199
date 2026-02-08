# 🚀 Brzi pokretanje sistema

Slijedi ova uputstva korak po korak:

## Korak 1: Pokretanje baze podataka

```bash
docker-compose up -d
```

Čeka 10 sekundi da se PostgreSQL inicijalizuje.

## Korak 2: Pokretanje migracija

Otvori novi terminal i izvrši:

```bash
# Kreiraj sve tabele
psql -h localhost -U admin -d iteh_baza -f migrations/06_complete_schema.sql

# Dodaj test podatke
psql -h localhost -U admin -d iteh_baza -f migrations/07_seed_data.sql
```

Ako `psql` nije dostupan, koristi Docker:

```bash
docker exec -i postgres-container psql -U admin -d iteh_baza < migrations/06_complete_schema.sql
docker exec -i postgres-container psql -U admin -d iteh_baza < migrations/07_seed_data.sql
```

## Korak 3: Pokretanje aplikacije

```bash
npm install
npm run dev
```

Aplikacija će biti dostupna na: **http://localhost:3000**

## Korak 4: Prijava

- Otvori http://localhost:3000/login
- Unesi email: `admin@example.com`
- Unesi lozinku: `lozinka123`
- Klikni "Prijavi se"

## ✅ Šta je sada dostupno?

| Stranica | URL | Opis |
|---------|-----|------|
| Kontrolna tabla | `/dashboard` | Pregled statistike i upozorenja |
| Proizvodi | `/proizvodi` | Upravljanje proizvodima |
| Dobavljači | `/dobavljaci` | Upravljanje dobavljačima |
| Narudžbenice | `/narudzbenice` | Upravljanje narudžbenicama |
| Nova narudžbenica | `/narudzbenice/nova` | Kreiranje nove narudžbenice |
| Novi proizvod | `/proizvodi/novo` | Dodavanje novog proizvoda |

## 🔒 Bezbednost

- Tokeni se čuvaju u HTTP-only kolačićima
- Sve lozinke su heširane sa bcryptjs
- Svi unosu su zaštićeni od SQL injection

## 📊 Test podatke

Sistem dolazi sa test proizvodima, dobavljačima i kategorijama:

**Proizvodi:**
- Laptop HP (Elektronika)
- Monitor Dell (Elektronika)
- Tastatura Mehanička (Elektronika)
- Miš Logitech (Elektronika)
- T-shirt Pamuk (Odeća)
- Cement 50kg (Materijali za gradnju)

**Dobavljači:**
- Distributor A
- Distributor B
- Distributor C

**Kategorije:**
- Elektronika
- Odeća
- Namirnice
- Materijali za gradnju

## 🛠️ Koristi mogućnosti

### 1. Pristup API-ju sa Postman ili Thunder Client

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "lozinka": "lozinka123"
}
```

### 2. Kreiranje nove narudžbenice

1. Idi na `/narudzbenice/nova`
2. Odaberi dobavljača
3. Dodaj proizvode sa količinama i cenama
4. Klikni "Kreiraj narudžbenicu"

### 3. Ažuriranje statusa narudžbenice

1. Idi na `/narudzbenice`
2. Klikni na narudžbenicu
3. Promeni status: DRAFT → SENT → RECEIVED
4. Kada je status RECEIVED, količine proizvoda se automatski ažuriraju

## 🐛 Problemi?

### Port 5432 je zauzet
```bash
docker kill $(docker ps -q)
docker-compose up -d
```

### Database ne postoji
```bash
docker-compose down -v
docker-compose up -d
```

### psql: command not found
Koristi Docker umesto toga:
```bash
docker exec -it postgres-container psql -U admin -d iteh_baza
```

## 📞 Pomoć

Sva dokumentacija je dostupna u `KOMPLETNO_RJESENJE.md`
