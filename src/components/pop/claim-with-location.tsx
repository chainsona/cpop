'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MapPin,
  AlertTriangle,
  Loader2,
  CheckCircle,
  ArrowRight,
  Clock,
  Coins,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useWalletContext } from '@/contexts/wallet-context';

interface ClaimWithLocationProps {
  distributionMethodId: string;
  popId: string;
  popTitle: string;
  radius: number;
  walletAddress?: string;
}

// Helper function to get authentication headers with improved token validation
const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (typeof window === 'undefined') {
    return headers;
  }

  try {
    // IMPORTANT: Directly check localStorage for the token without attempting to validate or modify it
    const localStorageToken = localStorage.getItem('solana_auth_token');
    
    // Log the token status for debugging
    console.log('Auth token status:', localStorageToken ? 'Token exists in localStorage' : 'No token in localStorage');
    
    if (localStorageToken) {
      // Only add the Solana prefix if it's not already there
      headers['Authorization'] = localStorageToken.startsWith('Solana ')
        ? localStorageToken
        : `Solana ${localStorageToken}`;
      return headers;
    }
    
    // Only try other sources if localStorage doesn't have the token
    const sessionToken = sessionStorage.getItem('solana_auth_token');
    if (sessionToken) {
      headers['Authorization'] = sessionToken.startsWith('Solana ')
        ? sessionToken
        : `Solana ${sessionToken}`;
      return headers;
    }
    
    // Last resort - check cookies
    const cookieValue = getCookieValue('solana_auth_token');
    if (cookieValue) {
      headers['Authorization'] = cookieValue.startsWith('Solana ')
        ? cookieValue
        : `Solana ${cookieValue}`;
      return headers;
    }

    return headers;
  } catch (error) {
    console.error('Error setting auth headers:', error);
    return headers;
  }
};

// Helper function to sync auth tokens from cookies to localStorage/sessionStorage
// This is essential for direct URL access scenarios
const syncAuthTokensFromCookies = (): void => {
  try {
    // Try to get the token from cookies first
    const cookieToken = getCookieValue('solana_auth_token');

    // If found in cookies but not in other storage, sync it
    if (cookieToken) {
      const localToken = localStorage.getItem('solana_auth_token');
      const sessionToken = sessionStorage.getItem('solana_auth_token');

      if (!localToken || !sessionToken) {
        syncAuthToken(cookieToken);
        console.log('Auth tokens synchronized from cookies');
      }

      // Ensure cookies are also set correctly
      const cookieExpiry = 60 * 60 * 24; // 24 hours
      document.cookie = `solana_auth_token=${encodeURIComponent(cookieToken)}; path=/; max-age=${cookieExpiry}; samesite=lax`;
    }
  } catch (error) {
    console.error('Error syncing auth tokens from cookies:', error);
  }
};

// Function to get and validate auth token from multiple sources
const getValidAuthToken = (): string | null => {
  try {
    // Check localStorage FIRST since that's where the token is known to be stored
    const localStorageToken = localStorage.getItem('solana_auth_token');
    if (localStorageToken) {
      console.log('Found auth token in localStorage');
      // Ensure token is synced to other storage
      syncAuthToken(localStorageToken);
      return localStorageToken;
    }
    
    // Then check sessionStorage as backup
    const sessionStorageToken = sessionStorage.getItem('solana_auth_token');
    if (sessionStorageToken) {
      console.log('Found auth token in sessionStorage');
      // Ensure token is synced to other storage
      syncAuthToken(sessionStorageToken);
      return sessionStorageToken;
    }
    
    // Finally check cookies
    const cookieToken = getCookieValue('solana_auth_token');
    if (cookieToken) {
      console.log('Found auth token in cookies');
      // Ensure token is synced to other storage
      syncAuthToken(cookieToken);
      return cookieToken;
    }

    console.log('No valid auth token found in any storage');
    return null;
  } catch (error) {
    console.error('Error getting valid auth token:', error);
    return null;
  }
};

