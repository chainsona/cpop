'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export interface OpenStreetMapProps {
  latitude: number;
  longitude: number;
  radius?: number;
  popup?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

// Event handler component for map clicks and updates
const MapEvents = ({ 
  onMapClick, 
  center, 
  zoom = 13 
}: { 
  onMapClick?: (lat: number, lng: number) => void;
  center: [number, number];
  zoom?: number;
}) => {
  const map = useMap();
  
  // Center the map when the center prop changes
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, map, zoom]);
  
  // Register click handler
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        const { lat, lng } = e.latlng;
        onMapClick(lat, lng);
      }
    },
  });
  
  return null;
};

const MapComponents = ({ 
  latitude, 
  longitude, 
  radius = 500, 
  popup = '', 
  onMapClick 
}: OpenStreetMapProps) => {
  // Fix Leaflet icons in webpack/next.js
  useEffect(() => {
    // @ts-ignore - This is a known issue with Leaflet in Next.js
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);
  
  // Convert coordinates to format needed by Leaflet
  const position: [number, number] = [latitude, longitude];
  
  return (
    <div className="h-[250px] w-full rounded-md overflow-hidden">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          {popup && <Popup>{popup}</Popup>}
        </Marker>
        <Circle
          center={position}
          radius={radius}
          pathOptions={{
            fillColor: '#FF6B6B',
            fillOpacity: 0.2,
            color: '#FF6B6B',
            weight: 2
          }}
        />
        <MapEvents 
          onMapClick={onMapClick} 
          center={position}
        />
      </MapContainer>
    </div>
  );
};

export default MapComponents; 