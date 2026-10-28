# Immagine leggera Node.js Alpine
FROM node:20-alpine

WORKDIR /app

# Copia dei descrittori di pacchetto
COPY package*.json ./

# Installazione dipendenze
RUN npm install

# Copia del codice sorgente
COPY . .

# Esponi porta dev server di Vite
EXPOSE 5173

# Avvia server di sviluppo con binding su 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
