export type VehicleType = 'car' | 'motorcycle' | 'van';

export type FuelType = 'petrol' | 'diesel' | 'lpg' | 'cng' | 'electric';

export type ConsumptionUnit = 'l/100km' | 'km/l' | 'kWh/100km';

export interface VehiclePreset {
  id: string;
  name: string;
  type: VehicleType;
  fuelType: FuelType;
  defaultConsumption: number; // in l/100km or kWh/100km
  unit: ConsumptionUnit;
  description: string;
}

export interface FuelPrices {
  petrol: number;         // €/L
  diesel: number;         // €/L
  lpg: number;            // €/L
  cng: number;            // €/kg
  electricHome: number;   // €/kWh
  electricFast: number;   // €/kWh
  lastUpdated: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationSuggestion {
  displayName: string;
  city: string;
  lat: number;
  lng: number;
}

export interface RouteGeometry {
  coordinates: [number, number][]; // [lat, lng]
}

export interface RouteCalculationResult {
  originName?: string;
  destName?: string;
  distanceKm: number;
  durationMinutes: number;
  tollDistanceKm: number;
  tollCost: number;
  tollType: 'free_toll_system' | 'estimated_highway' | 'mixed' | 'no_toll';
  geometry: [number, number][]; // lat, lng pairs
  summary: string;
  hasToll?: boolean;
  routeName?: string;
  alternatives?: RouteCalculationResult[];
}

export interface TripCostBreakdown {
  distanceKm: number;
  durationMinutes: number;
  fuelType: FuelType;
  fuelConsumptionValue: number;
  fuelConsumptionUnit: ConsumptionUnit;
  fuelPricePerUnit: number;
  fuelCost: number;
  tollCost: number;
  totalCost: number;
  passengers: number;
  costPerPerson: number;
  isRoundTrip: boolean;
  co2Kg: number;
}
