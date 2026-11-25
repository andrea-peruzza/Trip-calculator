import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinates, WaypointItem } from '../types';

interface MapProps {
  start?: Coordinates | null;
  end?: Coordinates | null;
  waypoints?: WaypointItem[];
  routeGeometry?: [number, number][];
}

export const MapView: React.FC<MapProps> = ({ start, end, waypoints = [], routeGeometry }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const highlightLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Inizializza mappa centrata sull'Italia
    const map = L.map(mapContainerRef.current, {
      center: [42.504154, 12.646361], // Centro Italia
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Aggiorna marker e polyline con click informativo sul segmento/paese ed evidenziazione
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    if (highlightLayerRef.current) {
      highlightLayerRef.current.remove();
      highlightLayerRef.current = null;
    }

    const bounds: L.LatLngBounds = new L.LatLngBounds([]);

    // Marker Partenza (Verde)
    if (start) {
      const startMarker = L.circleMarker([start.lat, start.lng], {
        radius: 8,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).bindPopup('<b>Partenza</b>');
      markersLayer.addLayer(startMarker);
      bounds.extend([start.lat, start.lng]);
    }

    // Marker Tappe intermedie (Ambra / Arancione con numerazione)
    waypoints.forEach((wp, idx) => {
      if (wp.coords) {
        const wpMarker = L.circleMarker([wp.coords.lat, wp.coords.lng], {
          radius: 7,
          fillColor: '#f59e0b',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).bindPopup(`<b>Tappa ${idx + 1}:</b> ${wp.name || 'Punto intermedio'}`);
        markersLayer.addLayer(wpMarker);
        bounds.extend([wp.coords.lat, wp.coords.lng]);
      }
    });

    // Marker Arrivo (Rosso)
    if (end) {
      const endMarker = L.circleMarker([end.lat, end.lng], {
        radius: 8,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).bindPopup('<b>Arrivo</b>');
      markersLayer.addLayer(endMarker);
      bounds.extend([end.lat, end.lng]);
    }

    // Traccia del percorso interattiva (cliccabile per identificare il paese/località ed evidenziare il tratto)
    if (routeGeometry && routeGeometry.length > 0) {
      const polyline = L.polyline(routeGeometry, {
        color: '#2563eb',
        weight: 6,
        opacity: 0.85,
        lineJoin: 'round',
      }).addTo(map);

      // Al click su qualsiasi punto/segmento della linea blu, colora il tratto ed identifica comune e provincia
      polyline.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        // Trova l'indice del punto più vicino lungo la geometria del percorso
        let closestIdx = 0;
        let minSqDist = Infinity;
        for (let i = 0; i < routeGeometry.length; i++) {
          const pt = routeGeometry[i];
          const d = (pt[0] - lat) ** 2 + (pt[1] - lng) ** 2;
          if (d < minSqDist) {
            minSqDist = d;
            closestIdx = i;
          }
        }

        // Estrai il segmento di strada circostante (circa 25 punti prima e dopo)
        const startSub = Math.max(0, closestIdx - 25);
        const endSub = Math.min(routeGeometry.length, closestIdx + 26);
        const subSegment = routeGeometry.slice(startSub, endSub);

        // Rimuovi eventuale highlight precedente e disegna il nuovo segmento in colore arancione/ambra brillante
        if (highlightLayerRef.current) {
          highlightLayerRef.current.remove();
        }
        highlightLayerRef.current = L.polyline(subSegment, {
          color: '#f97316', // Arancione brillante per evidenziare il tratto
          weight: 9,
          opacity: 0.95,
          lineJoin: 'round',
        }).addTo(map);

        const popup = L.popup()
          .setLatLng([lat, lng])
          .setContent('<div class="p-1 text-xs"><b>Rilevamento località...</b></div>')
          .openOn(map);

        popup.on('remove', () => {
          if (highlightLayerRef.current) {
            highlightLayerRef.current.remove();
            highlightLayerRef.current = null;
          }
        });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=it,en`,
            { headers: { 'User-Agent': 'TripCalculatorApp/1.0' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const town = addr.village || addr.town || addr.city || addr.municipality || addr.hamlet || 'Comune non specificato';
            const county = addr.county || '';
            const state = addr.state || '';
            const country = addr.country || 'Italia';
            const road = addr.road || '';

            const content = `
              <div class="text-xs space-y-1">
                <div class="font-bold text-slate-800 text-sm">📍 ${town}</div>
                ${county ? `<div class="text-slate-600">Provincia: <b>${county}</b></div>` : ''}
                ${state ? `<div class="text-slate-500">Regione: ${state} (${country})</div>` : ''}
                ${road ? `<div class="text-[11px] text-amber-600 font-semibold">Tratto evidenziato: ${road}</div>` : ''}
                <div class="text-[10px] text-slate-400 mt-1">Coord: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
              </div>
            `;
            popup.setContent(content);
          } else {
            popup.setContent(`<div class="text-xs">Tratto percorso: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>`);
          }
        } catch {
          popup.setContent(`<div class="text-xs">Tratto percorso: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>`);
        }
      });

      routeLayerRef.current = polyline;
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [start, end, waypoints, routeGeometry]);

  return (
    <div className="relative w-full h-[360px] md:h-full min-h-[320px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
