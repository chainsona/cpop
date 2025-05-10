'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, MapPin, Target, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Import the map component
import { OpenStreetMap } from './map-wrapper';

// Note: For production, we would properly integrate the map component.
// Here we're using a simplified placeholder to avoid TypeScript issues.

interface LocationSearchFallbackProps {
  onLocationSelected: (location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => void;
  onRadiusChanged?: (radius: number) => void;
  initialCity?: string;
  initialCountry?: string;
  initialLatitude?: number;
  initialLongitude?: number;
  radius?: number;
}

const MIN_RADIUS = 100;  // Minimum radius in meters
const MAX_RADIUS = 20000; // Maximum radius in meters
const DEFAULT_RADIUS = 500; // Default radius in meters

// Predefined radius options in meters
const RADIUS_OPTIONS = [
  { value: '500', label: '500m (Default)' },
  { value: '2000', label: '2km' },
  { value: '5000', label: '5km' },
  { value: '10000', label: '10km' },
  { value: 'custom', label: 'Custom' }
];

/**
 * A fallback component for location search that uses a free geocoding API
 * instead of Google Maps, which requires a properly configured API key.
 */
export function LocationSearchFallback({
  onLocationSelected,
  onRadiusChanged,
  initialCity = '',
  initialCountry = '',
  initialLatitude = 48.8566, // Default to Paris if no location provided
  initialLongitude = 2.3522,
  radius = 500,
}: LocationSearchFallbackProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [city, setCity] = React.useState(initialCity);
  const [country, setCountry] = React.useState(initialCountry);
  const [latitude, setLatitude] = React.useState<number>(initialLatitude);
  const [longitude, setLongitude] = React.useState<number>(initialLongitude);
  const [showMap, setShowMap] = React.useState(true);
  const [selectedRadius, setSelectedRadius] = React.useState<string>('500');
  const [customRadius, setCustomRadius] = React.useState<string>('1000');
  
  // Calculate the actual radius to use
  const actualRadius = React.useMemo(() => {
    if (selectedRadius === 'custom') {
      // If custom is selected but input is empty or invalid, use default value
      const parsedRadius = parseInt(customRadius);
      if (isNaN(parsedRadius) || customRadius.trim() === '') {
        return DEFAULT_RADIUS;
      }
      
      // Clamp the value between min and max
      return Math.max(MIN_RADIUS, Math.min(parsedRadius, MAX_RADIUS));
    } 
    return parseInt(selectedRadius);
  }, [selectedRadius, customRadius]);
  
  // Notify parent component when radius changes
  React.useEffect(() => {
    if (onRadiusChanged) {
      onRadiusChanged(actualRadius);
    }
  }, [actualRadius, onRadiusChanged]);
  
  // Handle manual search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      // Using OpenStreetMap Nominatim API (free, no key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search for location');
      }
      
      const data = await response.json();
      setSearchResults(data);
      
