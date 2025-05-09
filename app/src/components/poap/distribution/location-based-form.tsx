'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { DatePicker } from '@/components/ui/date-picker';
import { StepIndicator } from './step-indicator';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface LocationBasedFormProps {
  id: string;
  onSuccess?: () => void;
}

export function LocationBasedForm({ id, onSuccess }: LocationBasedFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [city, setCity] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [latitude, setLatitude] = React.useState<number | undefined>(undefined);
  const [longitude, setLongitude] = React.useState<number | undefined>(undefined);
  const [radius, setRadius] = React.useState(500);
  const [maxClaims, setMaxClaims] = React.useState<number | undefined>(undefined);
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/poaps/${id}/distribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'LocationBased',
          city,
          country: country || undefined,
          latitude,
          longitude,
          radius,
          maxClaims,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create location-based claim');
      }

      const data = await response.json();

      toast.success('Location-based claim created successfully');
      router.refresh();

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating location-based claim:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create location-based claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <StepIndicator steps={['Location', 'Parameters', 'Review']} currentStep={step} />
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Set Location Details</h2>
          <p className="text-neutral-600">Define where this POAP can be claimed.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
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
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                type="text"
                placeholder="Enter country (optional)"
                value={country}
                onChange={e => setCountry(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                placeholder="e.g. 40.7128"
                value={latitude === undefined ? '' : latitude}
                onChange={e => setLatitude(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>

            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                placeholder="e.g. -74.0060"
                value={longitude === undefined ? '' : longitude}
                onChange={e =>
                  setLongitude(e.target.value ? parseFloat(e.target.value) : undefined)
                }
              />
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center mt-4">
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <MapPin className="h-8 w-8 text-neutral-400" />
              <p className="text-sm text-neutral-600">
                Interactive map will be implemented in future updates.
                <br />
                For now, please enter the coordinates manually.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={() => setStep(2)} disabled={!city.trim() || isSubmitting}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Set Claim Parameters</h2>
          <p className="text-neutral-600">Define the radius and any claim limits.</p>

          <div className="space-y-6 max-w-md">
            <div>
              <div className="flex justify-between mb-2">
                <Label htmlFor="radius">Radius (meters)</Label>
                <span className="text-sm font-medium">{radius}m</span>
              </div>
              <Slider
                id="radius"
                min={50}
                max={5000}
                step={50}
                value={[radius]}
                onValueChange={(values: number[]) => setRadius(values[0])}
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>50m</span>
                <span>5000m</span>
              </div>
              <p className="text-sm text-neutral-500 mt-2">
                Users must be within this radius of the specified location to claim
              </p>
            </div>

            <div>
              <Label htmlFor="maxClaims">Maximum number of claims</Label>
              <Input
                id="maxClaims"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={maxClaims || ''}
                onChange={e => setMaxClaims(e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <p className="text-sm text-neutral-500 mt-2">Leave blank for unlimited claims</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <DatePicker date={startDate} onChange={setStartDate} />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <DatePicker date={endDate} onChange={setEndDate} />
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-neutral-500">
                  Leave dates blank to allow claims at any time
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={isSubmitting}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Review and Create</h2>

          <div className="bg-neutral-50 p-4 rounded-lg">
            <dl className="space-y-2">
              <div className="flex justify-between py-2">
                <dt className="font-medium">Location:</dt>
                <dd>
                  {city}
                  {country ? `, ${country}` : ''}
                </dd>
              </div>
              {latitude !== undefined && longitude !== undefined && (
                <div className="flex justify-between py-2 border-t border-neutral-200">
                  <dt className="font-medium">Coordinates:</dt>
                  <dd>
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-neutral-200">
                <dt className="font-medium">Radius:</dt>
                <dd>{radius} meters</dd>
              </div>
              <div className="flex justify-between py-2 border-t border-neutral-200">
                <dt className="font-medium">Max claims:</dt>
                <dd>{maxClaims || 'Unlimited'}</dd>
              </div>
              <div className="flex justify-between py-2 border-t border-neutral-200">
                <dt className="font-medium">Available from:</dt>
                <dd>{startDate ? startDate.toLocaleDateString() : 'Anytime'}</dd>
              </div>
              <div className="flex justify-between py-2 border-t border-neutral-200">
                <dt className="font-medium">Available until:</dt>
                <dd>{endDate ? endDate.toLocaleDateString() : 'No end date'}</dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Location-Based Claim'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
