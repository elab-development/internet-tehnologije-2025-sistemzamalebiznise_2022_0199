
FROM node:22-alpine AS deps

WORKDIR /app

# Kopiranje fajlova za instalaciju zavisnosti
COPY package.json package-lock.json* ./

# Instalacija produkcijskih zavisnosti
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

# Kopiranje zavisnosti iz prethodne faze
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Postavljanje varijabli okruzenja za build
ENV NEXT_TELEMETRY_DISABLED=1

# Kreiranje public foldera ako ne postoji
RUN mkdir -p public

# Buildovanje Next.js aplikacije (standalone rezim)
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

# Postavljanje produkcijskog okruzenja
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Kreiranje korisnika za bezbednost (ne pokrecemo kao root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiranje statickih fajlova
COPY --from=builder /app/public ./public

# Kreiranje direktorijuma za Next.js kes
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Kopiranje standalone izlaza i statickih resursa
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prebacivanje na neprivilegovanog korisnika
USER nextjs

# Izlaganje porta
EXPOSE 3000

# Postavljanje hostname-a za slusanje na svim interfejsima
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Pokretanje aplikacije
CMD ["node", "server.js"]
