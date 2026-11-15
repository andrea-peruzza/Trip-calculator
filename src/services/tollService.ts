import { VehicleType } from '../types';
import { CASELLI_ITALIA, CaselloInfo } from '../data/tollBooths';

export interface TollEstimate {
  tollCost: number;
  tollKm: number;
  isExactPair: boolean;
  notes: string;
  entryBooth?: string;
  exitBooth?: string;
}

// Calcola distanza in km tra due coordinate GPS (formula Haversine)
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raggio Terra in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Trova il casello più vicino ad un punto geografico entro una certa soglia di tolleranza (es. 15 km)
export function findNearestBooth(coord: [number, number], maxDistKm: number = 15): CaselloInfo | null {
  let closest: CaselloInfo | null = null;
  let minDist = maxDistKm;

  for (const booth of CASELLI_ITALIA) {
    const d = getDistanceKm(coord[0], coord[1], booth.lat, booth.lng);
    if (d < minDist) {
      minDist = d;
      closest = booth;
    }
  }

  return closest;
}

// Coppie di caselli e tratte dirette frequenti con tariffa ufficiale di riferimento (Classe A)
const OFFICIAL_BOOTH_PAIRS: Record<string, number> = {
  // A1
  'a1-mi-sud:a1-bologna-casalecchio': 15.30,
  'a1-bologna-casalecchio:a1-mi-sud': 15.30,
  'a1-mi-sud:a1-firenze-nord': 22.00,
  'a1-firenze-nord:a1-mi-sud': 22.00,
  'a1-mi-sud:a1-roma-nord': 42.40,
  'a1-roma-nord:a1-mi-sud': 42.40,
  'a1-mi-sud:a1-napoli-nord': 58.00,
  'a1-napoli-nord:a1-mi-sud': 58.00,
  'a1-bologna-casalecchio:a1-firenze-nord': 6.70,
  'a1-firenze-nord:a1-bologna-casalecchio': 6.70,
  'a1-firenze-sud:a1-roma-nord': 19.10,
  'a1-roma-nord:a1-firenze-sud': 19.10,
  'a1-roma-sud:a1-napoli-nord': 15.60,
  'a1-napoli-nord:a1-roma-sud': 15.60,
  'a1-mi-sud:a1-parma': 8.30,
  'a1-parma:a1-mi-sud': 8.30,
  'a1-mi-sud:a1-reggio-emilia': 10.50,
  'a1-reggio-emilia:a1-mi-sud': 10.50,
  'a1-mi-sud:a1-modena-nord': 12.10,
  'a1-modena-nord:a1-mi-sud': 12.10,

  // A4
  'a4-torino-ronchi:a4-milano-ghisolfa': 17.50,
  'a4-milano-ghisolfa:a4-torino-ronchi': 17.50,
  'a4-milano-est:a4-brescia-centro': 7.40,
  'a4-brescia-centro:a4-milano-est': 7.40,
  'a4-milano-est:a4-verona-sud': 11.20,
  'a4-verona-sud:a4-milano-est': 11.20,
  'a4-milano-est:a4-padova-est': 17.10,
  'a4-padova-est:a4-milano-est': 17.10,
  'a4-milano-est:a4-venezia-mestre': 21.50,
  'a4-venezia-mestre:a4-milano-est': 21.50,
  'a4-verona-sud:a4-venezia-mestre': 10.30,
  'a4-venezia-mestre:a4-verona-sud': 10.30,
  'a4-padova-est:a4-venezia-mestre': 3.20,
  'a4-venezia-mestre:a4-padova-est': 3.20,
  'a4-venezia-est:a4-trieste-lisert': 11.50,
  'a4-venezia-est:a4-monfalcone-est': 11.50,

  // A23 / A4 / A28 Tratta Udine Sud <-> Conegliano
  'a23-udine-sud:a28-conegliano': 9.40,
  'a28-conegliano:a23-udine-sud': 9.40,
  'a23-udine-sud:a27-conegliano': 9.40,
  'a27-conegliano:a23-udine-sud': 9.40,
  'a23-udine-sud:a4-venezia-est': 8.90,
  'a4-venezia-est:a23-udine-sud': 8.90,
  'a23-udine-nord:a28-conegliano': 10.40,
  'a28-conegliano:a23-udine-nord': 10.40,

  // A14
  'a14-bologna-san-lazzaro:a14-rimini-sud': 8.60,
  'a14-rimini-sud:a14-bologna-san-lazzaro': 8.60,
  'a14-bologna-san-lazzaro:a14-ancona-nord': 15.80,
  'a14-ancona-nord:a14-bologna-san-lazzaro': 15.80,
  'a14-bologna-san-lazzaro:a14-pescara-ovest': 26.50,
  'a14-pescara-ovest:a14-bologna-san-lazzaro': 26.50,
  'a14-bologna-san-lazzaro:a14-bari-nord': 49.30,
  'a14-bari-nord:a14-bologna-san-lazzaro': 49.30,

  // A22
  'a22-verona-nord:a22-brennero': 17.90,
  'a22-brennero:a22-verona-nord': 17.90,
  'a22-modena-nord:a22-brennero': 25.20,
  'a22-brennero:a22-modena-nord': 25.20,
  'a22-verona-nord:a22-trento-nord': 7.10,
  'a22-trento-nord:a22-verona-nord': 7.10,
  'a22-verona-nord:a22-bolzano-sud': 11.20,
  'a22-bolzano-sud:a22-verona-nord': 11.20,
};

