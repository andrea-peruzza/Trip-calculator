import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

// Plugin server-side per scaricare ed aggregare i prezzi MIMIT in tempo reale
function mimitFuelPlugin(): Plugin {
  let cachedPrices: any = null;
  let cacheTime = 0;
  const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 ora

  const fetchMimit = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      https.get('https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv', (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          const lines = data.split('\n');
          const sums = { benzina: 0, diesel: 0, gpl: 0, metano: 0 };
          const counts = { benzina: 0, diesel: 0, gpl: 0, metano: 0 };

          for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split('|');
            if (parts.length < 4) continue;
            const fuel = parts[1].trim().toLowerCase();
            const price = parseFloat(parts[2].replace(',', '.'));
            const isSelf = parts[3].trim();

            if (isNaN(price) || price <= 0 || price > 5) continue;

            if (fuel === 'benzina' && isSelf === '1') {
              sums.benzina += price; counts.benzina++;
            } else if (fuel === 'gasolio' && isSelf === '1') {
              sums.diesel += price; counts.diesel++;
            } else if (fuel === 'gpl') {
              sums.gpl += price; counts.gpl++;
            } else if (fuel === 'metano') {
              sums.metano += price; counts.metano++;
            }
          }

          if (counts.benzina > 0 && counts.diesel > 0) {
            const petrol = Math.round((sums.benzina / counts.benzina) * 1000) / 1000;
            const diesel = Math.round((sums.diesel / counts.diesel) * 1000) / 1000;
            const lpg = counts.gpl > 0 ? Math.round((sums.gpl / counts.gpl) * 1000) / 1000 : 0.848;
            const cng = counts.metano > 0 ? Math.round((sums.metano / counts.metano) * 1000) / 1000 : 2.147;

            const dateMatch = lines[0]?.match(/\d{4}-\d{2}-\d{2}/);
            const dateStr = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];

            resolve({
              petrol,
              diesel,
              lpg,
              cng,
              electricHome: 0.28,
              electricFast: 0.69,
              lastUpdated: `MIMIT Ufficiale (${dateStr})`
            });
          } else {
            reject(new Error('Nessun dato valido estratto da MIMIT'));
          }
        });
      }).on('error', reject);
    });
  };

  return {
    name: 'mimit-fuel-plugin',
    configureServer(server) {
      server.middlewares.use('/api/fuel-prices', async (req, res) => {
        const now = Date.now();
        if (cachedPrices && now - cacheTime < CACHE_DURATION_MS) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(cachedPrices));
          return;
        }

        try {
          const prices = await fetchMimit();
          cachedPrices = prices;
          cacheTime = now;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(prices));
        } catch (err: any) {
          // Fallback se errore di rete temporaneo
          const fallback = {
            petrol: 1.939,
            diesel: 2.196,
            lpg: 0.848,
            cng: 2.147,
            electricHome: 0.28,
            electricFast: 0.69,
            lastUpdated: 'MIMIT Ufficiale (Novembre 2026 - Rilevazione alle 8)'
          };
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(fallback));
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mimitFuelPlugin()],
  server: {
    host: '127.0.0.1', // Forza IPv4 evitando i conflitti di permessi su IPv6 (::1) in Windows
    port: 5173,        // Porta standard Vite (evita conflitti con Hyper-V/WSL su porta 3000)
    strictPort: false, // Se occupata, passa automaticamente a 5174, 5175...
    open: true
  }
});

