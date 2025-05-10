'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Import the props interface from the index file
import { MapProps } from './index';

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

export function MapComponent({ 
  latitude, 
  longitude, 
  radius = 500, 
  popup = '', 
  onMapClick 
}: MapProps) {
  // Convert coordinates to format needed by Leaflet
  const position: [number, number] = [latitude, longitude];
  
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
  
  return (
    <div className="h-[300px] w-full rounded-md overflow-hidden">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        whenReady={() => {
          // Force a resize when the map is ready to handle container size issues
          window.dispatchEvent(new Event('resize'));
        }}
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
} 