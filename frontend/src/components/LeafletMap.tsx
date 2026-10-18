import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Toilet } from '../types';

interface LeafletMapProps {
  toilets: Toilet[];
  selectedToilet?: Toilet | null;
  onSelectToilet?: (toilet: Toilet) => void;
  userLocation?: { lat: number; lon: number } | null;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  toilets,
  selectedToilet,
  onSelectToilet,
  userLocation,
  height = '420px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center (New Delhi civic center)
    const initialCenter: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lon]
      : [28.6315, 77.2167];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers whenever toilets or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    // 1. User location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div style="
            width: 18px;
            height: 18px;
            background: #2563eb;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(37,99,235,0.6);
            animation: pulse-subtle 2s infinite;
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .bindPopup('<b>Your Current Location</b>')
        .addTo(markersGroupRef.current);
    }

    // 2. Toilet markers
    toilets.forEach((toilet) => {
      let pinColor = '#059669'; // Clean - emerald
      if (toilet.verified_status === 'Needs Cleaning') pinColor = '#d97706'; // amber
      else if (toilet.verified_status === 'Under Maintenance') pinColor = '#475569'; // slate
      else if (toilet.verified_status === 'Verification Pending') pinColor = '#0284c7'; // sky

      const isSelected = selectedToilet?.id === toilet.id;
      const size = isSelected ? 30 : 24;

      const customIcon = L.divIcon({
        className: 'custom-toilet-pin',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${pinColor};
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 11px;
            font-weight: bold;
            transition: transform 0.2s;
            transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          ">
            WC
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const marker = L.marker([toilet.latitude, toilet.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; min-width: 180px; padding: 2px;">
          <h4 style="margin: 0 0 4px; font-weight: 700; font-size: 14px; color: #0f172a;">${toilet.name}</h4>
          <p style="margin: 0 0 6px; font-size: 12px; color: #475569;">${toilet.locality}, ${toilet.city}</p>
          <div style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: ${pinColor}15; color: ${pinColor}; border: 1px solid ${pinColor}40;">
            ${toilet.verified_status}
          </div>
          ${toilet.distance_km !== undefined ? `<p style="margin: 6px 0 0; font-size: 11px; font-weight: 600; color: #0284c7;">📍 ${toilet.distance_km} km away</p>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectToilet) onSelectToilet(toilet);
      });

      marker.addTo(markersGroupRef.current!);
    });

    // Center on selected toilet if provided
    if (selectedToilet) {
      mapInstanceRef.current.setView([selectedToilet.latitude, selectedToilet.longitude], 15, {
        animate: true
      });
    }
  }, [toilets, selectedToilet, userLocation, onSelectToilet]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 card-shadow" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
