import { VehicleType } from '../types';

/**
 * Servizio di Calcolo Pedaggi 100% GRATUITO.
 * 
 * In Italia il pedaggio autostradale è regolamentato per legge (ART) ed è deterministico:
 * Pedaggio = (km_autostrada * tariffa_base) * 1.22 (IVA) con arrotondamento ai 10 centesimi di euro.
 * 
 * Include:
 * 1. Database tariffe esatte per i corridoi autostradali più frequenti
 * 2. Algoritmo chilometrico per qualsiasi altra tratta
 * 3. Riconoscimento autostrade e superstrade gratuite (A2 Salerno-RC, GRA Roma, SS 4 corsie, ecc.)
 * 4. Gestione sconti speciali (es. Sconto Telepass Moto 30%)
 */

export interface TollEstimate {
  tollCost: number;
  tollKm: number;
  isExactPair: boolean;
  notes: string;
}

// Coppie di caselli e città principali con tariffe ufficiali di riferimento (Classe A - 2 assi)
const TOLL_DATABASE: Record<string, number> = {
  // Tratte A1 / Nord-Sud
  'milano-roma': 42.40,
  'roma-milano': 42.40,
  'milano-bologna': 15.30,
  'bologna-milano': 15.30,
  'milano-firenze': 21.80,
  'firenze-milano': 21.80,
  'bologna-firenze': 6.50,
  'firenze-bologna': 6.50,
  'firenze-roma': 18.90,
  'roma-firenze': 18.90,
  'roma-napoli': 15.60,
  'napoli-roma': 15.60,
  'milano-napoli': 58.00,
  'napoli-milano': 58.00,

  // Tratte A4 / Est-Ovest
  'torino-milano': 17.50,
  'milano-torino': 17.50,
  'milano-venezia': 21.50,
  'venezia-milano': 21.50,
  'milano-verona': 11.20,
  'verona-milano': 11.20,
  'verona-venezia': 10.30,
  'venezia-verona': 10.30,
  'milano-brescia': 7.40,
  'brescia-milano': 7.40,

  // Tratte A14 / Adriatica
  'bologna-ancona': 15.80,
  'ancona-bologna': 15.80,
  'bologna-bari': 49.30,
  'bari-bologna': 49.30,
  'bologna-rimini': 8.60,
  'rimini-bologna': 8.60,

  // Tratte Liguria e Nord
  'milano-genova': 10.60,
  'genova-milano': 10.60,
  'torino-genova': 12.40,
  'genova-torino': 12.40,
};

// Autostrade note che sono storicamente e legalmente GRATUITE in Italia
export const FREE_MOTORWAYS = [
  'A2', // Salerno - Reggio Calabria (Autostrada del Mediterraneo)
  'A19', // Palermo - Catania (in gran parte libera)
  'A29', // Palermo - Mazara del Vallo
  'GRA', // Grande Raccordo Anulare Roma
  'A90', // Altra denominazione GRA
  'A91', // Roma - Fiumicino
  'Tangenziale di Catania',
];

/**
 * Calcola o stima il pedaggio per una tratta
 */
export function calculateTollCost(
  originCity: string,
  destinationCity: string,
  totalDistanceKm: number,
  highwayKm: number,
  vehicleType: VehicleType,
  hasMotoDiscount: boolean = false
): TollEstimate {
  // 1. Pulizia delle stringhe di città per il lookup nel database tariffe esatte
  const cleanCity = (c: string) => c.toLowerCase().trim().replace(/^(comune di|città di)\s+/i, '');
  const from = cleanCity(originCity);
  const to = cleanCity(destinationCity);
  const lookupKey = `${from}-${to}`;

  if (TOLL_DATABASE[lookupKey]) {
    let baseToll = TOLL_DATABASE[lookupKey];
    // Sconto moto 30% (Telepass / UnipolMove Moto)
    if (vehicleType === 'motorcycle' && hasMotoDiscount) {
      baseToll = Math.round(baseToll * 0.7 * 10) / 10;
      return {
        tollCost: baseToll,
        tollKm: Math.round(highwayKm || totalDistanceKm * 0.8),
        isExactPair: true,
        notes: `Tariffa ufficiale tratta (con sconto Telepass Moto 30%)`,
      };
    }
    return {
      tollCost: baseToll,
      tollKm: Math.round(highwayKm || totalDistanceKm * 0.8),
      isExactPair: true,
      notes: `Tariffa ufficiale tratta (${originCity} ➔ ${destinationCity})`,
    };
  }

  // 2. Se i km di autostrada sono 0 o trascurabili, pedaggio = 0
  if (highwayKm < 5) {
    return {
      tollCost: 0,
      tollKm: 0,
      isExactPair: false,
      notes: 'Percorso su viabilità ordinaria o superstrade non a pedaggio',
    };
  }

  // 3. Verifica se la tratta è quasi interamente coperta da autostrada gratuita (es. A2 Salerno-RC)
  const isSouthFreeHighway = (from.includes('salerno') || from.includes('cosenza') || from.includes('reggio calabria')) &&
                             (to.includes('salerno') || to.includes('cosenza') || to.includes('reggio calabria'));

  if (isSouthFreeHighway) {
    return {
      tollCost: 0,
      tollKm: highwayKm,
      isExactPair: false,
      notes: 'Tratta su A2 Autostrada del Mediterraneo (senza pedaggio)',
    };
  }

  // 4. Algoritmo deterministico basato sulla media chilometrica italiana ART
  // Media italiana: ~0.082 €/km (IVA 22% inclusa per Classe A)
  // Per tratte appenniniche/alpine con molti viadotti e gallerie si attesta sui 0.090 €/km
  const ratePerKm = 0.083;
  let estimatedToll = highwayKm * ratePerKm;

  // Arrotondamento ai 10 centesimi di euro (norma di legge italiana per i caselli)
  estimatedToll = Math.round(estimatedToll * 10) / 10;

  if (vehicleType === 'motorcycle' && hasMotoDiscount) {
    estimatedToll = Math.round(estimatedToll * 0.7 * 10) / 10;
  }

  return {
    tollCost: estimatedToll,
    tollKm: Math.round(highwayKm),
    isExactPair: false,
    notes: `Stima chilometrica su circa ${Math.round(highwayKm)} km di autostrada a pedaggio (~0,083 €/km)`,
  };
}
