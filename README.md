# Trip Calculator 🚗🏍️💨

Un calcolatore avanzato e moderno per stimare i costi reali di un viaggio su strada (in **automobile**, **motocicletta** o **furgone**), calcolando sia la spesa di carburante/ricarica elettrica sia i **pedaggi autostradali**, con supporto alla divisione delle spese tra passeggeri.

---

## 💡 Come funziona l'approccio 100% Gratuito (Zero costi API)

Molti servizi commerciali (Google Maps Routes API, TollGuru) richiedono carte di credito o diventano a pagamento superate quote minime. Questo progetto adotta un'architettura **100% aperta, gratuita e senza chiavi API a pagamento**:

1. **Geocoding & Autocomplete:**
   - [Photon by Komoot](https://photon.komoot.io/) & [Nominatim OpenStreetMap](https://nominatim.openstreetmap.org/): ricerca istantanea delle località, comuni e indirizzi in Italia ed Europa senza registrazione.
2. **Routing & Distanza:**
   - [OSRM (Open Source Routing Machine)](https://project-osrm.org/): calcolo dell'itinerario ottimale, distanza chilometrica precisa, tempo di percorrenza e traccia geografica per la mappa.
3. **Calcolo Pedaggi Caselli (Autostrade Italiane):**
   - **Analisi dei tratti autostradali:** L'algoritmo ispeziona gli step dell'itinerario OSRM per isolare i chilometri effettivi percorsi sulla rete a pedaggio (`A1`, `A4`, `A14`, ecc.) separandoli da statali (SS), provinciali (SP) e tangenziali/superstrade gratuite.
   - **Database tratte frequenti:** Matrice di tariffe ufficiali esatte per le principali tratte casello-casello italiane (es. Milano-Roma, Bologna-Firenze, Torino-Milano, ecc.).
   - **Algoritmo deterministico ART (Autorità di Regolazione dei Trasporti):** Per tutte le altre tratte, applica la formula ufficiale italiana:
     $$\text{Pedaggio} = (\text{km autostrada} \times \text{tariffa base km}) \times 1.22 \text{ (IVA)}$$
     con arrotondamento ai 10 centesimi di euro.
   - **Riconoscimento tratte gratuite:** Riconosce autostrade senza pedaggio come la A2 (Salerno-Reggio Calabria), le autostrade della Sicilia (A19, A29) e il Grande Raccordo Anulare (GRA).
   - **Sconto Moto 30%:** Include il toggle per lo sconto ufficiale riservato ai motociclisti con Telepass/UnipolMove Moto.
4. **Prezzi dei Carburanti:**
   - Benchmark basato sulle medie nazionali dell'Osservaprezzi Carburanti del **MIMIT** (Ministero delle Imprese e del Made in Italy) per Benzina, Diesel, GPL e Metano.
   - Tariffe medie per veicoli elettrici (ricarica domestica AC vs ricarica ultrarapida autostradale DC HPC).
   - Campi modificabili in tempo reale dall'utente.

---

## 🛠️ Architettura del Progetto

```
trip-calculator/
├── src/
│   ├── components/
│   │   ├── CostSummary.tsx         # Card riepilogo costi, divisione passeggeri, A/R, CO2
│   │   ├── LocationInput.tsx       # Input autocomplete con ricerca geocoding debounced
│   │   ├── Map.tsx                 # Mappa interattiva Leaflet + OpenStreetMap
│   │   └── VehicleSelector.tsx     # Selezione mezzo (Auto/Moto), consumi (km/l o l/100km), bifuel
│   ├── data/
│   │   └── vehiclePresets.ts       # Preset per auto e moto con consumi reali e WLTP
│   ├── services/
│   │   ├── fuelService.ts          # Calcolo carburante, conversioni km/l, stime emissioni CO2
│   │   ├── geocodingService.ts     # Client Photon / Nominatim OpenStreetMap
│   │   ├── routingService.ts       # Client OSRM (distanza, tempo, coordinate, km autostrada)
│   │   └── tollService.ts          # Calcolatore deterministico pedaggi italiani e tratte note
│   ├── types/
│   │   └── index.ts                # Definizioni TypeScript
│   ├── App.tsx                     # Layout principale dell'applicazione
│   ├── index.css                   # Stili Tailwind CSS
│   └── main.tsx                    # Entry point React
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Come avviare il progetto in locale

### Prerequisiti
- [Node.js](https://nodejs.org/) (versione 18 o superiore)

### Installazione e Avvio
1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```
3. Compila per la produzione:
   ```bash
   npm run build
   ```

---

## 📱 Trasformazione in PWA (Progressive Web App)
Il progetto è basato su Vite e Tailwind CSS, predisposto per essere pacchettizzato come PWA (installabile su iOS e Android direttamente dal browser) aggiungendo `vite-plugin-pwa` e registrando il service worker per il caching offline.
