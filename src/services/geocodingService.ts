import { LocationSuggestion } from '../types';

/**
 * Servizio di Geocoding 100% GRATUITO basato su OpenStreetMap (Photon & Nominatim).
 * Supporta:
 * - Numeri civici precisi (compresi suffissi come 12/A, 12 bis)
 * - Riconoscimento intelligente di toponimi con prefissi errati (es. "Via Borgo Tonini" -> "Borgo Tonini")
 * - Fallback intelligente: se il civico esatto non è mappato in OSM, aggancia le coordinate della via
 *   mantenendo il numero civico nell'indirizzo selezionato.
 */

// Pulisce prefissi toponomastici ridondanti comunemente digitati (es. "Via Borgo..." -> "Borgo...")
function cleanRedundantStreetPrefixes(query: string): string {
  let q = query.trim();

  // Prefisso iniziale: "via borgo ...", "v. borgo ...", "via piazza ...", ecc.
  const prefixRegex = /^(?:via|v\.?|viale|v\.le|corso|c\.so)\s+(borgo|corso|viale|piazza|p\.zza|piazzale|p\.zle|largo|vicolo|strada|contrada|calle|riva|fondamenta|salita|stradone)\b/i;
  q = q.replace(prefixRegex, (_match, group1) => group1);

  // All'interno di query separate da virgole (es. "Conegliano, via borgo tonini")
  const innerRegex = /(,\s*)(?:via|v\.?|viale|v\.le|corso|c\.so)\s+(borgo|corso|viale|piazza|p\.zza|piazzale|p\.zle|largo|vicolo|strada|contrada|calle|riva|fondamenta|salita|stradone)\b/gi;
  q = q.replace(innerRegex, (_match, comma, group1) => `${comma}${group1}`);

  return q;
}

// Estrae il numero civico dalla query evitando di confondere strade statali/provinciali (es. "SS 16")
function extractHouseNumber(query: string): { baseQuery: string; houseNumber: string | null } {
  const trimmed = query.trim();

  // Non estrarre numeri identificativi di strade come SS 16, SP 43, ecc.
  if (/\b(?:ss|sp|sr|sc|ns|strada statale|strada provinciale|strada regionale|statale|provinciale|uscita|raccordo|autostrada|tangenziale)\s*\d+/i.test(trimmed)) {
    return { baseQuery: trimmed, houseNumber: null };
  }

  const houseNumRegex = /(?:[,\s]+)(?:n°|n\.|n\b|civico\s+)?(\d+\s*[\/-]?\s*[a-zA-Z]?(?:\s*bis)?)(?=[,\s]|$)/i;
  const match = trimmed.match(houseNumRegex);

  if (match) {
    const houseNumber = match[1].trim();
    const baseQuery = trimmed
      .replace(match[0], match[0].startsWith(',') ? ',' : ' ')
      .replace(/\s+,/g, ',')
      .replace(/\s+/g, ' ')
      .replace(/,\s*$/, '')
      .trim();
    return { baseQuery, houseNumber };
  }

  return { baseQuery: trimmed, houseNumber: null };
}

// Formatta un risultato Photon preservando civico, via, città e provincia
function formatPhotonSuggestion(
  feature: any,
  requestedHouseNumber: string | null
): LocationSuggestion {
  const props = feature.properties || {};
  const isPlaceOnly = props.osm_key === 'place' || ['city', 'town', 'village', 'locality', 'state', 'country'].includes(props.type);

  const street = props.street || (props.osm_key === 'highway' ? props.name : '') || '';
  const housenumber = props.housenumber || requestedHouseNumber || '';
  const poiName = (!isPlaceOnly && props.name && props.name !== street) ? props.name : '';

  let streetLine = '';
  if (street) {
    streetLine = housenumber ? `${street} ${housenumber}` : street;
    if (poiName) streetLine = `${poiName}, ${streetLine}`;
  } else if (poiName) {
    streetLine = housenumber ? `${poiName} ${housenumber}` : poiName;
  } else if (housenumber && !isPlaceOnly) {
    streetLine = `Civico ${housenumber}`;
  }

  const city = props.city || props.town || props.village || props.municipality || props.locality || (isPlaceOnly ? props.name : '') || '';
  const county = props.county || '';
  const state = props.state || '';
  const country = props.country || '';

  const parts: string[] = [];
  if (streetLine && streetLine.toLowerCase() !== city.toLowerCase()) {
    parts.push(streetLine);
  }

  if (city) {
    if (county && county.toLowerCase() !== city.toLowerCase() && !city.toLowerCase().includes(county.toLowerCase())) {
      parts.push(`${city} (${county})`);
    } else {
      parts.push(city);
    }
  } else if (county) {
    parts.push(county);
  }

  if (state && !parts.some(p => p.toLowerCase().includes(state.toLowerCase()))) {
    parts.push(state);
  }

  if (country && !parts.some(p => p.toLowerCase().includes(country.toLowerCase()))) {
    parts.push(country);
  }

  const displayName = parts.join(', ');

  return {
    displayName,
    city: city || streetLine || displayName,
    lng: feature.geometry.coordinates[0],
    lat: feature.geometry.coordinates[1],
  };
}

