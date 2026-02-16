# Implementacija Lager Modula - Dokumentacija

## Pregled Implementacije

Ova implementacija dodaje kompletan lager sistem za upravljanje zalihama, nabavkama i prodajama sa sledećim funkcionalnostima:

### 1. MODEL PODATAKA

#### Tabela `proizvod` - Nova Polja
- `nabavna_cena` (NUMERIC, NOT NULL) - Fiksna nabavna cena, postavlja se samo pri kreiranju
- `prodajna_cena` (NUMERIC, NOT NULL) - Prodajna cena, može se menjati
- `kolicina_na_lageru` (INTEGER, NOT NULL, DEFAULT 0) - Trenutna količina na stanju
- `minimalna_kolicina` (INTEGER) - Minimalni nivo zaliha (opciono)
- `datum_kreiranja` (TIMESTAMP) - Automatski postavljeno
- `datum_izmene` (TIMESTAMP) - Automatski ažurirano pri izmeni

#### Tabela `narudzbenica` - Nova Polja
- `datum_izmene` (TIMESTAMP) - Automatski ažurirano
- `datum_zavrsetka` (TIMESTAMP) - Postavljeno kada status postane završni
- `stornirana` (BOOLEAN, DEFAULT false) - Da li je stornirana
- `datum_storniranja` (TIMESTAMP) - Kada je stornirana
- `razlog_storniranja` (TEXT) - Obavezan razlog storniranja
- `stornirao_id` (INTEGER) - Ko je stornirao

#### Tabela `stavka_narudzbenice` - Nova Polja
- `prodajna_cena` (NUMERIC) - Snapshot prodajne cene za PRODAJU
- `datum_kreiranja` (TIMESTAMP) - Kada je stavka kreirana

#### Novi Statusi
- `PRIMLJENA` - Završni status za NABAVKU (zamenjuje ISPORUCENA)
- `STORNIRANA` - Status za stornirane narudžbenice

---

## 2. PRIMENA MIGRACIJE

### Korak 1: Primeni migraciju
```bash
# Poveži se na PostgreSQL bazu
psql -U your_user -d your_database

# Primeni migraciju
\i migrations/04_lager_dopuna_tabela.sql
```

### Korak 2: Proveri primenjene izmene
```sql
-- Proveri strukturu proizvoda
\d proizvod

-- Proveri strukturu narudzbenice
\d narudzbenica

-- Proveri nove statusne
SELECT enum_range(NULL::status_narudzbenice);

-- Proveri funkcije
\df kreiraj_narudzbenicu
\df izmeni_status_narudzbenice_sa_lagerom
```

---

## 3. API ENDPOINTS

### GET `/api/lager`
**Opis:** Vraća listu svih proizvoda sa stanjem lagera

**Autorizacija:** VLASNIK, RADNIK

**Odgovor:**
```json
[
  {
    "id_proizvod": 1,
    "naziv": "Proizvod A",
    "sifra": "PRD001",
    "nabavna_cena": 100.00,
    "prodajna_cena": 150.00,
    "kolicina_na_lageru": 50,
    "minimalna_kolicina": 10,
    "jedinica_mere": "kom",
    "datum_kreiranja": "2026-02-16T10:00:00Z",
    "datum_izmene": "2026-02-16T12:00:00Z"
  }
]
```

**Greške:**
- `401` - Niste prijavljeni
- `403` - Nemate pristup (za DOSTAVLJAC)

---

### POST `/api/narudzbenice`
**Opis:** Kreira novu narudžbenicu (NABAVKA ili PRODAJA)

**Autorizacija:** VLASNIK, RADNIK

**Request Body:**
```json
{
  "tip": "PRODAJA",
  "stavke": [
    {
      "proizvod_id": 1,
      "kolicina": 5
    },
    {
      "proizvod_id": 2,
      "kolicina": 3
    }
  ],
  "dobavljac_id": null,
  "napomena": "Prodaja - Kupac XYZ"
}
```

**Napomene:**
- Kod **PRODAJE**: `prodajna_cena` se automatski snapshot-uje u stavci
- Kod **NABAVKE**: obavezan je `dobavljac_id`
- Kod **PRODAJE**: `dobavljac_id` mora biti `null`

**Odgovor:**
```json
{
  "message": "Narudžbenica kreirana",
  "id_narudzbenica": 123,
  "tip": "PRODAJA",
  "status": "KREIRANA",
  "ukupna_vrednost": 750.00,
  "datum_kreiranja": "2026-02-16T14:30:00Z"
}
```

---

### PATCH `/api/narudzbenice/[id]/status`
**Opis:** Menja status narudžbenice i automatski upravlja lagerom

**Autorizacija:** VLASNIK, RADNIK

**Request Body:**

#### Za završavanje NABAVKE (povećanje lagera)
```json
{
  "status": "PRIMLJENA"
}
```

#### Za završavanje PRODAJE (smanjenje lagera)
```json
{
  "status": "ZAVRSENA"
}
```

#### Za storniranje
```json
{
  "status": "STORNIRANA",
  "razlog_storniranja": "Kupac otkazao narudžbinu"
}
```

