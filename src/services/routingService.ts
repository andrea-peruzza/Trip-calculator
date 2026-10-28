import { Coordinates, RouteCalculationResult, VehicleType } from '../types';
import { calculateTollCost } from './tollService';

/**
 * Servizio di Routing 100% GRATUITO basato su OpenStreetMap (Valhalla & OSRM).
 * 
 * - Valhalla: Supporta opzione "Evita pedaggi", percorsi alternativi e routing ponderato
 * - OSRM: Fallback robusto ad alta disponibilità
 */

// Decodifica polyline Valhalla (precisione 6 decimali)
function decodePolyline(str: string, precision: number = 6): [number, number][] {
  let index = 0, lat = 0, lng = 0;
  const coordinates: [number, number][] = [];
  let shift = 0, result = 0, byte = null;
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    byte = null; shift = 0; result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += ((result & 1) ? ~(result >> 1) : (result >> 1));

    shift = 0; result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += ((result & 1) ? ~(result >> 1) : (result >> 1));

    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
}

function parseValhallaTrip(
  trip: any,
  originName: string,
  destinationName: string,
  vehicleType: VehicleType,
  hasMotoDiscount: boolean,
  avoidTolls: boolean,
  defaultRouteName?: string
): RouteCalculationResult {
  const summary = trip.summary;
  const distanceKm = Math.round(summary.length * 10) / 10;
  const durationMinutes = Math.round(summary.time / 60);

  const leg = trip.legs[0];
  const coordinates = decodePolyline(leg.shape, 6);

  // Calcola km autostradali e verifica se ci sono tratti a pedaggio
  let highwayDistanceKm = 0;
  const hasToll = Boolean(summary.has_toll && !avoidTolls);

  if (leg.maneuvers) {
    leg.maneuvers.forEach((m: any) => {
      const isMotorway = m.highway || (m.street_names && m.street_names.some((s: string) => /^A\d+/i.test(s) || /autostrada/i.test(s)));
      if (isMotorway) {
        highwayDistanceKm += m.length || 0;
      }
    });
  }
  highwayDistanceKm = Math.round(highwayDistanceKm * 10) / 10;

  let tollCost = 0;
  let tollSummary = 'Nessun pedaggio';
  let tollType: 'free_toll_system' | 'estimated_highway' | 'mixed' | 'no_toll' = 'no_toll';

  if (hasToll && highwayDistanceKm > 0) {
    const tollInfo = calculateTollCost(
      originName,
      destinationName,
      distanceKm,
      highwayDistanceKm,
      vehicleType,
      hasMotoDiscount
    );
    tollCost = tollInfo.tollCost;
    tollSummary = tollInfo.notes;
    tollType = tollInfo.isExactPair ? 'free_toll_system' : 'estimated_highway';
  } else {
    tollSummary = avoidTolls ? 'Percorso senza pedaggi (strade ordinarie/gratuite)' : 'Viabilità ordinaria senza pedaggio';
  }

  const routeName = defaultRouteName || (hasToll ? 'Autostrada (Più veloce)' : 'Strade Gratuite (Più breve)');

  return {
    originName,
    destName: destinationName,
    distanceKm,
    durationMinutes,
    tollDistanceKm: hasToll ? highwayDistanceKm : 0,
    tollCost,
    tollType,
    geometry: coordinates,
    summary: tollSummary,
    hasToll,
    routeName,
  };
}

export async function calculateRoute(
  start: Coordinates,
  end: Coordinates,
  originName: string,
  destinationName: string,
  vehicleType: VehicleType,
  hasMotoDiscount: boolean = false,
  avoidTolls: boolean = false
): Promise<RouteCalculationResult> {
  // 1. Prova prima con Valhalla (OpenStreetMap FOSSGIS)
  try {
    const valhallaUrl = 'https://valhalla1.openstreetmap.de/route';
    const valhallaBody = {
      locations: [
        { lat: start.lat, lon: start.lng },
        { lat: end.lat, lon: end.lng }
      ],
      costing: 'auto',
      costing_options: {
        auto: {
          use_tolls: avoidTolls ? 0 : 1,
        }
      },
      alternates: avoidTolls ? 0 : 1
    };

    const res = await fetch(valhallaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valhallaBody)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.trip && data.trip.legs && data.trip.legs.length > 0) {
        const primaryRoute = parseValhallaTrip(
          data.trip,
          originName,
          destinationName,
          vehicleType,
          hasMotoDiscount,
          avoidTolls,
          avoidTolls ? 'Percorso senza pedaggi' : undefined
        );

        // Se sono state trovate rotte alternative, le includiamo
        const alternatives: RouteCalculationResult[] = [];
        if (data.alternates && Array.isArray(data.alternates)) {
          data.alternates.forEach((alt: any) => {
            if (alt.trip && alt.trip.legs) {
              const altRoute = parseValhallaTrip(
                alt.trip,
                originName,
                destinationName,
                vehicleType,
                hasMotoDiscount,
                avoidTolls,
                alt.trip.summary.has_toll ? `Alternativa Autostrada` : `Alternativa Statale / Gratuita`
              );
              alternatives.push(altRoute);
            }
          });
        }

        primaryRoute.alternatives = alternatives;
        return primaryRoute;
      }
    }
  } catch (err) {
    console.warn('Valhalla routing fallback to OSRM:', err);
  }

  // 2. Fallback su OSRM
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(osrmUrl);
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

  let highwayDistanceMeters = 0;
  const legs = route.legs || [];

  for (const leg of legs) {
    const steps = leg.steps || [];
    for (const step of steps) {
      const ref = (step.ref || '').toUpperCase();
      const name = (step.name || '').toUpperCase();

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

  const tollInfo = calculateTollCost(
    originName,
    destinationName,
    distanceKm,
    avoidTolls ? 0 : highwayKm,
    vehicleType,
    hasMotoDiscount
  );

  const leafletCoordinates: [number, number][] = route.geometry.coordinates.map(
    (coord: [number, number]) => [coord[1], coord[0]]
  );

  return {
    originName,
    destName: destinationName,
    distanceKm,
    durationMinutes,
    tollDistanceKm: avoidTolls ? 0 : tollInfo.tollKm,
    tollCost: avoidTolls ? 0 : tollInfo.tollCost,
    tollType: avoidTolls ? 'no_toll' : (tollInfo.isExactPair ? 'free_toll_system' : 'estimated_highway'),
    geometry: leafletCoordinates,
    summary: avoidTolls ? 'Percorso senza pedaggi' : tollInfo.notes,
    hasToll: !avoidTolls && tollInfo.tollCost > 0,
    routeName: 'Percorso Principale',
  };
}
