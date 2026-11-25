import { Coordinates, RouteCalculationResult, VehicleType, WaypointItem } from '../types';
import { calculatePreciseToll, findNearestBooth } from './tollService';

/**
 * Servizio di Routing 100% GRATUITO basato su OpenStreetMap (Valhalla & OSRM).
 * 
 * - Valhalla: Supporta opzione "Evita pedaggi", tappe intermedie multiple, percorsi alternativi e routing ponderato
 * - OSRM: Fallback robusto ad alta disponibilità con supporto waypoints
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
  // Riduzione del 20% sul tempo stimato per riflettere la velocità reale di guida
  const rawDurationMinutes = summary.time / 60;
  const durationMinutes = Math.max(1, Math.round(rawDurationMinutes * 0.8));

  const legs = trip.legs || [];
  let coordinates: [number, number][] = [];
  let totalHighwayKm = 0;
  let totalTollCost = 0;
  let totalTollDistanceKm = 0;
  const legNotes: string[] = [];
  const boothPairs: string[] = [];
  let primaryEntryBooth: string | undefined;
  let primaryExitBooth: string | undefined;

  legs.forEach((leg: any, legIndex: number) => {
    const legCoords = decodePolyline(leg.shape, 6);
    coordinates = coordinates.concat(legCoords);

    let legHighwayKm = 0;
    let tollStartCoord: [number, number] | null = null;
    let tollEndCoord: [number, number] | null = null;

    if (leg.maneuvers) {
      leg.maneuvers.forEach((m: any) => {
        const isMotorway = m.highway || (m.street_names && m.street_names.some((s: string) => /^A\d+/i.test(s) || /autostrada/i.test(s)));
        if (isMotorway) {
          legHighwayKm += m.length || 0;
        }

        if (m.toll) {
          if (!tollStartCoord && m.begin_shape_index !== undefined && legCoords[m.begin_shape_index]) {
            tollStartCoord = legCoords[m.begin_shape_index];
          }
          if (m.end_shape_index !== undefined && legCoords[m.end_shape_index]) {
            tollEndCoord = legCoords[m.end_shape_index];
          }
        }
      });
    }

    legHighwayKm = Math.round(legHighwayKm * 10) / 10;
    totalHighwayKm += legHighwayKm;

    const hasLegToll = Boolean(leg.summary?.has_toll && !avoidTolls);

    if (hasLegToll && legHighwayKm > 0) {
      const entryBooth = tollStartCoord ? findNearestBooth(tollStartCoord, 18) : null;
      const exitBooth = tollEndCoord ? findNearestBooth(tollEndCoord, 18) : null;

      if (!primaryEntryBooth && entryBooth) primaryEntryBooth = entryBooth.name;
      if (exitBooth) primaryExitBooth = exitBooth.name;

      const tollInfo = calculatePreciseToll(
        entryBooth,
        exitBooth,
        legHighwayKm,
        vehicleType,
        hasMotoDiscount
      );

      totalTollCost += tollInfo.tollCost;
      totalTollDistanceKm += tollInfo.tollKm;

      if (tollInfo.entryBooth && tollInfo.exitBooth) {
        boothPairs.push(`${tollInfo.entryBooth} ➔ ${tollInfo.exitBooth} (€${tollInfo.tollCost.toFixed(2)})`);
      } else {
        legNotes.push(`Tratta ${legIndex + 1}: €${tollInfo.tollCost.toFixed(2)}`);
      }
    }
  });

  totalHighwayKm = Math.round(totalHighwayKm * 10) / 10;
  totalTollCost = Math.round(totalTollCost * 100) / 100;

  let tollSummary = 'Nessun pedaggio';
  let tollType: 'free_toll_system' | 'estimated_highway' | 'mixed' | 'no_toll' = 'no_toll';

  if (totalTollCost > 0) {
    tollType = 'estimated_highway';
    if (boothPairs.length > 0) {
      tollSummary = boothPairs.join(' | ');
    } else if (legNotes.length > 0) {
      tollSummary = legNotes.join(' + ');
    } else {
      tollSummary = `Pedaggio stimato su ${Math.round(totalTollDistanceKm)} km`;
    }
  } else {
    tollSummary = avoidTolls ? 'Percorso senza pedaggi (strade ordinarie/gratuite)' : 'Viabilità ordinaria senza pedaggio';
  }

  const routeName = defaultRouteName || (totalTollCost > 0 ? 'Autostrada (Più veloce)' : 'Strade Gratuite (Più breve)');

  return {
    originName,
    destName: destinationName,
    distanceKm,
    durationMinutes,
    tollDistanceKm: totalTollDistanceKm,
    tollCost: totalTollCost,
    tollType,
    geometry: coordinates,
    summary: tollSummary,
    entryBooth: primaryEntryBooth,
    exitBooth: primaryExitBooth,
    hasToll: totalTollCost > 0,
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
  avoidTolls: boolean = false,
  waypoints: WaypointItem[] = []
): Promise<RouteCalculationResult> {
  const validWaypoints = waypoints.filter(wp => wp.coords !== null) as { id: string; name: string; coords: Coordinates }[];

  const allLocations = [
    { lat: start.lat, lon: start.lng },
    ...validWaypoints.map(wp => ({ lat: wp.coords.lat, lon: wp.coords.lng })),
    { lat: end.lat, lon: end.lng }
  ];

  // 1. Prova prima con Valhalla (OpenStreetMap FOSSGIS)
  try {
    const valhallaUrl = 'https://valhalla1.openstreetmap.de/route';
    const valhallaBody = {
      locations: allLocations,
      costing: 'auto',
      costing_options: {
        auto: {
          use_tolls: avoidTolls ? 0 : 1,
        }
      },
      alternates: (avoidTolls || validWaypoints.length > 0) ? 0 : 1
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

  // 2. Fallback su OSRM con tutte le coordinate separate da punto e virgola
  const osrmCoordsStr = [
    `${start.lng},${start.lat}`,
    ...validWaypoints.map(wp => `${wp.coords.lng},${wp.coords.lat}`),
    `${end.lng},${end.lat}`
  ].join(';');

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmCoordsStr}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(osrmUrl);
  if (!response.ok) {
    throw new Error('Impossibile calcolare il percorso. Verifica i punti di partenza, arrivo e tappe.');
  }

  const data = await response.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error('Nessun percorso trovato tra le località indicate.');
  }

  const route = data.routes[0];
  const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
  // Riduzione del 20% sul tempo stimato per riflettere la velocità reale
  const rawDurationMinutes = route.duration / 60;
  const durationMinutes = Math.max(1, Math.round(rawDurationMinutes * 0.8));

  let totalTollCost = 0;
  let totalHighwayKm = 0;
  const boothPairs: string[] = [];
  let primaryEntryBooth: string | undefined;
  let primaryExitBooth: string | undefined;

  const legs = route.legs || [];

  legs.forEach((leg: any, legIndex: number) => {
    let legHighwayMeters = 0;
    const steps = leg.steps || [];
    for (const step of steps) {
      const ref = (step.ref || '').toUpperCase();
      const name = (step.name || '').toUpperCase();

      const isMotorway = /^A\d+/.test(ref) || 
                         name.includes('AUTOSTRADA') || 
                         name.includes('RACCORDO AUTOSTRADALE') ||
                         name.includes('TANGENZIALE');

      if (isMotorway) {
        legHighwayMeters += step.distance || 0;
      }
    }
    const legHighwayKm = Math.round((legHighwayMeters / 1000) * 10) / 10;
    totalHighwayKm += legHighwayKm;

    if (!avoidTolls && legHighwayKm > 0) {
      const legCoords: [number, number][] = (leg.steps || []).flatMap((s: any) =>
        (s.geometry?.coordinates || []).map((coord: [number, number]) => [coord[1], coord[0]])
      );

      const entryBooth = legCoords.length > 0 ? findNearestBooth(legCoords[0], 25) : null;
      const exitBooth = legCoords.length > 0 ? findNearestBooth(legCoords[legCoords.length - 1], 25) : null;

      if (!primaryEntryBooth && entryBooth) primaryEntryBooth = entryBooth.name;
      if (exitBooth) primaryExitBooth = exitBooth.name;

      const tollInfo = calculatePreciseToll(
        entryBooth,
        exitBooth,
        legHighwayKm,
        vehicleType,
        hasMotoDiscount
      );

      totalTollCost += tollInfo.tollCost;
      if (tollInfo.entryBooth && tollInfo.exitBooth) {
        boothPairs.push(`${tollInfo.entryBooth} ➔ ${tollInfo.exitBooth} (€${tollInfo.tollCost.toFixed(2)})`);
      } else {
        boothPairs.push(`Tratta ${legIndex + 1}: €${tollInfo.tollCost.toFixed(2)}`);
      }
    }
  });

  const leafletCoordinates: [number, number][] = route.geometry.coordinates.map(
    (coord: [number, number]) => [coord[1], coord[0]]
  );

  return {
    originName,
    destName: destinationName,
    distanceKm,
    durationMinutes,
    tollDistanceKm: avoidTolls ? 0 : totalHighwayKm,
    tollCost: avoidTolls ? 0 : Math.round(totalTollCost * 100) / 100,
    tollType: avoidTolls ? 'no_toll' : 'estimated_highway',
    geometry: leafletCoordinates,
    summary: avoidTolls ? 'Percorso senza pedaggi' : (boothPairs.join(' | ') || 'Tratta senza pedaggi'),
    entryBooth: primaryEntryBooth,
    exitBooth: primaryExitBooth,
    hasToll: !avoidTolls && totalTollCost > 0,
    routeName: 'Percorso Principale',
  };
}