/**
 * Calcolo del pedaggio autostradale preciso basato sull'effettivo casello di ingresso e casello di uscita.
 */
export function calculatePreciseToll(
  entryBooth: CaselloInfo | null,
  exitBooth: CaselloInfo | null,
  highwayKm: number,
  vehicleType: VehicleType,
  hasMotoDiscount: boolean = false
): TollEstimate {
  if (highwayKm < 3) {
    return {
      tollCost: 0,
      tollKm: 0,
      isExactPair: false,
      notes: 'Nessun pedaggio (viabilità ordinaria)',
    };
  }

  // 1. Se entrambi i caselli sono stati identificati lungo il tragitto
  if (entryBooth && exitBooth && entryBooth.id !== exitBooth.id) {
    const pairKey = `${entryBooth.id}:${exitBooth.id}`;
    const reverseKey = `${exitBooth.id}:${entryBooth.id}`;

    let exactPrice = OFFICIAL_BOOTH_PAIRS[pairKey] || OFFICIAL_BOOTH_PAIRS[reverseKey];

    // Se non presente nella tabella diretta, calcola la tariffa basata sulla distanza chilometrica reale tra i caselli
    if (!exactPrice) {
      let boothKm = highwayKm;
      if (entryBooth.kmProgressivo !== undefined && exitBooth.kmProgressivo !== undefined && entryBooth.highway === exitBooth.highway) {
        boothKm = Math.abs(exitBooth.kmProgressivo - entryBooth.kmProgressivo);
      }
      // Tariffa chilometrica ufficiale italiana media (con IVA 22% e arrotondamento ai 10 centesimi come da regolamento ART)
      exactPrice = Math.round(boothKm * 0.083 * 10) / 10;
    }

    if (vehicleType === 'motorcycle' && hasMotoDiscount) {
      exactPrice = Math.round(exactPrice * 0.7 * 10) / 10;
    }

    return {
      tollCost: exactPrice,
      tollKm: Math.round(highwayKm),
      isExactPair: true,
      entryBooth: entryBooth.name,
      exitBooth: exitBooth.name,
      notes: `Casello Ingresso: ${entryBooth.name} ➔ Casello Uscita: ${exitBooth.name}${
        vehicleType === 'motorcycle' && hasMotoDiscount ? ' (con sconto moto 30%)' : ''
      }`,
    };
  }

  // 2. Se è stato rilevato un solo casello (es. barriera fissa)
  if (entryBooth || exitBooth) {
    const singleBooth = (entryBooth || exitBooth)!;
    let toll = Math.round(highwayKm * 0.083 * 10) / 10;
    if (vehicleType === 'motorcycle' && hasMotoDiscount) {
      toll = Math.round(toll * 0.7 * 10) / 10;
    }
    return {
      tollCost: toll,
      tollKm: Math.round(highwayKm),
      isExactPair: false,
      entryBooth: entryBooth?.name,
      exitBooth: exitBooth?.name,
      notes: `Tratta con casello ${singleBooth.name} (~${Math.round(highwayKm)} km)`,
    };
  }

  // 3. Stima chilometrica standard se non sono stati agganciati caselli noti
  let standardToll = Math.round(highwayKm * 0.083 * 10) / 10;
  if (vehicleType === 'motorcycle' && hasMotoDiscount) {
    standardToll = Math.round(standardToll * 0.7 * 10) / 10;
  }

  return {
    tollCost: standardToll,
    tollKm: Math.round(highwayKm),
    isExactPair: false,
    notes: `Stima chilometrica su ${Math.round(highwayKm)} km di autostrada a pedaggio`,
  };
}

/**
 * Funzione legacy mantenuta per compatibilità
 */
export function calculateTollCost(
  _originCity: string,
  _destinationCity: string,
  _totalDistanceKm: number,
  highwayKm: number,
  vehicleType: VehicleType,
  hasMotoDiscount: boolean = false
): TollEstimate {
  return calculatePreciseToll(null, null, highwayKm, vehicleType, hasMotoDiscount);
}
