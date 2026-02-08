# Tehnička dokumentacija - Sistem za upravljanje lagером

## 📐 Arhitektura

```
┌─────────────────────────────────────────────────────────┐
│                 Web Browser (Frontend)                  │
│                                                         │
│  - React 19 komponente (UI/UX)                        │
│  - Tailwind CSS (styling)                             │
│  - Next.js App Router (routing)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP/REST API
                     │
┌─────────────────────▼────────────────────────────────────┐
│             Next.js Server (Backend)                    │
│                                                         │
│  - API Routes (/api/...)                              │
│  - JWT autentifikacija (middleware)                   │
│  - Business logic                                     │
│  - Database queries                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ pg driver (SQL)
                     │
┌────────────────────▼────────────────────────────────────┐
│         PostgreSQL Database (localhost:5432)            │
│                                                        │
│  - Korisnik (users)                                  │
│  - Kategorija (categories)                          │
│  - Dobavljač (suppliers)                            │
│  - Proizvod (products)                              │
│  - Narudžbenica (orders)                            │
│  - Stavka narudžbenice (order items)                │
└────────────────────────────────────────────────────────┘
```

## 📁 Struktura projekta

```
app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts          # JWT login endpoint
│   │   ├── register/route.ts       # User registration
│   │   └── me/route.ts             # Current user info
│   ├── Dashboard/route.ts          # Dashboard statistics
│   ├── dobavljaci/route.ts         # Suppliers CRUD
│   ├── kategorije/route.ts         # Categories CRUD
│   ├── proizvodi/
│   │   ├── route.ts                # Products CRUD
│   │   └── [id]/route.ts           # Single product detail
│   └── narudzbenice/
│       ├── route.ts                # Orders CRUD
│       └── [id]/route.ts           # Single order detail
│
├── components/
│   ├── Navbar.tsx                  # Navigation header
│   ├── Input.tsx                   # Reusable input field
│   ├── Button.tsx                  # Reusable button
│   └── ProductCard.tsx             # Product display card
│
├── dashboard/page.tsx              # Dashboard page
├── dobavljaci/page.tsx             # Suppliers page
├── login/page.tsx                  # Login page
├── narudzbenice/
│   ├── page.tsx                    # Orders list
│   ├── nova/page.tsx               # Create order
│   └── [id]/page.tsx               # Order detail
├── proizvodi/
│   ├── page.tsx                    # Products list
│   ├── novo/page.tsx               # Create product
│   ├── lista/page.tsx              # Alternative product list
│   └── [id]/page.tsx               # Product detail
│
├── layout.tsx                      # Root layout
├── page.tsx                        # Home page
└── globals.css                     # Global styles

lib/
├── api.ts                          # ApiService client
├── auth.ts                         # JWT verification utilities
└── db.ts                           # Database connection pool

migrations/
├── 01-05_legacy.sql               # Old migrations
├── 06_complete_schema.sql         # Complete schema setup
└── 07_seed_data.sql               # Test data

middleware.ts                       # Route protection middleware
```

## 🔐 Autentifikacija (JWT Flow)

```
1. Korisnik unese email i lozinku
   ↓
2. Frontend šalje POST /api/auth/login
   ↓
3. Backend proverava kredencijale:
   - Pronalazi korisnika po email-u
   - Upoređuje unetu lozinku sa hešom iz baze (bcryptjs)
   ↓
4. Ako je validno:
   - Kreira JWT token
   - Postavlja token u HTTP-only kolačić
   - Vraća token i user info
   ↓
5. Frontend čuva token u localStorage (dodatna kopija)
   ↓
6. Za sve buduće zahteve:
   - Token se prosleđuje u Authorization header
   - Ili se čita iz kolačića
   ↓
7. Middleware provera:
   - Ako nema tokena → redirekt na /login
   - Ako je token istekao/nevažeći → redirekt na /login
   - Ako je validan → dozvoli pristup ruti
```

## 📊 Entity Relationship Diagram

```
Korisnik
├── id_korisnik (PK)
├── username (UNIQUE)
├── email (UNIQUE)
├── lozinka_hash
├── uloga (ENUM: ADMIN, EMPLOYEE)
└── aktivan

Kategorija
├── id_kategorija (PK)
├── naziv (UNIQUE)
├── opis
└── aktivan

Dobavljač
├── id_dobavljac (PK)
├── naziv
├── email
├── telefon
├── adresa
└── aktivan

Proizvod
├── id_proizvod (PK)
├── naziv
├── opis
├── sifra (UNIQUE)
├── cena_nabavke
├── cena_prodaje
├── kolicina_na_lageru
├── minimalna_kolicina
├── id_kategorija (FK)
├── id_dobavljac (FK)
└── aktivan

Narudžbenica
├── id_narudzbenica (PK)
├── id_dobavljac (FK)
├── id_korisnik (FK)
├── status (ENUM: DRAFT, SENT, RECEIVED)
├── ukupna_cena
├── napomene
├── datum_kreiranja
├── datum_slanja
└── datum_prijema

Stavka_Narudžbenice
├── id_stavka (PK)
├── id_narudzbenica (FK)
├── id_proizvod (FK)
├── kolicina
├── cena_po_komadu
└── datum_kreiranja
```