      if (data.length === 0) {
        toast.error('No locations found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      toast.error('Failed to search for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle location selection
  const handleSelectLocation = (result: any) => {
    // Extract location information
    const newLatitude = parseFloat(result.lat);
    const newLongitude = parseFloat(result.lon);
    
    // Extract city and country from display name
    const parts = result.display_name.split(', ');
    const newCity = parts[0] || result.name || '';
    const newCountry = parts[parts.length - 1] || '';
    
    // Update search query with the selected location name
    setSearchQuery(result.display_name);
    
    // Update state
    setCity(newCity);
    setCountry(newCountry);
    setLatitude(newLatitude);
    setLongitude(newLongitude);
    setSearchResults([]);
    
    // Reset radius to default when new location is selected
    setSelectedRadius('500');
    
    // Notify parent component
    onLocationSelected({
      city: newCity,
      country: newCountry,
      latitude: newLatitude,
      longitude: newLongitude,
    });
  };
  
  // Handle manual coordinate change - clear search input since it's no longer accurate
  const handleCoordinateChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    // If coordinates change directly, clear search query as it's no longer accurate
    setSearchQuery('');
    
    // Reset radius to default when location changes directly
    setSelectedRadius('500');
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
  
  // When manually typing coordinates, ensure search query is cleared
  const handleManualLatLngChange = (value: number, field: 'latitude' | 'longitude') => {
    if (!isNaN(value)) {
      if (field === 'latitude') {
        setLatitude(value);
      } else {
        setLongitude(value);
      }
      // Clear search query since coordinates were manually changed
      setSearchQuery('');
      
      // Reset radius to default when coordinates are manually changed
      setSelectedRadius('500');
    }
  };
  
  // Handle manual coordinate entry
  const handleManualCoordinateEntry = () => {
    if (!city.trim()) {
      toast.error('Please enter a city name');
      return;
    }
    
    onLocationSelected({
      city,
      country,
      latitude,
      longitude,
    });
  };
  
  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    // Update coordinates using the coordinate change handler
    handleCoordinateChange(lat, lng);
    
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
        
        if (newCity) setCity(newCity);
        if (newCountry) setCountry(newCountry);
        
        // Notify parent component
        onLocationSelected({
          city: newCity,
          country: newCountry,
          latitude: lat,
          longitude: lng,
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Still update coordinates even if reverse geocoding fails
      onLocationSelected({
        city,
        country,
        latitude: lat,
        longitude: lng,
      });
    }
  };
  
  // Handle radius change
  const handleRadiusChange = (value: string) => {
    setSelectedRadius(value);
    
    // Reset custom radius to a valid default when switching to custom
    if (value === 'custom' && (customRadius.trim() === '' || isNaN(parseInt(customRadius)))) {
      setCustomRadius('1000');
    }
  };
  
  // Handle custom radius input change
  const handleCustomRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Ensure the value is a positive number or empty
    if (/^\d*$/.test(value)) {
      setCustomRadius(value);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-neutral-200">
        <h3 className="text-sm font-medium mb-2">Location Search</h3>
        
        {/* Search input */}
        <div className="relative mb-4">
          <div className="flex w-full items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                type="text"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()} 
              size="sm"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
        
        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto border border-neutral-200 rounded-md divide-y divide-neutral-200">
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
        
        {/* Map */}
        {showMap && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-neutral-600">Click on the map to select a location</p>
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
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleMapClick(latitude, longitude)}
                  className="flex items-center gap-1 text-xs h-7"
                >
                  <Target className="h-3 w-3" />
                  Use current point
                </Button>
              </div>
            </div>
            
            {/* OpenStreetMap component */}
            <OpenStreetMap
              key={`${latitude}-${longitude}-${actualRadius}`} // Force re-render when coordinates or radius change
              latitude={latitude}
              longitude={longitude}
              radius={actualRadius}
              popup={city || 'Selected location'}
              onMapClick={handleMapClick}
            />
            <p className="text-xs text-neutral-500 mt-1 text-center">
              Selected coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>
        )}
        
        {/* Radius selection */}
        <div className="mb-4">
          <Label className="mb-2 block">Claim Radius</Label>
          <RadioGroup 
            value={selectedRadius} 
            onValueChange={handleRadiusChange}
            className="flex flex-wrap gap-3"
          >
            {RADIUS_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`radius-${option.value}`} />
                <Label htmlFor={`radius-${option.value}`} className="text-sm font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          {/* Custom radius input */}
          {selectedRadius === 'custom' && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={customRadius}
                  onChange={handleCustomRadiusChange}
                  className={`w-24 ${
                    (customRadius.trim() === '' || 
                     isNaN(parseInt(customRadius)) || 
                     parseInt(customRadius) < MIN_RADIUS || 
                     parseInt(customRadius) > MAX_RADIUS) 
                      ? 'border-red-300' 
                      : ''
                  }`}
                  placeholder="Enter radius"
                />
                <span className="text-sm text-neutral-500">meters</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Enter a value between {MIN_RADIUS} and {MAX_RADIUS} meters
                {customRadius.trim() !== '' && 
                 !isNaN(parseInt(customRadius)) && 
                 (parseInt(customRadius) < MIN_RADIUS || parseInt(customRadius) > MAX_RADIUS) && 
                  <span className="text-red-500 ml-1">
                    (Value will be clamped to valid range)
                  </span>
                }
              </p>
            </div>
          )}
        </div>
        
        {/* Location information fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="md:col-span-2">
            <Label htmlFor="city" className="required">
              City
            </Label>
            <Input
              id="city"
              type="text"
              placeholder="Enter city name"
              value={city}
              onChange={e => setCity(e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="country">
              Country
            </Label>
            <Input
              id="country"
              type="text"
              placeholder="Enter country (optional)"
              value={country}
              onChange={e => setCountry(e.target.value)}
            />
          </div>
        </div>
        
        {/* Update location button */}
        <div className="flex justify-end mt-4">
          <Button 
            onClick={handleManualCoordinateEntry}
            size="sm"
            variant="secondary"
          >
            Update Location
          </Button>
        </div>
      </div>
    </div>
  );
} 