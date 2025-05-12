// This file re-exports the map components to simplify imports
import dynamic from 'next/dynamic';
import React from 'react';

// Define the props interface for our map component
export interface MapProps {
  latitude: number;
  longitude: number;
  radius?: number;
  popup?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

// Create a dynamic component that only loads on the client side
// This is necessary because Leaflet requires the window object
export const Map = dynamic(
  () => import('./map-component').then((mod) => mod.MapComponent),
  { 
    ssr: false,
    loading: () => React.createElement('div', {
      className: "h-[300px] w-full rounded-md border border-neutral-200 bg-neutral-50 flex items-center justify-center"
    }, React.createElement('p', {
      className: "text-neutral-500 text-sm"
    }, "Loading map..."))
  }
); 