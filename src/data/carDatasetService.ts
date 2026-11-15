import { CarDatasetEntry, FuelType } from '../types';
import carDataRaw from './carDataset.json';

export const CAR_DATASET: CarDatasetEntry[] = carDataRaw as CarDatasetEntry[];

/**
 * Mappatura fuel:
 * E = benzina (o X/Z benzina)
 * D = diesel
 * E/N = bifuel benzina/gpl
 */
export function mapDatasetFuelToFuelType(fuel: string): FuelType {
  const f = fuel.trim().toUpperCase();
  if (f === 'D') return 'diesel';
  if (f === 'E/N') return 'lpg'; // bifuel benzina/gpl
  if (f === 'E' || f === 'Z' || f === 'X') return 'petrol';
  return 'petrol';
}

/**
 * Cerca nel dataset delle auto per parole chiave (es. "fiat punto" o "volvo xc60")
 */
export function searchCars(query: string, limit: number = 20): CarDatasetEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const tokens = trimmed.split(/\s+/).filter(Boolean);

  return CAR_DATASET.filter(car => {
    const target = `${car.make} ${car.model} ${car.engineSize || ''}`.toLowerCase();
    return tokens.every(token => target.includes(token));
  }).slice(0, limit);
}
