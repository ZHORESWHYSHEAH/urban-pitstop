import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Crosshair, Layers, AlertCircle } from 'lucide-react';
import { Facility } from '../types';

interface InteractiveMapProps {
  center: [number, number];
  zoom: number;
  userLocation: [number, number];
  facilities: Facility[];
  selectedFacilityId: string | null;
  onSelectFacility: (id: string) => void;
  activeDestination: Facility | null;
  onRecenter: () => void;
  onOpenReportModal: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  zoom,
  userLocation,
  facilities,
  selectedFacilityId,
  onSelectFacility,
  activeDestination,
  onRecenter,
  onOpenReportModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const routeLineOuterRef = useRef<L.Polyline | null>(null);
  const turnMarkersRef = useRef<L.Marker[]>([]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: true,
      });

      // CartoDB Positron / OSM tiles for crisp outdoor navigation legibility
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Custom zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center & zoom when pilot area changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  // Render User Location Indicator
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation);
    } else {
      const userHtml = `
        <div class="relative flex items-center justify-center w-8 h-8 pulse-user-loc">
          <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
        </div>
      `;
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: userHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      userMarkerRef.current = L.marker(userLocation, { icon: userIcon, zIndexOffset: 900 })
        .addTo(map)
        .bindTooltip('Your Location', { direction: 'top', offset: [0, -10] });
    }
  }, [userLocation]);

  // Update Facility Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear removed markers
    Object.keys(markersRef.current).forEach(id => {
      if (!facilities.find(f => f.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    facilities.forEach(fac => {
      const isSelected = fac.id === selectedFacilityId;
      const isDestination = activeDestination?.id === fac.id;

      // Color and visual coding according to status
      let bgColor = '#176B4D'; // default verified green
      let pulseClass = '';
      let badgeHtml = '';

      if (fac.status === 'recently_confirmed') {
        bgColor = '#176B4D';
        pulseClass = 'pulse-confirmed';
        badgeHtml = `<span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border border-white rounded-full"></span>`;
      } else if (fac.status === 'reported_available') {
        bgColor = '#25825E';
      } else if (fac.status === 'conflicting') {
        bgColor = '#E59B16';
        badgeHtml = `<span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 border border-white rounded-full flex items-center justify-center text-[9px] text-white font-bold">!</span>`;
      } else if (fac.status === 'stale') {
        bgColor = '#66716A';
      } else if (fac.status === 'reported_unavailable') {
        bgColor = '#C64545';
        badgeHtml = `<span class="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 border border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold">✕</span>`;
      } else {
        bgColor = '#8E9991';
      }

      // Icon SVG inside marker
      let iconInner = '';
      if (fac.category === 'water') {
        iconInner = `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="white"/>`;
      } else if (fac.category === 'toilets') {
        iconInner = `<path d="M9 6h6v5H9zm-2 7h10v7H7z" fill="white"/>`;
      } else if (fac.category === 'shade') {
        iconInner = `<path d="M12 3l8 14H4z" fill="white"/>`;
      } else if (fac.category === 'charging') {
        iconInner = `<path d="M13 2L4 14h7l-2 8 11-12h-7z" fill="white"/>`;
      } else {
        iconInner = `<circle cx="12" cy="12" r="5" fill="white"/>`;
      }

      const size = isSelected || isDestination ? 42 : 36;
      const markerHtml = `
        <div class="custom-pitstop-marker relative flex items-center justify-center ${isSelected ? 'is-active ring-4 ring-brand-500/30' : ''} ${pulseClass}" style="width: ${size}px; height: ${size}px;">
          <div class="w-full h-full rounded-2xl flex items-center justify-center shadow-lg transition-transform" style="background-color: ${bgColor}; border: 2.5px solid #FFFFFF;">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              ${iconInner}
            </svg>
          </div>
          ${badgeHtml}
          ${isSelected ? `<div class="absolute -bottom-1.5 w-2 h-2 bg-charcoal rotate-45"></div>` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-div-icon',
        html: markerHtml,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      if (markersRef.current[fac.id]) {
        markersRef.current[fac.id].setIcon(customIcon);
        markersRef.current[fac.id].setLatLng([fac.latitude, fac.longitude]);
      } else {
        const marker = L.marker([fac.latitude, fac.longitude], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            onSelectFacility(fac.id);
          });

        markersRef.current[fac.id] = marker;
      }
    });
  }, [facilities, selectedFacilityId, activeDestination]);

  // Route Polyline when Active Destination is selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up existing route layers
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
    if (routeLineOuterRef.current) {
      routeLineOuterRef.current.remove();
      routeLineOuterRef.current = null;
    }
    turnMarkersRef.current.forEach(m => m.remove());
    turnMarkersRef.current = [];

    if (activeDestination) {
      // Realistic street corridor turn nodes
      const p1 = userLocation;
      const p2: [number, number] = [
        userLocation[0] + (activeDestination.latitude - userLocation[0]) * 0.45,
        userLocation[1] + 0.0003,
      ];
      const p3: [number, number] = [
        activeDestination.latitude,
        userLocation[1] + (activeDestination.longitude - userLocation[1]) * 0.8,
      ];
      const p4: [number, number] = [activeDestination.latitude, activeDestination.longitude];

      const routePoints = [p1, p2, p3, p4];

      // Layer 1: Solid high-contrast base casing
      routeLineOuterRef.current = L.polyline(routePoints, {
        color: '#0D4832',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Layer 2: Vibrant walking route dashed line
      routeLineRef.current = L.polyline(routePoints, {
        color: '#34D399',
        weight: 4,
        opacity: 0.98,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Turn 1 Waypoint Marker
      const turn1Icon = L.divIcon({
        className: 'custom-turn-marker',
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white border-2 border-white shadow-lg text-[11px] font-extrabold">
            1
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const turn1Marker = L.marker(p2, { icon: turn1Icon, zIndexOffset: 850 })
        .addTo(map)
        .bindTooltip('Turn 1: Turn right onto corridor', { direction: 'top', offset: [0, -8] });
      turnMarkersRef.current.push(turn1Marker);

      // Turn 2 Waypoint Marker
      const turn2Icon = L.divIcon({
        className: 'custom-turn-marker',
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white border-2 border-white shadow-lg text-[11px] font-extrabold">
            2
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const turn2Marker = L.marker(p3, { icon: turn2Icon, zIndexOffset: 850 })
        .addTo(map)
        .bindTooltip(`Turn 2: Continue straight to ${activeDestination.name}`, { direction: 'top', offset: [0, -8] });
      turnMarkersRef.current.push(turn2Marker);

      // Fit bounds to show entire walking route
      const bounds = L.latLngBounds([userLocation, p2, p3, p4]);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 17 });
    }
  }, [activeDestination, userLocation]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-surface-muted select-none">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
        {/* Recenter / Locate Button */}
        <button
          onClick={onRecenter}
          className="w-11 h-11 bg-surface-card rounded-xl shadow-card border border-surface-border text-charcoal hover:text-brand-600 flex items-center justify-center transition-transform active:scale-95"
          title="Recenter Location"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {/* Report Problem Floating Shortcut */}
        <button
          onClick={onOpenReportModal}
          className="w-11 h-11 bg-surface-card rounded-xl shadow-card border border-surface-border text-status-amberText hover:text-status-red flex items-center justify-center transition-transform active:scale-95"
          title="Report a facility problem"
        >
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
