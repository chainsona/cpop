'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { StepIndicator } from './step-indicator';
import { Loader2, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LocationSearchFallback } from './location-search-fallback';
import { POAPMintModal } from '@/components/poap/poap-mint-modal';
import { usePOAPMintModal } from '@/hooks/use-poap-mint-modal';
import { pollForTokenMintStatus } from '@/lib/mint-tokens-utils';

// Use fallback by default until Google Maps API key is properly configured
const USE_FALLBACK = true;

// Google Maps API key - should be in env
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
  const [isLoadingPoap, setIsLoadingPoap] = React.useState(false);
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);
  const [mapLoadError, setMapLoadError] = React.useState<string | null>(
    USE_FALLBACK ? 'Using fallback search by default' : null
  );
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMinting, setIsMinting] = React.useState(false);
  const [mintProgress, setMintProgress] = React.useState<string>('');
  const [poapTitle, setPoapTitle] = React.useState<string>('');
  const { modalState, openMintingModal, setMintSuccess, setMintError, onOpenChange } =
    usePOAPMintModal();

  // Function to check if token was minted
  const checkTokenMinted = async (): Promise<{ minted: boolean; mintAddress?: string }> => {
    try {
      const response = await fetch(`/api/poaps/${id}`);
      if (!response.ok) {
        throw new Error('Failed to check token status');
      }

      const data = await response.json();
      return {
        minted: !!data.poap.token,
        mintAddress: data.poap.token?.mintAddress,
      };
    } catch (error) {
      console.error('Error checking token status:', error);
      return { minted: false };
    }
  };

  // Fetch POAP details to get dates
  React.useEffect(() => {
    const fetchPoapDetails = async () => {
      try {
        setIsLoadingPoap(true);
        const response = await fetch(`/api/poaps/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch POAP details');
        }

        const data = await response.json();

        // Auto-populate dates from POAP if available
        if (data.poap) {
          if (data.poap.startDate && !startDate) {
            setStartDate(new Date(data.poap.startDate));
          }

          if (data.poap.endDate && !endDate) {
            setEndDate(new Date(data.poap.endDate));
          }

          // Save the POAP title for the mint modal
          if (data.poap.title) {
            setPoapTitle(data.poap.title);
          }
        }
      } catch (error) {
        console.error('Error fetching POAP details:', error);
      } finally {
        setIsLoadingPoap(false);
      }
    };

    fetchPoapDetails();
  }, [id, startDate, endDate]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/poaps/${id}/distribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

      // Always check if this is the first distribution method
      const isFirstDistributionMethod =
        data.isFirstDistributionMethod || data.tokenMint?.shouldShowMintModal;

      // If this is the first distribution method or we should specifically show the mint modal
      if (isFirstDistributionMethod) {
        // Show minting modal immediately for first distribution method
        setIsMinting(true);
        openMintingModal();

        // Check if token is already minted from server-side
        if (data.tokenMint?.success) {
          // Delay to show the minting animation for at least a second
          setTimeout(() => {
            setMintSuccess();
            setIsMinting(false);

            // Show success toast with link to token tab
            toast.success(
              <div className="flex flex-col gap-2">
                <div>POAP tokens minted successfully!</div>
                <Link
                  href={`/poaps/${id}/token`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium underline"
                >
                  <Coins className="h-4 w-4" />
                  View token details
                </Link>
              </div>
            );

            // Only refresh the page after mint is confirmed
            router.refresh();

            // Call the onSuccess callback if provided
            if (onSuccess) {
              onSuccess();
            }
          }, 1500);
        } else {
          // Need to mint token or check status
          pollForTokenMintStatus({
            poapId: id,
            maxAttempts: 15, // Increased attempts
            intervalMs: 2000, // More frequent checks
            onProgress: message => {
              setMintProgress(message);
            },
            onMinted: () => {
              setIsMinting(false);
              setMintSuccess();

              // Show success toast with link to token tab
              toast.success(
                <div className="flex flex-col gap-2">
                  <div>POAP tokens minted successfully!</div>
                  <Link
                    href={`/poaps/${id}/token`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium underline"
                  >
                    <Coins className="h-4 w-4" />
                    View token details
                  </Link>
                </div>
              );

              // Only refresh the page after mint is confirmed
              router.refresh();

              // Call the onSuccess callback if provided
              if (onSuccess) {
                onSuccess();
              }
            },
            onTimeout: async () => {
              // If timeout, attempt a direct mint
              try {
                setMintProgress('Timeout waiting for token minting. Attempting direct mint...');
                const mintResponse = await fetch(`/api/poaps/${id}/mint`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                });

                if (mintResponse.ok) {
                  const mintData = await mintResponse.json();
                  if (mintData.success) {
                    setMintSuccess();
                    toast.success('POAP tokens minted successfully!');

                    // Refresh page after direct mint succeeds
                    router.refresh();

                    // Call the onSuccess callback if provided
                    if (onSuccess) {
                      onSuccess();
                    }
                  } else {
                    setMintError('Failed to mint tokens: ' + (mintData.error || 'Unknown error'));

                    // Still refresh the page if the distribution was created but minting failed
                    router.refresh();

                    if (onSuccess) {
                      onSuccess();
                    }
                  }
                } else {
                  setMintError('Failed to mint tokens: Server error');

                  // Still refresh the page if the distribution was created but minting failed
                  router.refresh();

                  if (onSuccess) {
                    onSuccess();
                  }
                }
              } catch (error) {
                console.error('Error in direct mint attempt:', error);
                setMintError(
                  'Failed to mint tokens: ' +
                    (error instanceof Error ? error.message : 'Unknown error')
                );

                // Still refresh the page if the distribution was created but minting failed
                router.refresh();

                if (onSuccess) {
                  onSuccess();
                }
              } finally {
                setIsMinting(false);
              }
            },
          });
        }
      } else {
        // For non-first methods, refresh the page immediately
        setIsMinting(false);
        router.refresh();

        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error creating location-based claim:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create location-based claim');
      setIsMinting(false);
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
          <p className="text-neutral-600">Search for a location and set the claim radius.</p>

          {/* Always use the OpenStreetMap fallback component */}
          <LocationSearchFallback
            initialCity={city}
            initialCountry={country}
            initialLatitude={latitude}
            initialLongitude={longitude}
            radius={radius}
            onLocationSelected={({
              city: newCity,
              country: newCountry,
              latitude: newLat,
              longitude: newLong,
            }) => {
              setCity(newCity);
              setCountry(newCountry);
              setLatitude(newLat);
              setLongitude(newLong);
            }}
            onRadiusChanged={newRadius => {
              setRadius(newRadius);
            }}
          />

          <div className="pt-4">
            <Button
              onClick={() => setStep(2)}
              disabled={!city.trim() || !latitude || !longitude || isLoadingPoap}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Set Claim Parameters</h2>
          <p className="text-neutral-600">Define any claim limits and availability period.</p>

          <div className="space-y-6 max-w-md">
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
                {isLoadingPoap && (
                  <p className="text-xs text-neutral-500 mt-1">Loading POAP dates...</p>
                )}
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <DatePicker date={endDate} onChange={setEndDate} />
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-neutral-500">
                  {startDate || endDate
                    ? "These dates are pre-filled from the POAP's event dates"
                    : 'Leave dates blank to allow claims at any time'}
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
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              disabled={isSubmitting || isMinting}
            >
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || isMinting}>
              {isSubmitting ? 'Creating...' : 'Create Location-Based Claim'}
            </Button>
          </div>

          {/* Token minting status indicator */}
          {isMinting && !modalState.open && (
            <div className="mt-6 bg-blue-50 p-4 rounded-lg flex items-center gap-3 border border-blue-100 animate-pulse">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-blue-700 font-medium">
                  {mintProgress || 'Minting POAP tokens...'}
                </p>
                <p className="text-blue-600 text-sm">This may take a few moments...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add POAP Mint Modal */}
      <POAPMintModal
        open={modalState.open}
        onOpenChange={onOpenChange}
        status={modalState.status}
        error={modalState.error}
        poapId={id}
        poapTitle={poapTitle}
      />
    </div>
  );
}