## 🔄 Tok rada za narudžbenice

```
1. Kreiranje narudžbenice
   - Status: DRAFT
   - Korisnik dodaje stavke (proizvode)
   - Nema ažuriranja lagera

2. Slanje
   - Status: DRAFT → SENT
   - datum_slanja se postavlja
   - Narudžbenica je "u pricanju"

3. Primanje
   - Status: SENT → RECEIVED
   - datum_prijema se postavlja
   - AUTOMATSKI: Ažurira se kolicina_na_lageru svakog proizvoda
   
   SQL:
   UPDATE proizvod 
   SET kolicina_na_lageru = kolicina_na_lageru + stavka.kolicina 
   WHERE id_proizvod = stavka.id_proizvod

4. Statusi su nepovratni!
   - DRAFT može biti obrisan
   - SENT i RECEIVED se ne mogu vratiti u prethodno stanje
```

## 🛡️ Sigurnost

### 1. SQL Injection zaštita
```typescript
// ✅ SIGURNO - Parameterizovani upiti
const result = await query(
  'SELECT * FROM korisnik WHERE email = $1',
  [email]  // Parametar, ne string interpolacija
);

// ❌ OPASNO - String interpolacija (IZBJEGAVAŠ!)
const result = await query(
  `SELECT * FROM korisnik WHERE email = '${email}'`
);
```

### 2. Lozinka heširanje
```typescript
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
// Čuva se: $2a$10$... (nikad obična lozinka!)
```

### 3. JWT autentifikacija
```typescript
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
// Token istice nakon 24 sata
```

### 4. HTTP-Only kolačići
```typescript
response.cookies.set('token', token, {
  httpOnly: true,     // JavaScript ne može pristupiti
  secure: true,       // Samo HTTPS
  sameSite: 'strict'  // CSRF zaštita
});
```

### 5. CORS i Third-party zaštita
- Middleware provera tokena na svakom zahtevu
- Validacija JWT potpisa
- Redirekt na login ako je token nevažeći

## 📈 Performanse i optimizacije

### Database indeksi
```sql
CREATE INDEX idx_proizvod_kategorija ON proizvod(id_kategorija);
CREATE INDEX idx_proizvod_dobavljac ON proizvod(id_dobavljac);
CREATE INDEX idx_narudzbenica_status ON narudzbenica(status);
CREATE INDEX idx_stavka_narudzbenica ON stavka_narudzbenice(id_narudzbenica);
```

### Query optimizacije
- LEFT JOINs za povezane podatke
- SELECT samo potrebnih kolona
- Pagination za velike setove podataka (implementacija je opciona)

### Frontend optimizacije
- Server-side rendering (Next.js SSR)
- Image optimization (Next.js Image component)
- Code splitting sa dynamic imports
- Tailwind CSS purge (samo korišćeni CSS se učitava)

## 🚀 Deployment (Production)

### Vercel (preporučeno za Next.js)
```bash
npm install -g vercel
vercel
```
- Automatski build i deploy
- Serverless funkcije
- CDN za statički sadržaj

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t inventory-app .
docker run -p 3000:3000 inventory-app
```

### Environment varijable na produkciji
```env
DATABASE_URL=postgresql://user:password@prod-db.com:5432/iteh_baza
JWT_SECRET=very-long-random-secret-key
NODE_ENV=production
```

## 🔌 API Ratelimiting (opciono)

Ako trebaš zaštitu od brute-force napada:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 100 // 100 zahteva po IP adresi
});

app.use('/api/', limiter);
```

## 📝 Logging i monitoring

Za production preporučujem:
- **Winston** za logging
- **Sentry** za error tracking
- **DataDog** ili **New Relic** za monitoring

## 🧪 Testiranje (opciono)

```bash
npm install --save-dev jest @testing-library/react
```

## 📚 Dodatne resurse

- Next.js dokumentacija: https://nextjs.org/docs
- PostgreSQL dokumentacija: https://www.postgresql.org/docs/
- JWT.io: https://jwt.io
- Tailwind CSS: https://tailwindcss.com/docs

---

**Verzija:** 1.0.0  
**Poslednja ažuriranja:** Februar 2025
