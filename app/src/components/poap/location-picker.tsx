'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  onSelectLocation: (location: { city: string; country: string }) => void;
  initialLocation?: { city: string; country: string } | null;
  className?: string;
}

export function LocationPicker({ onSelectLocation, initialLocation, className }: LocationPickerProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [city, setCity] = React.useState(initialLocation?.city || '');
  const [country, setCountry] = React.useState(initialLocation?.country || '');

  // Update if initialLocation changes
  React.useEffect(() => {
    if (initialLocation) {
      setCity(initialLocation.city);
      setCountry(initialLocation.country || '');
    }
  }, [initialLocation]);

  // In a real implementation, this would fetch from a location API
  // For demo purposes, we'll use a simple mock function
  const handleSearch = () => {
    // Update the location
    if (searchTerm) {
      // This is a simplified example - in reality you'd use a geocoding API
      const parts = searchTerm.split(',').map(part => part.trim());

      if (parts.length >= 2) {
        setCity(parts[0]);
        setCountry(parts[1]);
      } else {
        setCity(searchTerm);
        setCountry('');
      }
    }
  };

  const handleConfirm = () => {
    if (city) {
      onSelectLocation({ city, country });
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search location (e.g. San Francisco, USA)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pr-8 w-full"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-0 top-0 h-full"
            onClick={handleSearch}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {city && (
        <div className="bg-neutral-50 p-3 rounded-md">
          <p className="text-sm font-medium">Selected location:</p>
          <p className="text-sm">
            {city}
            {country && `, ${country}`}
          </p>
          <Button size="sm" variant="default" className="mt-2" onClick={handleConfirm}>
            Confirm Location
          </Button>
        </div>
      )}
    </div>
  );
}
