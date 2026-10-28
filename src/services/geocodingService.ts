import { LocationSuggestion } from '../types';

/**
 * Servizio di Geocoding 100% GRATUITO basato su OpenStreetMap (Nominatim & Photon).
 * Non richiede registrazione, né carta di credito, né API key.
 */

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    // 1. Prova prima con Photon (Komoot) - estremamente veloce e permissivo
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=5&lang=it`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        return data.features.map((f: any) => {
          const props = f.properties || {};
          const name = props.name || '';
          const city = props.city || props.town || props.state || '';
          const country = props.country || '';
          const labelParts = [name, city, country].filter(Boolean);
          const uniqueParts = Array.from(new Set(labelParts));

          return {
            displayName: uniqueParts.join(', '),
            city: city || name,
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          };
        });
      }
    }
  } catch (err) {
    console.warn('Photon geocoding fallback to Nominatim:', err);
  }

  // 2. Fallback su Nominatim OpenStreetMap
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
        // In un'app reale è consigliato specificare un User-Agent identificativo
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.map((item: any) => ({
        displayName: item.display_name,
        city: item.address?.city || item.address?.town || item.address?.village || item.name || '',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }

  return [];
}
