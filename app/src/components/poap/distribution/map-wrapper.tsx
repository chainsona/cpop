'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components with SSR disabled
const MapComponentsWithNoSSR = dynamic(
  () => import('./map-components'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full rounded-md border border-neutral-200 bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Loading map...</p>
      </div>
    )
  }
);

interface MapWrapperProps {
  latitude: number;
  longitude: number;
  radius?: number;
  popup?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

export function OpenStreetMap(props: MapWrapperProps) {
  return <MapComponentsWithNoSSR {...props} />;
} 