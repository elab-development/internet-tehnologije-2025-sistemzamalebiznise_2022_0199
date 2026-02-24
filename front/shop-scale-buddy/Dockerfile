FROM node:22-alpine

WORKDIR /app

# Kopiranje fajlova za instalaciju zavisnosti
COPY package.json ./

# Instalacija zavisnosti
RUN npm install

# Kopiranje izvornog koda
COPY . .

# Izlaganje porta
EXPOSE 8080

# Pokretanje Vite dev servera
CMD ["npm", "run", "dev"]
