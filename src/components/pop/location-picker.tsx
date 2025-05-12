'use client';

import * as React from 'react';
import { Search, Loader2, MapPin, Target, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Import the map component dynamically to avoid SSR issues with Leaflet
const OpenStreetMap = dynamic(
  () => import('./map-wrapper').then((mod) => mod.OpenStreetMap),
  { ssr: false, loading: () => (
    <div className="h-[250px] w-full rounded-md border border-neutral-200 bg-neutral-50 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
    </div>
  )}
);

interface LocationPickerProps {
  onSelectLocation: (location: { city: string; country: string }) => void;
  initialLocation?: { city: string; country: string } | null;
  className?: string;
}

export function LocationPicker({ onSelectLocation, initialLocation, className }: LocationPickerProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [city, setCity] = React.useState(initialLocation?.city || '');
  const [country, setCountry] = React.useState(initialLocation?.country || '');
  const [latitude, setLatitude] = React.useState<number>(48.8566); // Default to Paris
  const [longitude, setLongitude] = React.useState<number>(2.3522);
  const [showMap, setShowMap] = React.useState(true);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // Update if initialLocation changes
  React.useEffect(() => {
    if (initialLocation) {
      setCity(initialLocation.city);
      setCountry(initialLocation.country || '');
      
      // If we have coordinates for this location, use them
      if (latitude === 48.8566 && longitude === 2.3522) {
        // Only if we're at the default coordinates, try to geocode the location
        geocodeLocation(initialLocation.city, initialLocation.country);
      }
    }
  }, [initialLocation]);

  // Geocode location name to coordinates
  const geocodeLocation = async (city: string, country?: string) => {
    try {
      const query = country ? `${city}, ${country}` : city;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to geocode location');
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        setLatitude(parseFloat(data[0].lat));
        setLongitude(parseFloat(data[0].lon));
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
    }
  };

  // Handle search with debounce
  React.useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim() || searchTerm.length < 2) return;
    
    try {
      setIsSearching(true);
      // Using OpenStreetMap Nominatim API (free, no key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search for location');
      }
      
      const data = await response.json();
      setSearchResults(data);
      
      if (data.length === 0 && searchTerm.length > 3) {
        // Only show toast for longer search terms to avoid unnecessary alerts
        toast.error('No locations found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      toast.error('Failed to search for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle location selection - auto-confirm when selected
  const handleSelectLocation = (result: any) => {
    // Extract city and country from display name
    const parts = result.display_name.split(', ');
    const newCity = parts[0] || result.name || '';
    const newCountry = parts[parts.length - 1] || '';
    
    // Update search query with the selected location name
    setSearchTerm(result.display_name);
    
    // Update state
    setCity(newCity);
    setCountry(newCountry);
    
    // Clear search results
    setSearchResults([]);
    
    // Update coordinates
    if (result.lat && result.lon) {
      setLatitude(parseFloat(result.lat));
      setLongitude(parseFloat(result.lon));
    }
    
    // Auto-confirm the selected location
    onSelectLocation({ city: newCity, country: newCountry });
  };

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    // Update coordinates
    setLatitude(lat);
    setLongitude(lng);
    
    // Reverse geocode to get city and country
    reverseGeocode(lat, lng);
  };
  
  // Reverse geocode to get location details from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to reverse geocode location');
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        // Try to extract city and country
        const newCity = data.address.city || 
                      data.address.town || 
                      data.address.village || 
                      data.address.hamlet ||
                      data.address.municipality ||
                      data.address.county ||
                      '';
        
        const newCountry = data.address.country || '';
        
        if (newCity) {
          setCity(newCity);
          setSearchTerm(newCity + (newCountry ? `, ${newCountry}` : ''));
        }
        
        if (newCountry) {
          setCountry(newCountry);
        }
        
        // Auto-confirm the selected location
        onSelectLocation({ 
          city: newCity || 'Unknown location', 
          country: newCountry 
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Still update coordinates even if reverse geocoding fails
      onSelectLocation({
        city: 'Unknown location',
        country: '',
      });
    }
  };
  
  // Force map refresh/recentering
  const handleRefreshMap = () => {
    // Create a temporary copy of the coordinates and update them to force a refresh
    const tempLat = latitude;
    const tempLng = longitude;
    
    // Slightly offset coordinates to trigger re-render, then set back
    setLatitude(latitude + 0.0000001);
    setLongitude(longitude + 0.0000001);
    
    // Schedule setting back to original values
    setTimeout(() => {
      setLatitude(tempLat);
      setLongitude(tempLng);
    }, 100);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search input container with relative positioning */}
      <div className="relative" ref={searchContainerRef}>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              type="text"
              placeholder="Search location (e.g. San Francisco, USA)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 w-full"
            />
            {isSearching && (
              <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-neutral-500" />
            )}
          </div>
        </div>

        {/* Search results dropdown - contained within parent */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg border border-neutral-200">
            {searchResults.map((result, index) => (
              <button
                key={`${result.place_id || index}`}
                className="w-full text-left px-3 py-2 hover:bg-neutral-50 transition flex items-start gap-2"
                onClick={() => handleSelectLocation(result)}
              >
                <MapPin className="h-4 w-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      {showMap && (
        <div className="mt-2 mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-neutral-600">Click on the map to select a location</p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRefreshMap}
                className="flex items-center gap-1 text-xs h-7"
                title="Refresh map view"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* OpenStreetMap component */}
          {typeof OpenStreetMap === 'function' && (
            <OpenStreetMap
              key={`${latitude}-${longitude}`} // Force re-render when coordinates change
              latitude={latitude}
              longitude={longitude}
              radius={100} // Small radius for visual indication
              popup={city || 'Selected location'}
              onMapClick={handleMapClick}
            />
          )}
          
          <p className="text-xs text-neutral-500 mt-1 text-center">
            Selected coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      )}

      {city && (
        <div className="bg-green-50 p-3 rounded-md border border-green-100">
          <p className="text-sm font-medium">Selected location:</p>
          <p className="text-sm">
            {city}
            {country && `, ${country}`}
          </p>
        </div>
      )}
    </div>
  );
}

