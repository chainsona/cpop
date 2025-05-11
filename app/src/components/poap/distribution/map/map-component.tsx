'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Define the props interface directly here since index.tsx might not exist
export interface MapProps {
  latitude: number;
  longitude: number;
  radius?: number;
  popup?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

// Dynamically import Leaflet component with SSR disabled
const MapWithNoSSR = dynamic(
  () => import('./map-component-inner'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full rounded-md border border-neutral-200 bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Loading map...</p>
      </div>
    )
  }
);

export function MapComponent(props: MapProps) {
  return <MapWithNoSSR {...props} />;
} 