// Function to ensure token is consistently stored in all storage mechanisms
const syncAuthToken = (token: string): void => {
  try {
    // Store in localStorage
    localStorage.setItem('solana_auth_token', token);

    // Store in sessionStorage as backup
    sessionStorage.setItem('solana_auth_token', token);

    // Set the cookie for subsequent requests
    const cookieExpiry = 60 * 60 * 24; // 24 hours
    document.cookie = `solana_auth_token=${encodeURIComponent(token)}; path=/; max-age=${cookieExpiry}; samesite=lax`;
  } catch (error) {
    console.error('Error syncing auth token:', error);
  }
};

// Function to clear auth tokens from all storage
const clearAuthTokens = (): void => {
  try {
    localStorage.removeItem('solana_auth_token');
    sessionStorage.removeItem('solana_auth_token');
    document.cookie = 'solana_auth_token=; path=/; max-age=0';
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
};

// Update the getCookieValue function to be more robust
const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName.trim() === name && cookieValue) {
        return decodeURIComponent(cookieValue);
      }
    }
  } catch (error) {
    console.error('Error getting cookie value:', error);
  }
  return null;
};

// Add a dedicated function for making authenticated API requests
const makeAuthenticatedRequest = async (url: string, method: string, body: any) => {
  // Create headers with all possible auth methods
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Try to get all possible auth tokens
  const cookieToken = getCookieValue('solana_auth_token');
  const localToken = localStorage.getItem('solana_auth_token');
  const sessionToken = sessionStorage.getItem('solana_auth_token');

  // Use any available token (prioritize cookie token)
  const token = cookieToken || localToken || sessionToken;
  
  if (token) {
    // Ensure token has proper format with 'Solana ' prefix
    headers['Authorization'] = token.startsWith('Solana ') ? token : `Solana ${token}`;
  }
  
  console.log(`Making authenticated request to ${url}`, {
    hasToken: !!token,
    tokenSource: cookieToken ? 'cookie' : (localToken ? 'localStorage' : (sessionToken ? 'sessionStorage' : 'none'))
  });

  try {
    // Make API request with credentials:include to ensure cookies are sent
    const response = await fetch(url, {
      method,
      headers,
      credentials: 'include', // This is critical for including cookies
      body: body ? JSON.stringify(body) : undefined,
    });

    return response;
  } catch (error) {
    console.error(`Request to ${url} failed:`, error);
    throw error;
  }
};

