import { ConsumptionUnit, FuelPrices, FuelType } from '../types';

/**
 * Prezzi medi nazionali ufficiali di riferimento (Ministero delle Imprese e del Made in Italy MIMIT).
 * Rilevazione ufficiale media nazionale giornaliera calcolata direttamente dall'estrazione ufficiale MIMIT (prezzo_alle_8.csv):
 * - Benzina: modalità Self-Service
 * - Gasolio: modalità Self-Service
 * - GPL: modalità Servito / Prezzo Pompa
 * - Metano: modalità Servito / Prezzo Pompa (€/kg)
 */
export const DEFAULT_FUEL_PRICES: FuelPrices = {
  petrol: 1.939,        // €/L medio nazionale Self MIMIT
  diesel: 2.196,        // €/L medio nazionale Self MIMIT
  lpg: 0.848,           // €/L medio nazionale MIMIT
  cng: 2.147,           // €/kg medio nazionale MIMIT
  electricHome: 0.28,   // €/kWh (tariffa domestica media italiana ARERA)
  electricFast: 0.69,   // €/kWh (colonnine Fast autostradali tipo Ionity/FreeToX)
  lastUpdated: 'MIMIT Ufficiale (Rilevazione giornaliera ore 8:00)',
};

// Cache in memoria lato client per evitare chiamate ripetute durante la stessa sessione
let clientCachedPrices: FuelPrices | null = null;
let lastFetchTimestamp = 0;
const CLIENT_CACHE_TTL = 30 * 60 * 1000; // 30 minuti

/**
 * Recupera in tempo reale le medie nazionali aggiornate dei carburanti direttamente da MIMIT.
 * Se la chiamata fallisce o va in timeout, restituisce la rilevazione aggiornata DEFAULT_FUEL_PRICES.
 */
export async function fetchRealTimeFuelPrices(): Promise<FuelPrices> {
  const now = Date.now();
  if (clientCachedPrices && now - lastFetchTimestamp < CLIENT_CACHE_TTL) {
    return clientCachedPrices;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('/api/fuel-prices', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.petrol === 'number' && data.petrol > 0) {
        clientCachedPrices = {
          petrol: data.petrol,
          diesel: data.diesel,
          lpg: data.lpg,
          cng: data.cng,
          electricHome: data.electricHome ?? DEFAULT_FUEL_PRICES.electricHome,
          electricFast: data.electricFast ?? DEFAULT_FUEL_PRICES.electricFast,
          lastUpdated: data.lastUpdated ?? DEFAULT_FUEL_PRICES.lastUpdated
        };
        lastFetchTimestamp = now;
        return clientCachedPrices;
      }
    }
  } catch (err) {
    console.warn('Impossibile contattare endpoint prezzi MIMIT in tempo reale, uso valori MIMIT predefiniti:', err);
  }

  return DEFAULT_FUEL_PRICES;
}

/**
 * Converte qualsiasi unità di consumo in litri (o kWh) necessari per percorrere 100 km.
 */
export function normalizeToPer100Km(value: number, unit: ConsumptionUnit): number {
  if (value <= 0) return 0;
  if (unit === 'km/l') {
    return 100 / value;
  }
  return value; // 'l/100km' o 'kWh/100km'
}

/**
 * Converte da l/100km a km/l per mostrare entrambi i valori all'utente
 */
export function convertToKmPerL(lPer100Km: number): number {
  if (lPer100Km <= 0) return 0;
  return Math.round((100 / lPer100Km) * 10) / 10;
}

/**
 * Calcola i litri (o kWh) consumati per una data distanza
 */
export function calculateFuelConsumed(
  distanceKm: number,
  consumptionValue: number,
  unit: ConsumptionUnit
): number {
  const per100Km = normalizeToPer100Km(consumptionValue, unit);
  return (distanceKm / 100) * per100Km;
}

/**
 * Stima delle emissioni di CO2 (in kg) se non fornite da dataset
 */
export function calculateCo2Emissions(
  fuelType: FuelType,
  fuelConsumed: number
): number {
  switch (fuelType) {
    case 'petrol':
      return Math.round(fuelConsumed * 2.31 * 10) / 10; // ~2.31 kg CO2/L
    case 'diesel':
      return Math.round(fuelConsumed * 2.68 * 10) / 10; // ~2.68 kg CO2/L
    case 'lpg':
      return Math.round(fuelConsumed * 1.51 * 10) / 10; // ~1.51 kg CO2/L
    case 'cng':
      return Math.round(fuelConsumed * 2.75 * 10) / 10; // ~2.75 kg CO2/kg
    case 'electric':
      return Math.round(fuelConsumed * 0.23 * 10) / 10; // ~0.23 kg CO2/kWh
    default:
      return 0;
  }
}
