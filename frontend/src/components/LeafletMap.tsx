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

      // Ultra-clean Apple-style dark map tiles using OpenStreetMap with dark filter (Zero API key, zero watermarks)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        className: 'clean-ai-dark-tiles'
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
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

    // 1. User location marker with glowing blue pulse
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: rgba(41, 151, 255, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 12px; height: 12px; background: #2997FF; border: 2px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 12px rgba(41, 151, 255, 0.8);"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .bindPopup(`
          <div style="padding: 4px; color: #F5F5F7;">
            <p style="margin: 0; font-weight: 600; font-size: 13px;">Your Location</p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #A1A1A6;">GPS Geolocation Active</p>
          </div>
        `)
        .addTo(markersGroupRef.current);
    }

    // 2. Toilet markers
    toilets.forEach((toilet) => {
      let pinColor = '#30D158'; // Clean (Apple Green)
      let glowColor = 'rgba(48, 209, 88, 0.4)';
      if (toilet.verified_status === 'Needs Cleaning') {
        pinColor = '#FF9F0A'; // Amber
        glowColor = 'rgba(255, 159, 10, 0.4)';
      } else if (toilet.verified_status === 'Under Maintenance') {
        pinColor = '#8E8E93'; // Slate
        glowColor = 'rgba(142, 142, 147, 0.4)';
      } else if (toilet.verified_status === 'Verification Pending') {
        pinColor = '#2997FF'; // Blue
        glowColor = 'rgba(41, 151, 255, 0.4)';
      }

      const isSelected = selectedToilet?.id === toilet.id;
      const size = isSelected ? 30 : 22;

      const customIcon = L.divIcon({
        className: 'custom-toilet-pin',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${pinColor};
            border: 2px solid ${isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)'};
            border-radius: 50%;
            box-shadow: 0 0 ${isSelected ? '16px' : '8px'} ${glowColor};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #050505;
            font-size: ${isSelected ? '11px' : '10px'};
            font-weight: 800;
            letter-spacing: -0.5px;
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; min-width: 190px; padding: 4px 2px; color: #F5F5F7;">
          <h4 style="margin: 0 0 3px; font-weight: 600; font-size: 14px; letter-spacing: -0.01em; color: #F5F5F7;">${toilet.name}</h4>
          <p style="margin: 0 0 8px; font-size: 12px; color: #A1A1A6;">${toilet.locality}, ${toilet.city}</p>
          <div style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; background: ${pinColor}18; color: ${pinColor}; border: 1px solid ${pinColor}40;">
            ${toilet.verified_status}
          </div>
          ${toilet.distance_km !== undefined ? `<p style="margin: 8px 0 0; font-size: 11px; font-weight: 500; color: #2997FF;">📍 ${toilet.distance_km} km away</p>` : ''}
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
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#262626] bg-[#050505]" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

