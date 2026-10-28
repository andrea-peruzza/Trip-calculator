import { Coordinates, RouteCalculationResult, VehicleType } from '../types';
import { calculateTollCost } from './tollService';

/**
 * Servizio di Routing 100% GRATUITO basato su OSRM (Open Source Routing Machine).
 * Calcola l'itinerario, i km totali, i km su autostrada e stima i pedaggi.
 */

export async function calculateRoute(
  start: Coordinates,
  end: Coordinates,
  originName: string,
  destinationName: string,
  vehicleType: VehicleType,
  hasMotoDiscount: boolean = false
): Promise<RouteCalculationResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Impossibile calcolare il percorso. Verifica i punti di partenza e arrivo.');
  }

  const data = await response.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error('Nessun percorso trovato tra le località indicate.');
  }

  const route = data.routes[0];
  const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
  const durationMinutes = Math.round(route.duration / 60);

  // Analisi dei singoli step per identificare i tratti in autostrada
  let highwayDistanceMeters = 0;
  const legs = route.legs || [];

  for (const leg of legs) {
    const steps = leg.steps || [];
    for (const step of steps) {
      const ref = (step.ref || '').toUpperCase();
      const name = (step.name || '').toUpperCase();

      // In Italia e gran parte d'Europa le autostrade iniziano con "A" seguita da numero (es. A1, A4, A14, A22)
      // oppure contengono "AUTOSTRADA"
      const isMotorway = /^A\d+/.test(ref) || 
                         name.includes('AUTOSTRADA') || 
                         name.includes('RACCORDO AUTOSTRADALE') ||
                         name.includes('TANGENZIALE');

      if (isMotorway) {
        highwayDistanceMeters += step.distance || 0;
      }
    }
  }

  const highwayKm = Math.round((highwayDistanceMeters / 1000) * 10) / 10;

  // Calcolo pedaggio con il nostro servizio
  const tollInfo = calculateTollCost(
    originName,
    destinationName,
    distanceKm,
    highwayKm,
    vehicleType,
    hasMotoDiscount
  );

  // OSRM restituisce GeoJSON coordinates in formato [lng, lat], Leaflet usa [lat, lng]
  const leafletCoordinates: [number, number][] = route.geometry.coordinates.map(
    (coord: [number, number]) => [coord[1], coord[0]]
  );

  return {
    originName,
    destName: destinationName,
    distanceKm,
    durationMinutes,
    tollDistanceKm: tollInfo.tollKm,
    tollCost: tollInfo.tollCost,
    tollType: tollInfo.isExactPair ? 'free_toll_system' : 'estimated_highway',
    geometry: leafletCoordinates,
    summary: tollInfo.notes,
  };
}
