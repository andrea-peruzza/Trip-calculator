import { ConsumptionUnit, FuelPrices, FuelType } from '../types';

/**
 * Prezzi medi di riferimento (benchmark MIMIT - Osservaprezzi Carburanti Italia).
 * In produzione può essere aggiornato quotidianamente via API/cron.
 */
export const DEFAULT_FUEL_PRICES: FuelPrices = {
  petrol: 1.789,        // €/L medio Self
  diesel: 1.689,        // €/L medio Self
  lpg: 0.719,           // €/L
  cng: 1.340,           // €/kg
  electricHome: 0.28,   // €/kWh (tariffa domestica media italiana)
  electricFast: 0.69,   // €/kWh (colonnine Fast autostradali tipo Ionity/FreeToX)
  lastUpdated: 'Maggio 2024 (Media Nazionale MIMIT)',
};

/**
 * Converte qualsiasi unità di consumo in litri (o kWh) necessari per percorrere 100 km.
 */
export function normalizeToPer100Km(value: number, unit: ConsumptionUnit): number {
  if (value <= 0) return 0;
  if (unit === 'km/l') {
    // Es. 20 km/l => 100 / 20 = 5 l/100km
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
 * Stima delle emissioni di CO2 (in kg)
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
      return Math.round(fuelConsumed * 0.23 * 10) / 10; // ~0.23 kg CO2/kWh (mix energetico italiano medio)
    default:
      return 0;
  }
}
