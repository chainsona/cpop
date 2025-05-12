'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Export the interface for use in other components
export interface MapComponentProps {
  latitude: number;
  longitude: number;
  radius?: number;
  popup?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

// Dynamically import Leaflet component with SSR disabled
const LeafletMapWithNoSSR = dynamic(
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

export function LeafletMapComponent(props: MapComponentProps) {
  return <LeafletMapWithNoSSR {...props} />;
} 