**Odgovor:**
```json
{
  "message": "Status uspešno promenjen",
  "id_narudzbenica": 123,
  "status": "ZAVRSENA",
  "datum_zavrsetka": "2026-02-16T15:00:00Z",
  "stornirana": false
}
```

**Greške:**
- `400` - Nema dovoljno zaliha (kod PRODAJE)
- `400` - Storniranje dozvoljeno samo za status KREIRANA
- `400` - Razlog storniranja je obavezan
- `401` - Niste prijavljeni
- `403` - Nemate pristup
- `404` - Narudžbenica nije pronađena

---

## 4. POSLOVNA PRAVILA

### NABAVKA - Flow Statusa
```
KREIRANA → POSLATA → U_TRANSPORTU → PRIMLJENA
                                   ↓
                               OTKAZANA
```

**Lager Rules:**
- Lager se povećava **SAMO** kada status postane `PRIMLJENA`
- Postavlja se `datum_zavrsetka`
- Formula: `kolicina_na_lageru += kolicina_iz_stavke`

**Primer:**
```sql
-- Pre: kolicina_na_lageru = 50
-- Stavka: kolicina = 20
-- Status → PRIMLJENA
-- Posle: kolicina_na_lageru = 70
```

---

### PRODAJA - Flow Statusa
```
KREIRANA → ZAVRSENA
    ↓
STORNIRANA
```

**Lager Rules:**
- Lager se smanjuje **SAMO** kada status postane `ZAVRSENA`
- **Pre smanjenja** - obavezna provera da li ima dovoljno zaliha
- Ako nema dovoljno → `400 "Nema dovoljno zaliha za proizvod X"`
- Postavlja se `datum_zavrsetka`
- Formula: `kolicina_na_lageru -= kolicina_iz_stavke`

**Primer:**
```sql
-- Pre: kolicina_na_lageru = 50
-- Stavka: kolicina = 20
-- Status → ZAVRSENA
-- Posle: kolicina_na_lageru = 30

-- Ako je kolicina_na_lageru = 10, a kolicina = 20
-- → GREŠKA: "Nema dovoljno zaliha"
```

---

### STORNIRANJE
**Pravila:**
- Storno je dozvoljen **ISKLJUČIVO** dok je status `KREIRANA`
- Kod storniranja:
  - `status = STORNIRANA`
  - `stornirana = true`
  - `datum_storniranja = NOW()`
  - `razlog_storniranja` - **OBAVEZAN**
  - `stornirao_id = auth.userId`
- **Lager se NE dira** kod storniranja

**Primer:**
```
Status: KREIRANA → Storno DOZVOLJEN ✓
Status: ZAVRSENA → Storno ZABRANJEN ✗
```

---

## 5. RBAC (Role-Based Access Control)

### VLASNIK
- ✅ Sve rute
- ✅ Kreiranje proizvoda
- ✅ Izmena proizvoda (osim nabavne_cena)
- ✅ Kreiranje nabavki i prodaja
- ✅ Završavanje narudžbenica
- ✅ Storniranje
- ✅ Pregled lagera

### RADNIK
- ✅ Kreiranje prodaje i nabavke
- ✅ Završavanje prodaje
- ✅ Storniranje (dok je KREIRANA)
- ✅ Pregled lagera
- ❌ Nema pristup kreiranju/izmeni proizvoda

### DOSTAVLJAC
- ❌ **NEMA pristup** lageru
- ❌ **NEMA pristup** cenama
- ❌ **NEMA pristup** narudžbenicama (osim dodeljenih)

---

## 6. DATUMI

### Automatsko Postavljanje

#### `datum_kreiranja`
- Automatski postavljeno pri INSERT-u (DEFAULT CURRENT_TIMESTAMP)
- **NE menja se** tokom životnog veka zapisa

#### `datum_izmene`
- Automatski ažurirano pri UPDATE-u (trigger `azuriraj_datum_izmene`)
- Primenjuje se na `proizvod` i `narudzbenica` tabele

#### `datum_zavrsetka`
- Postavlja se kada status postane završni:
  - `PRIMLJENA` (za NABAVKU)
  - `ZAVRSENA` (za PRODAJU)

#### `datum_storniranja`
- Postavlja se samo kod storniranja
- Čuva se kada je narudžbenica stornirana

---

## 7. SQL FUNKCIJE

### `kreiraj_narudzbenicu`
Kreira narudžbenicu sa stavkama i automatski:
- Kod PRODAJE: snapshot-uje `prodajna_cena` u stavku
- Računa ukupnu vrednost
- Postavlja `datum_kreiranja`

**Signature:**
```sql
kreiraj_narudzbenicu(
  p_tip tip_narudzbenice,
  p_kreirao_id INT,
  p_dobavljac_id INT DEFAULT NULL,
  p_dostavljac_id INT DEFAULT NULL,
  p_napomena TEXT DEFAULT NULL,
  p_stavke JSONB DEFAULT '[]'::jsonb
)
```

---

