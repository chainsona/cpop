'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertTriangle, Loader2, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ClaimWithLocationProps {
  distributionMethodId: string;
  poapId: string;
  poapTitle: string;
  radius: number;
  walletAddress?: string;
}

// Helper function to get authentication headers
const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (typeof window === 'undefined') {
    return headers;
  }

  // Try to get the auth token from localStorage
  let authToken = localStorage.getItem('solana_auth_token');

  // If not in localStorage, try to get from cookies
  if (!authToken) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'solana_auth_token') {
        authToken = value;
        break;
      }
    }
  }

  // Add auth token to headers if available
  if (authToken) {
    headers['Authorization'] = `Solana ${authToken}`;
  }

  return headers;
};

export function ClaimWithLocation({
  distributionMethodId,
  poapId,
  poapTitle,
  radius,
  walletAddress,
}: ClaimWithLocationProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [locationStatus, setLocationStatus] = React.useState('initial');
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [position, setPosition] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [verificationStatus, setVerificationStatus] = React.useState('initial');
  const [verificationMessage, setVerificationMessage] = React.useState<string | null>(null);
  const [distanceInfo, setDistanceInfo] = React.useState<{
    distance: number;
    radius: number;
  } | null>(null);
  const [autoCheckPerformed, setAutoCheckPerformed] = React.useState(false);

  // Get user's current location
  const getLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('getting');
    navigator.geolocation.getCurrentPosition(
      position => {
        setPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus('success');
      },
      error => {
        setLocationStatus('error');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('An unknown error occurred');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Automatically check location when component mounts
  React.useEffect(() => {
    // Only auto-check if we haven't already and if wallet is connected
    if (!autoCheckPerformed && walletAddress && locationStatus === 'initial') {
      console.log('Auto-checking location for LocationBased distribution method');
      getLocation();
      setAutoCheckPerformed(true);
    }
  }, [walletAddress, locationStatus, autoCheckPerformed, getLocation]);

  // Handle POAP claim with location verification in one step
  const handleClaim = React.useCallback(async () => {
    if (!position) {
      toast.error('Location information is required');
      return;
    }

    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setVerificationStatus('verifying');

      // Send position data along with the claim request
      const response = await fetch(`/api/poaps/${poapId}/claim-with-location`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          distributionMethodId,
          userLatitude: position.latitude,
          userLongitude: position.longitude,
          method: 'LocationBased',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVerificationStatus('error');

        // Special handling for different error types
        if (data.error === 'LOCATION_VERIFICATION_FAILED') {
          // Location verification failed
          setVerificationMessage(data.message || 'Failed to verify location');

          // Handle specific error cases
          if (data.message === 'This claim is not currently available') {
            // This is a time/date restriction error
            let additionalMessage = '';

            // Attempt to fetch the date restrictions for this distribution method
            try {
              const detailsResponse = await fetch(`/api/poaps/${poapId}/distribution/location`, {
                credentials: 'include',
                headers: getAuthHeaders(),
              });

              if (detailsResponse.ok) {
                const details = await detailsResponse.json();

                if (details.startDate && new Date(details.startDate) > new Date()) {
                  const startDate = new Date(details.startDate);
                  additionalMessage = `Claim period starts on ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}.`;
                } else if (details.endDate && new Date(details.endDate) < new Date()) {
                  const endDate = new Date(details.endDate);
                  additionalMessage = `Claim period ended on ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}.`;
                }
              }
            } catch (err) {
              console.error('Error fetching date details:', err);
            }

            if (additionalMessage) {
              setVerificationMessage(`${data.message}. ${additionalMessage}`);
            }
          }

          // If the error contains distance information, show it
          if (data.distance && data.radius) {
            setDistanceInfo({
              distance: data.distance,
              radius: data.radius,
            });
          }
        } else {
          // General claim error
          setError(data.message || 'Failed to claim POAP');
          toast.error(data.message || 'Failed to claim POAP');
        }

        setIsLoading(false);
        return;
      }

      // Successful claim
      setVerificationStatus('success');
      toast.success('POAP claimed successfully!');

      // Set a flag in localStorage to indicate a successful claim
      try {
        localStorage.setItem(`poap-${poapId}-claimed`, 'true');
      } catch (err) {
        console.error('Failed to store claim status:', err);
      }

      // Try to redirect to wallet page with fallback to main POAP page
      try {
        router.push('/wallet');
      } catch (routeError) {
        console.warn('Failed to redirect to wallet page:', routeError);
        // Fallback to the POAP detail page
        router.push(`/poaps/${poapId}`);
      }
    } catch (error) {
      console.error('Error claiming POAP:', error);
      setVerificationStatus('error');
      setError(
        error instanceof Error ? error.message : 'An error occurred while processing your claim'
      );
      toast.error('Failed to claim POAP');
    } finally {
      setIsLoading(false);
    }
  }, [position, distributionMethodId, poapId, walletAddress, router]);

  const isVerifying = verificationStatus === 'verifying';
  const isAtInitialStep = locationStatus === 'initial';
  const isLocationSuccess = locationStatus === 'success';
  const isLocationError = locationStatus === 'error';
  const isGettingLocation = locationStatus === 'getting';
  const isVerificationError = verificationStatus === 'error';
  const isVerificationSuccess = verificationStatus === 'success';
  const showWalletWarning = !walletAddress && isLocationSuccess;

  return (
    <Card className="border border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-600" />
          Claim at Location
        </CardTitle>
        <CardDescription>
          Verify your presence at the event location to claim your POAP
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showWalletWarning && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to authenticate your wallet before checking your location.
            </AlertDescription>
          </Alert>
        )}

        {isLocationError && locationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Location Error</AlertTitle>
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {isVerificationError && verificationMessage && (
          <Alert variant="destructive" className="mb-4">
            {verificationMessage.includes('not currently available') ? (
              <Clock className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {verificationMessage.includes('not currently available')
                ? 'Time Restriction'
                : 'Verification Failed'}
            </AlertTitle>
            <AlertDescription>
              {verificationMessage}
              {distanceInfo && (
                <div className="mt-2">
                  You are approximately {Math.round(distanceInfo.distance)}m away from the event
                  location.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isVerificationSuccess && (
          <Alert className="bg-green-50 border-green-200 mb-4">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Verification Successful</AlertTitle>
            <AlertDescription>
              Your location has been verified. POAP claimed successfully!
            </AlertDescription>
          </Alert>
        )}

        {isLocationSuccess && position && !showWalletWarning && (
          <div className="space-y-4 mb-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>You're in the right place!</AlertTitle>
              <AlertDescription>
                You are at the event location and eligible to claim this POAP.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {isGettingLocation && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Getting your location...</span>
          </div>
        )}

        {isAtInitialStep && (
          <div className="space-y-4">
            <p className="text-neutral-600 mb-4">
              We need to verify your location to ensure you're at the event venue.
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isAtInitialStep && (
          <Button onClick={getLocation} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking location...
              </>
            ) : (
              <>
                Check My Location <MapPin className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}

        {isLocationSuccess && !showWalletWarning && (
          <Button onClick={handleClaim} disabled={isLoading || isVerifying} className="w-full">
            {isLoading || isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isVerifying ? 'Verifying & Claiming...' : 'Processing...'}
              </>
            ) : (
              <>
                Claim POAP <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}

        {isLocationError && (
          <Button variant="outline" onClick={getLocation} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking location...
              </>
            ) : (
              'Check Location Again'
            )}
          </Button>
        )}

        {isVerificationError && (
          <Button variant="outline" onClick={handleClaim} className="w-full" disabled={isLoading}>
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
