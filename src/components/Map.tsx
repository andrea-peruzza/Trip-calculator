import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinates } from '../types';

interface MapProps {
  start?: Coordinates | null;
  end?: Coordinates | null;
  routeGeometry?: [number, number][];
}

export const MapView: React.FC<MapProps> = ({ start, end, routeGeometry }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
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

  // Aggiorna marker e polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
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

    // Traccia del percorso
    if (routeGeometry && routeGeometry.length > 0) {
      const polyline = L.polyline(routeGeometry, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.8,
        lineJoin: 'round',
      }).addTo(map);

      routeLayerRef.current = polyline;
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [start, end, routeGeometry]);

  return (
    <div className="relative w-full h-[360px] md:h-full min-h-[320px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