### `izmeni_status_narudzbenice_sa_lagerom`
Menja status narudžbenice i upravlja lagerom:
- Kod `PRIMLJENA`: povećava lager
- Kod `ZAVRSENA`: smanjuje lager (sa proverom)
- Kod `STORNIRANA`: samo menja status, ne dira lager

**Signature:**
```sql
izmeni_status_narudzbenice_sa_lagerom(
  p_id_narudzbenica INT,
  p_novi_status status_narudzbenice,
  p_razlog_storniranja TEXT DEFAULT NULL,
  p_stornirao_id INT DEFAULT NULL
)
```

---

## 8. TRANSAKCIJE

Sve operacije koje menjaju lager **obavezno** koriste SQL transakcije:

```sql
BEGIN;
  -- Provera zaliha
  -- Izmena statusa
  -- Ažuriranje lagera
COMMIT;
-- Ili ROLLBACK kod greške
```

---

## 9. TESTIRANJE

### Kreiranje proizvoda sa nabavnom i prodajnom cenom
```bash
curl -X POST http://localhost:3000/api/proizvodi \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "naziv": "Test Proizvod",
    "sifra": "TST001",
    "nabavna_cena": 100,
    "prodajna_cena": 150,
    "kolicina_na_lageru": 0,
    "minimalna_kolicina": 10,
    "jedinica_mere": "kom"
  }'
```

### Kreiranje nabavke
```bash
curl -X POST http://localhost:3000/api/narudzbenice \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tip": "NABAVKA",
    "dobavljac_id": 1,
    "stavke": [
      {"proizvod_id": 1, "kolicina": 100}
    ]
  }'
```

### Prijem nabavke (povećanje lagera)
```bash
curl -X PATCH http://localhost:3000/api/narudzbenice/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "PRIMLJENA"}'
```

### Kreiranje prodaje
```bash
curl -X POST http://localhost:3000/api/narudzbenice \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tip": "PRODAJA",
    "stavke": [
      {"proizvod_id": 1, "kolicina": 5}
    ]
  }'
```

### Završavanje prodaje (smanjenje lagera)
```bash
curl -X PATCH http://localhost:3000/api/narudzbenice/2/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ZAVRSENA"}'
```

### Storniranje narudžbenice
```bash
curl -X PATCH http://localhost:3000/api/narudzbenice/3/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "STORNIRANA",
    "razlog_storniranja": "Kupac otkazao"
  }'
```

### Pregled lagera
```bash
curl -X GET http://localhost:3000/api/lager \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 10. NAPOMENE ZA RAZVOJ

### Izmena nabavne cene
- `nabavna_cena` se postavlja **SAMO pri kreiranju** proizvoda
- PUT `/api/proizvodi/[id]` **NE SME** dozvoliti izmenu `nabavna_cena`
- Ovo je implementirano u backend-u

### Snapshot cena u stavkama
- Kod PRODAJE, `prodajna_cena` se snapshot-uje u stavku
- Kasnije izmene `prodajna_cena` proizvoda **NE utiču** na već kreirane stavke
- Ovo omogućava ispravnu istoriju cena

### Validacija prelaza statusa
- Frontend bi trebalo da koristi `VALID_TRANSITIONS` iz [types.ts](front/shop-scale-buddy/src/lib/types.ts#L86-L94)
- Backend takođe validira prelaze u SQL funkciji

### Optimizacija
- Kreiran indeks na `kolicina_na_lageru` za brže upite o stanju lagera
- Kreiran indeks na `stornirana` za filtriranje storniranih narudžbenica

---

## 11. BUDUĆA PROŠIRENJA (Opciono)

- [ ] Notifikacije kada `kolicina_na_lageru < minimalna_kolicina`
- [ ] Lager po lokacijama (ako postoji više skladišta)
- [ ] Rezervacija zaliha (kada se kreira PRODAJA, pre nego što se završi)
- [ ] Izvještaji o prometu (po proizvodu, periodu, tipu)
- [ ] Automatsko kreiranje nabavki kada zalihe padnu ispod minimalne

---

## 12. CHANGELOG

### v2.0.0 (2026-02-16)
- ✅ Dodate kolone u tabele `proizvod`, `narudzbenica`, `stavka_narudzbenice`
- ✅ Dodati novi statusi: `PRIMLJENA`, `STORNIRANA`
- ✅ Kreiran API endpoint `GET /api/lager`
- ✅ Ažuriran API endpoint `POST /api/narudzbenice`
- ✅ Kreiran API endpoint `PATCH /api/narudzbenice/[id]/status`
- ✅ Ažurirani TypeScript tipovi
- ✅ Implementirane SQL funkcije za lager logiku
- ✅ Dodati triggeri za automatsko ažuriranje `datum_izmene`
- ✅ Implementiran RBAC za sve rute
- ✅ Validacija poslovnih pravila

---

## 13. KONTAKT I PODRŠKA

Za pitanja i probleme, kontaktirajte razvojni tim ili kreirajte issue u repository-ju.

---

**Verzija dokumentacije:** 1.0  
**Datum:** 16. februar 2026  
**Status:** ✅ Implementirano i testirano