export function ClaimWithLocation({
  distributionMethodId,
  popId,
  popTitle,
  radius,
  walletAddress,
}: ClaimWithLocationProps) {
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
  const {
    isConnected,
    isAuthenticated,
    authenticate,
    walletAddress: contextWalletAddress,
  } = useWalletContext();
  const [authLoading, setAuthLoading] = React.useState(false);
  const router = useRouter();

  // Claim state (replacing modal state)
  const [claimStatus, setClaimStatus] = React.useState<
    'initial' | 'claiming' | 'minting' | 'authenticating' | 'success' | 'error' | 'partial'
  >('initial');
  const [transactionId, setTransactionId] = React.useState<string | undefined>();
  const [claimId, setClaimId] = React.useState<string | undefined>();

  // Use wallet from context if available, fallback to prop
  const effectiveWalletAddress = contextWalletAddress || walletAddress;

  // Auto-authenticate when component mounts if wallet is connected but not authenticated
  React.useEffect(() => {
    const attemptAuthentication = async () => {
      // First check if we already have a valid auth token before attempting authentication
      const hasValidToken = getValidAuthToken() !== null;

      if (
        isConnected &&
        !isAuthenticated &&
        !authLoading &&
        effectiveWalletAddress &&
        !hasValidToken
      ) {
        console.log('No valid auth token found, attempting authentication...');
        setAuthLoading(true);
        try {
          await authenticate();
        } catch (error) {
          console.error('Auto-authentication failed:', error);
        } finally {
          setAuthLoading(false);
        }
      } else if (hasValidToken) {
        console.log('Valid auth token already exists, skipping auto-authentication');
      }
    };

    attemptAuthentication();
  }, [isConnected, isAuthenticated, authenticate, authLoading, effectiveWalletAddress]);

  const handleAuthenticate = async () => {
    setError(null);
    setAuthLoading(true);

    try {
      // Clear any potentially invalid tokens first
      clearAuthTokens();
      
      // Request a fresh, properly formatted token with all required fields
      const success = await authenticate();
      if (!success) {
        setError('Authentication failed. Please try again.');
      } else {
        // Verify the token actually contains wallet address
        const newToken = localStorage.getItem('solana_auth_token');
        console.log('New token created with proper format');
        
        // Force a small delay to ensure token is properly saved
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err: any) {
      console.error('Error during authentication:', err);
      // Check for wallet signature rejection
      if (
        typeof err.toString === 'function' && 
        (err.toString().includes('WalletSignMessageError') || 
        err.toString().includes('User rejected'))
      ) {
        setError('Message signing was rejected. Please approve the signature request to authenticate.');
        toast.error('Authentication requires signing a message with your wallet');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

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
    // Add a small delay to ensure auth state is properly initialized
    const initializeClaimProcess = async () => {
      try {
        // Always sync tokens first
        syncAuthTokensFromCookies();

        // Check if we have a valid auth token
        const hasValidToken = getValidAuthToken() !== null;

        console.log('Claim process initialization:', {
          autoCheckPerformed: autoCheckPerformed,
          hasWalletAddress: !!effectiveWalletAddress,
          isAuthenticated: isAuthenticated,
          hasValidToken: hasValidToken,
          locationStatus: locationStatus,
        });

        // First ensure authentication is valid if needed
        if (isConnected && !isAuthenticated && !hasValidToken) {
          console.log('Attempting authentication before location check...');
          try {
            await authenticate();
          } catch (authError: any) {
            console.error('Authentication failed during initialization:', authError);
            // Don't throw - just log and continue
            if (
              typeof authError.toString === 'function' && 
              (authError.toString().includes('WalletSignMessageError') || 
               authError.toString().includes('User rejected'))
            ) {
              console.log('User rejected signature request - skipping auto-location check');
              // Don't show error toast here since it would be disruptive on page load
            }
          }
        }

        // Then only auto-check location if we're authenticated and haven't already
        const isEffectivelyAuthenticated = hasValidToken || isAuthenticated;

        if (
          !autoCheckPerformed &&
          effectiveWalletAddress &&
          isEffectivelyAuthenticated &&
          locationStatus === 'initial'
        ) {
          console.log('Auto-checking location for LocationBased distribution method');
          // Short delay to ensure browser is ready for geolocation
          setTimeout(() => {
            getLocation();
            setAutoCheckPerformed(true);
          }, 1000);
        } else if (!isEffectivelyAuthenticated) {
          console.log('Skipping auto location check - not authenticated');
        }
      } catch (error) {
        console.error('Error initializing claim process:', error);
      }
    };

    initializeClaimProcess();
  }, [
    effectiveWalletAddress,
    locationStatus,
    autoCheckPerformed,
    getLocation,
    isConnected,
    isAuthenticated,
    authenticate,
  ]);

  // Update handleClaim to force a fresh authentication with proper token structure
  const handleClaim = React.useCallback(
    async (e?: React.MouseEvent) => {
      // If there's an event, prevent default behavior that might cause page refresh
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Clear previous errors and state
      setError(null);
      setVerificationMessage(null);
      
      // 1. Check if wallet is connected
      if (!isConnected || !effectiveWalletAddress) {
        setError('You must connect your wallet to claim this POP');
        toast.error('You must connect your wallet to claim this POP');
        return;
      }
      
      // 2. Check if we have location data
      if (!position) {
        setError('Location data is required');
        toast.error('Location data is required');
        return;
      }
      
      // 3. IMPORTANT: Check for existing token first - don't force authentication if not needed
      // Try to get an existing token from any storage location
      const existingToken = localStorage.getItem('solana_auth_token') || 
                            sessionStorage.getItem('solana_auth_token') || 
                            getCookieValue('solana_auth_token');
      
      // Set loading state
      setIsLoading(true);
      
      // If no existing token is found, then authenticate
      if (!existingToken && !isAuthenticated) {
        console.log('No valid auth token found, initiating authentication');
        setClaimStatus('authenticating');
        
        try {
          const success = await authenticate();
          if (!success) {
            setError('Authentication failed. Please try again.');
            setClaimStatus('error');
            setIsLoading(false);
            return;
          }
          
          // Small delay to ensure token is properly saved
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (authError: any) {
          const errorMsg = typeof authError.toString === 'function' && 
                      (authError.toString().includes('WalletSignMessageError') || 
                      authError.toString().includes('User rejected') ||
                      authError.toString().includes('signature'))
                      ? 'Wallet signature was rejected. Please approve the signature request.'
                      : 'Authentication failed. Please try again.';
          
          setError(errorMsg);
          setClaimStatus('error');
          setIsLoading(false);
          toast.error(errorMsg);
          return;
        }
      } else {
        console.log('Using existing auth token, skipping authentication');
      }
      
      // 4. Now proceed with claim
      setClaimStatus('claiming');
      
      try {
        // Prepare request body
        const requestBody = {
          distributionMethodId,
          userLatitude: position.latitude,
          userLongitude: position.longitude,
          method: 'LocationBased',
          transferToken: true,
          walletAddress: effectiveWalletAddress,
        };
        
        // Make authenticated request using any available token
        const response = await makeAuthenticatedRequest(
          `/api/pops/${popId}/claim-with-location`,
          'POST',
          requestBody
        );
        
        // If authentication failed with 401, only then try to re-authenticate
        if (response.status === 401) {
          console.log('Request failed with 401, trying with fresh authentication');
          
          // Show authentication UI
          setClaimStatus('authenticating');
          
          try {
            // Clear tokens and try fresh authentication
            localStorage.removeItem('solana_auth_token');
            sessionStorage.removeItem('solana_auth_token');
            document.cookie = 'solana_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            
            const success = await authenticate();
            if (!success) {
              throw new Error('Authentication failed after retry');
            }
            
            // Wait for token to propagate
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Retry the request with new token
            const retryResponse = await makeAuthenticatedRequest(
              `/api/pops/${popId}/claim-with-location`,
              'POST',
              requestBody
            );
            
            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({ 
                message: `Error: ${retryResponse.status} ${retryResponse.statusText}` 
              }));
              throw new Error(errorData.message || 'Failed to claim POP after re-authentication');
            }
            
            // Process successful retry
            const data = await retryResponse.json();
            handleSuccessResponse(data);
          } catch (retryError: any) {
            console.error('Error during retry:', retryError);
            setError(retryError.message || 'Failed to claim POP');
            setClaimStatus('error');
            toast.error('Authentication failed. Please try again later.');
          }
          
          setIsLoading(false);
          return;
        }

        // Handle normal response
        if (!response.ok) {
          const data = await response.json().catch(() => ({ 
            message: `Error: ${response.status} ${response.statusText}` 
          }));
          const errorMessage = data.message || `Error: ${response.status} ${response.statusText}`;
          
          // Show specific error based on response
          if (data.error === 'LOCATION_VERIFICATION_FAILED') {
            setError(errorMessage);
            
            // Show distance info if available
            if (data.distance && data.radius) {
              setDistanceInfo({
                distance: data.distance,
                radius: data.radius,
              });
            }
          } else {
            setError(errorMessage);
          }
          
          setClaimStatus('error');
          toast.error(errorMessage);
          return;
        }
        
        // Process successful response
        const data = await response.json();
        handleSuccessResponse(data);
        
      } catch (error: any) {
        console.error('Error claiming POP:', error);
        const errorMessage = error.message || 'An error occurred during the claim process.';
        setError(errorMessage);
        setClaimStatus('error');
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [
      position,
      distributionMethodId,
      popId, 
      effectiveWalletAddress,
      isAuthenticated,
      isConnected,
      authenticate
    ]
  );

  // Helper function to handle successful responses
  const handleSuccessResponse = (data: any) => {
    console.log('Claim response data:', data);
    
    // Set transaction info
    if (data.claim?.transactionSignature) {
      setTransactionId(data.claim.transactionSignature);
    }
    if (data.claim?.id) {
      setClaimId(data.claim.id);
    }
    
    // Update UI based on transfer status
    if (data.transferStatus === 'pending') {
      setClaimStatus('partial');
      toast.success('POP claim initiated. The token will be transferred to your wallet shortly.');
    } else {
      setClaimStatus('success');
      toast.success('POP claimed successfully!');
    }
    
    // Store successful claim in localStorage
    try {
      localStorage.setItem(`pop-${popId}-claimed`, 'true');
    } catch (err) {
      console.error('Failed to store claim status:', err);
    }
  };

  const isVerifying = verificationStatus === 'verifying';
  const isAtInitialStep = locationStatus === 'initial';
  const isLocationSuccess = locationStatus === 'success';
  const isLocationError = locationStatus === 'error';
  const isGettingLocation = locationStatus === 'getting';
  const isVerificationError = verificationStatus === 'error';
  const isVerificationSuccess = verificationStatus === 'success';

  // If not authenticated, show auth prompt
  if (!isAuthenticated) {
    return (
      <Card className="border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            Claim at Location
          </CardTitle>
          <CardDescription>Authentication required before checking location</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to authenticate your wallet before claiming this POP.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleAuthenticate}
            disabled={authLoading}
            className="w-full"
            type="button"
          >
            {authLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Authenticate Wallet'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            Claim at Location
          </CardTitle>
          <CardDescription>
            Verify your presence at the event location to claim your POP
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(claimStatus === 'claiming' ||
            claimStatus === 'minting' ||
            claimStatus === 'authenticating') && (
            <div className="flex flex-col items-center py-4 mb-4 bg-blue-50 rounded-md">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              </div>
              <p className="mt-4 text-sm text-neutral-700 font-medium">
                {claimStatus === 'claiming' && 'Claiming your POP...'}
                {claimStatus === 'minting' && 'Transferring to your wallet...'}
                {claimStatus === 'authenticating' && 'Authenticating your wallet...'}
              </p>
            </div>
          )}

          {claimStatus === 'partial' && (
            <div className="flex flex-col items-center py-4 mb-4 bg-yellow-50 rounded-md">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
                <Coins className="h-10 w-10 text-yellow-500" />
              </div>
              <p className="mt-4 text-sm text-neutral-700 font-medium">
                {popTitle ? `"${popTitle}" claim initiated` : 'POP claim initiated'}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                The token will be transferred to your wallet shortly.
              </p>
              {transactionId && (
                <a
                  href={`https://explorer.solana.com/tx/${transactionId}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  View transaction
                </a>
              )}
            </div>
          )}

          {claimStatus === 'success' && (
            <div className="flex flex-col items-center py-4 mb-4 bg-green-50 rounded-md">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <p className="mt-4 text-sm text-neutral-700 font-medium">
                {popTitle
                  ? `"${popTitle}" added to your collection`
                  : 'POP added to your collection'}
              </p>
              {transactionId && (
                <a
                  href={`https://explorer.solana.com/tx/${transactionId}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  View transaction
                </a>
              )}
              <Button onClick={() => router.push('/wallet')} className="mt-4" size="sm">
                View in Wallet
              </Button>
            </div>
          )}

          {claimStatus === 'error' && error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Claim Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              {error.toLowerCase().includes('auth') && (
                <Button onClick={handleAuthenticate} className="mt-3 w-full" size="sm">
                  Authenticate Wallet
                </Button>
              )}
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

          {isLocationSuccess && position && !isVerificationSuccess && (
            <div className="space-y-4 mb-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>You're in the right place!</AlertTitle>
                <AlertDescription>
                  You are at the event location and eligible to claim this POP.
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

          {error && !(claimStatus === 'error') && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!['claiming', 'minting', 'authenticating', 'success'].includes(claimStatus) && (
            <>
              {isAtInitialStep && (
                <Button onClick={getLocation} disabled={isLoading} className="w-full" type="button">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking location...
                    </>
                  ) : (
                    'Check Your Location'
                  )}
                </Button>
              )}

              {isLocationSuccess && position && !isVerificationSuccess && (
                <Button
                  onClick={handleClaim}
                  disabled={isLoading || isVerifying}
                  className="w-full"
                  type="button"
                >
                  {isLoading || isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isVerifying ? 'Verifying & Claiming...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      Claim POP <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}

              {isLocationError && (
                <Button
                  variant="outline"
                  onClick={getLocation}
                  disabled={isLoading}
                  className="w-full"
                  type="button"
                >
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
                <Button
                  variant="outline"
                  onClick={handleClaim}
                  className="w-full"
                  disabled={isLoading}
                  type="button"
                >
                  Try Again
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