// Formatta un risultato Nominatim preservando civico, via, città e provincia
function formatNominatimSuggestion(
  item: any,
  requestedHouseNumber: string | null
): LocationSuggestion {
  const addr = item.address || {};
  const isPlaceOnly = ['city', 'town', 'village', 'hamlet', 'state', 'country'].includes(item.type);

  const road = addr.road || addr.pedestrian || addr.cycleway || addr.footway || addr.path || '';
  const housenumber = addr.house_number || requestedHouseNumber || '';
  const poiName = (!isPlaceOnly && item.name && item.name !== road) ? item.name : '';

  let streetLine = '';
  if (road) {
    streetLine = housenumber ? `${road} ${housenumber}` : road;
    if (poiName) streetLine = `${poiName}, ${streetLine}`;
  } else if (poiName) {
    streetLine = housenumber ? `${poiName} ${housenumber}` : poiName;
  } else if (housenumber && !isPlaceOnly) {
    streetLine = `Civico ${housenumber}`;
  }

  const city = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || (isPlaceOnly ? item.name : '') || '';
  const county = addr.county || '';
  const state = addr.state || '';
  const country = addr.country || '';

  const parts: string[] = [];
  if (streetLine && streetLine.toLowerCase() !== city.toLowerCase()) {
    parts.push(streetLine);
  }

  if (city) {
    if (county && county.toLowerCase() !== city.toLowerCase() && !city.toLowerCase().includes(county.toLowerCase())) {
      parts.push(`${city} (${county})`);
    } else {
      parts.push(city);
    }
  } else if (county) {
    parts.push(county);
  }

  if (state && !parts.some(p => p.toLowerCase().includes(state.toLowerCase()))) {
    parts.push(state);
  }

  if (country && !parts.some(p => p.toLowerCase().includes(country.toLowerCase()))) {
    parts.push(country);
  }

  const displayName = parts.length > 0 ? parts.join(', ') : item.display_name;

  return {
    displayName,
    city: city || streetLine || displayName,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  };
}

// Elimina duplicati basandosi su prossimità di coordinate e testo
function deduplicateSuggestions(suggestions: LocationSuggestion[]): LocationSuggestion[] {
  const seen = new Set<string>();
  const unique: LocationSuggestion[] = [];

  for (const s of suggestions) {
    const key = `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`;
    const nameKey = s.displayName.toLowerCase().replace(/[\s,]+/g, ' ').trim();
    if (!seen.has(key) && !seen.has(nameKey)) {
      seen.add(key);
      seen.add(nameKey);
      unique.push(s);
    }
  }

  return unique.slice(0, 6);
}

async function fetchPhoton(query: string): Promise<any[]> {
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=it`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.features)) {
        return data.features;
      }
    }
  } catch (err) {
    console.warn('Photon query fallback for:', query, err);
  }
  return [];
}

async function fetchNominatim(query: string): Promise<any[]> {
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1&accept-language=it,en`;
    const res = await fetch(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Nominatim query error for:', query, err);
  }
  return [];
}

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const { baseQuery, houseNumber } = extractHouseNumber(trimmed);
  const cleanOriginal = cleanRedundantStreetPrefixes(trimmed);
  const cleanBase = cleanRedundantStreetPrefixes(baseQuery);

  // Lista di varianti di ricerca ordinate per priorità
  const queriesToTry: { q: string; isBase: boolean }[] = [];

  // 1. Query originale pulita (es. "Borgo Tonini 12, Conegliano")
  queriesToTry.push({ q: cleanOriginal, isBase: false });

  // 2. Query originale così come digitata se diversa (es. "Via Borgo Tonini 12, Conegliano")
  if (cleanOriginal.toLowerCase() !== trimmed.toLowerCase()) {
    queriesToTry.push({ q: trimmed, isBase: false });
  }

  // 3. Query base senza civico (es. "Borgo Tonini, Conegliano") nel caso il numero civico non sia nel DB OSM
  if (houseNumber) {
    if (!queriesToTry.some(item => item.q.toLowerCase() === cleanBase.toLowerCase())) {
      queriesToTry.push({ q: cleanBase, isBase: true });
    }
    if (cleanBase.toLowerCase() !== baseQuery.toLowerCase() && !queriesToTry.some(item => item.q.toLowerCase() === baseQuery.toLowerCase())) {
      queriesToTry.push({ q: baseQuery, isBase: true });
    }
  }

  // 1. Prova prima con Photon (Komoot)
  for (const { q, isBase } of queriesToTry) {
    const features = await fetchPhoton(q);
    if (features && features.length > 0) {
      const results = features.map(f => formatPhotonSuggestion(f, isBase ? houseNumber : (houseNumber || null)));
      const deduped = deduplicateSuggestions(results);
      if (deduped.length > 0) return deduped;
    }
  }

  // 2. Fallback su Nominatim
  for (const { q, isBase } of queriesToTry) {
    const items = await fetchNominatim(q);
    if (items && items.length > 0) {
      const results = items.map(item => formatNominatimSuggestion(item, isBase ? houseNumber : (houseNumber || null)));
      const deduped = deduplicateSuggestions(results);
      if (deduped.length > 0) return deduped;
    }
  }

  return [];
}
