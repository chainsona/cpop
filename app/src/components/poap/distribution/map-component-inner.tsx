'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapComponentProps } from './map-component';

// Event handler component for map clicks
const MapEvents = ({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!onMapClick) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
};

const MapComponentInner = ({ 
  latitude, 
  longitude, 
  radius = 500, 
  popup = '', 
  onMapClick 
}: MapComponentProps) => {
  // Fix for Leaflet icons in webpack/next.js
  useEffect(() => {
    // Fix Leaflet icons issue with webpack
    // @ts-ignore - This is a known issue with Leaflet and webpack
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
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          {popup && <Popup>{popup}</Popup>}
        </Marker>
        <Circle
          center={[latitude, longitude]}
          radius={radius}
          pathOptions={{
            fillColor: '#FF6B6B',
            fillOpacity: 0.2,
            color: '#FF6B6B',
            weight: 2
          }}
        />
        {onMapClick && <MapEvents onMapClick={onMapClick} />}
      </MapContainer>
    </div>
  );
};

export default MapComponentInner; 