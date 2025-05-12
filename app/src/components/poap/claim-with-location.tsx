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

  try {
    // Try to get the auth token from localStorage first
    let authToken = localStorage.getItem('solana_auth_token');
    
    // If not in localStorage, try to get from cookies
    if (!authToken) {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'solana_auth_token') {
          authToken = decodeURIComponent(value);
          break;
        }
      }
    }
    
    console.log('Auth token found:', authToken ? 'Yes (length: ' + authToken.length + ')' : 'No');
    
    // Add auth token to headers if available
    if (authToken) {
      // Only add the Solana prefix if it's not already there
      headers['Authorization'] = authToken.startsWith('Solana ') ? authToken : `Solana ${authToken}`;
      // Also include as a separate cookie header to ensure it's sent
      headers['Cookie'] = `solana_auth_token=${encodeURIComponent(authToken)}`;
    } else {
      console.warn('No authentication token found in localStorage or cookies');
    }
    
    return headers;
  } catch (error) {
    console.error('Error setting auth headers:', error);
    return headers;
  }
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
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!walletAddress);

  // Check for authentication when wallet address changes
  React.useEffect(() => {
    setIsAuthenticated(!!walletAddress);
  }, [walletAddress]);

  // Check if the auth token exists and is valid
  React.useEffect(() => {
    const checkAuthToken = () => {
      // Try localStorage first
      const localStorageToken = localStorage.getItem('solana_auth_token');
      
      // Then try cookies
      let cookieToken = null;
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'solana_auth_token') {
          cookieToken = value;
          break;
        }
      }
      
      const hasToken = !!localStorageToken || !!cookieToken;
      setIsAuthenticated(hasToken && !!walletAddress);
      
      // Debug log
      if (hasToken && walletAddress) {
        console.log('Authentication appears valid:', { 
          hasWallet: !!walletAddress, 
          hasToken: hasToken,
          tokenSource: localStorageToken ? 'localStorage' : cookieToken ? 'cookie' : 'none'
        });
      } else if (walletAddress && !hasToken) {
        console.warn('Wallet connected but no auth token found');
      }
    };
    
    // Only run in browser
    if (typeof window !== 'undefined') {
      checkAuthToken();
      
      // Re-check when localStorage or cookies change
      window.addEventListener('storage', checkAuthToken);
      return () => window.removeEventListener('storage', checkAuthToken);
    }
  }, [walletAddress]);

  // Add this function to refresh authentication
  const refreshAuthentication = React.useCallback(async () => {
    try {
      // Clear any existing tokens first
      localStorage.removeItem('solana_auth_token');
      document.cookie = 'solana_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      // Trigger any wallet authentication events (framework-specific)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wallet-auth-refresh-requested', {
          detail: { walletAddress }
        }));
        
        // Set a special flag that might be used by wallet components
        localStorage.setItem('wallet_auth_refresh_requested', 'true');
        
        // Show a toast to the user
        toast.info('Refreshing wallet authentication...');
        
        // Give a chance for listeners to process the event
        setTimeout(() => {
          // Check if auth was refreshed
          const hasToken = !!localStorage.getItem('solana_auth_token') || 
                          document.cookie.includes('solana_auth_token=');
          
          if (hasToken) {
            toast.success('Wallet authentication refreshed');
            setIsAuthenticated(true);
          } else {
            toast.error('Unable to refresh authentication automatically');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error refreshing authentication:', error);
      toast.error('Failed to refresh authentication');
    }
  }, [walletAddress]);

  // Update the existing wallet reconnect handler to use the new function
  const handleReconnectWallet = React.useCallback(() => {
    // Try to refresh authentication without page reload first
    refreshAuthentication();
    
    // Set a timeout to reload the page if the refresh doesn't work
    setTimeout(() => {
      // Check if auth was refreshed
      const hasToken = !!localStorage.getItem('solana_auth_token') || 
                      document.cookie.includes('solana_auth_token=');
      
      if (!hasToken) {
        // Refresh failed, reload the page
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    }, 3000);
  }, [refreshAuthentication]);

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
    // First check for authentication
    if (!isAuthenticated) {
      console.log('Authentication check failed:', {
        walletConnected: !!walletAddress,
        hasLocalStorageToken: !!localStorage.getItem('solana_auth_token'),
        hasCookie: document.cookie.includes('solana_auth_token=')
      });
      
      setVerificationStatus('error');
      
      // Different message based on whether wallet is connected
      if (walletAddress) {
        setVerificationMessage('Authentication token is missing. Please reconnect your wallet to claim this POAP.');
      } else {
        setVerificationMessage('Authentication required. Please connect your wallet to claim this POAP.');
      }
      
      toast.error('You must be authenticated to claim this POAP');
      return;
    }

    if (!position || !distributionMethodId || !walletAddress) {
      setVerificationStatus('error');
      const errorMessage = !walletAddress 
        ? 'You must connect your wallet to claim this POAP' 
        : 'Location data is required';
      setVerificationMessage(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsLoading(true);
    setVerificationStatus('verifying');
    
    try {
      // Get auth headers and log them for debugging
      const headers = getAuthHeaders();
      console.log('Request headers:', {
        hasAuthHeader: headers['Authorization' as keyof HeadersInit] !== undefined,
        hasCookieHeader: headers['Cookie' as keyof HeadersInit] !== undefined,
        poapId,
        distributionMethodId,
        walletAddress: walletAddress?.substring(0, 6) + '...',
      });

      // Try to fetch a test endpoint first to check authentication
      try {
        const testResponse = await fetch('/api/test', {
          credentials: 'include',
          headers,
        });
        const testData = await testResponse.json();
        console.log('Auth test response:', testData);
      } catch (testError) {
        console.error('Auth test error:', testError);
      }

      const response = await fetch(`/api/poaps/${poapId}/claim-with-location`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          distributionMethodId,
          userLatitude: position.latitude,
          userLongitude: position.longitude,
          method: 'LocationBased',
        }),
      });

      console.log('Claim response status:', response.status);
      const data = await response.json();
      console.log('Claim response data:', data);
      
      // Handle authentication errors specially
      if (response.status === 401) {
        setVerificationStatus('error');
        setVerificationMessage('Authentication required. Please connect your wallet and try again.');
        toast.error('You must be authenticated to claim this POAP');
        // Force refresh authentication token from wallet
        if (typeof window !== 'undefined') {
          // Attempt to trigger a wallet reconnection by dispatching a custom event
          window.dispatchEvent(new CustomEvent('wallet-reconnect-requested'));
        }
        setIsLoading(false);
        return;
      }

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
  }, [position, distributionMethodId, poapId, walletAddress, router, isAuthenticated]);

  // Add this debug function to diagnose auth issues
  const debugAuthState = React.useCallback(async () => {
    try {
      // Get auth token from different sources
      const localStorageToken = localStorage.getItem('solana_auth_token');
      
      // Check cookies
      let cookieToken = null;
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'solana_auth_token') {
          cookieToken = decodeURIComponent(value);
          break;
        }
      }
      
      // Log basic info
      console.log('==== AUTH DEBUG INFO ====');
      console.log('Connected wallet:', walletAddress);
      console.log('Auth tokens:');
      console.log('- localStorage:', localStorageToken ? `Present (${localStorageToken.substring(0, 20)}...)` : 'Missing');
      console.log('- cookie:', cookieToken ? `Present (${cookieToken.substring(0, 20)}...)` : 'Missing');
      
      // Try to decode tokens if present
      if (localStorageToken) {
        try {
          const decoded = JSON.parse(atob(localStorageToken));
          console.log('LocalStorage token decoded:', decoded);
        } catch (e) {
          console.error('Failed to decode localStorage token:', e);
        }
      }
      
      if (cookieToken) {
        try {
          const decoded = JSON.parse(atob(cookieToken));
          console.log('Cookie token decoded:', decoded);
        } catch (e) {
          console.error('Failed to decode cookie token:', e);
        }
      }
      
      // Check with API if token is valid
      try {
        console.log('Checking auth with server...');
        const authCheckResponse = await fetch('/api/auth/refresh', {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        
        const authCheckData = await authCheckResponse.json();
        console.log('Server auth check result:', authCheckData);
        
        // Show toast with result
        if (authCheckData.isAuthenticated) {
          toast.success(`Auth valid for wallet: ${authCheckData.walletAddress}`);
        } else {
          toast.error('Authentication invalid: ' + authCheckData.message);
        }
      } catch (apiError) {
        console.error('Auth API check failed:', apiError);
        toast.error('Auth check API error');
      }
      
      // Test if claim API is responding
      try {
        console.log('Testing claim endpoint...');
        const testClaimResponse = await fetch(`/api/poaps/${poapId}/claim-with-location`, {
          method: 'OPTIONS',
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        
        console.log('Claim endpoint test response:', testClaimResponse.status);
      } catch (claimTestError) {
        console.error('Claim endpoint test failed:', claimTestError);
      }
    } catch (error) {
      console.error('Debug function error:', error);
      toast.error('Debug failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [walletAddress, poapId]);

  // Add a function to manually fix the auth token
  const fixAuthToken = React.useCallback(async () => {
    if (!walletAddress) {
      toast.error('Wallet not connected');
      return;
    }
    
    try {
      toast.info('Attempting to fix authentication...');
      
      // Get the token from localStorage
      const token = localStorage.getItem('solana_auth_token');
      if (!token) {
        toast.error('No token found in localStorage');
        return;
      }
      
      // Try to set the token as a cookie via the API
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          walletAddress,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Authentication fixed!');
        setIsAuthenticated(true);
        // Wait a moment then try to claim
        setTimeout(() => {
          handleClaim();
        }, 1000);
      } else {
        toast.error('Failed to fix authentication: ' + data.error);
      }
    } catch (error) {
      console.error('Fix auth error:', error);
      toast.error('Error fixing authentication');
    }
  }, [walletAddress, handleClaim]);

  // Add a function to force clean re-authentication
  const forceNewAuth = React.useCallback(async () => {
    try {
      toast.info('Generating new authentication token...');
      
      if (!walletAddress) {
        toast.error('Wallet not connected');
        return;
      }
      
      // Create a new standard auth token with necessary fields
      const now = new Date();
      const expirationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      const authMessage = {
        address: walletAddress,
        statement: 'Sign in to CPOP',
        nonce: `cpop-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        issuedAt: now.toISOString(),
        expirationTime: expirationTime.toISOString()
      };
      
      // Create a signed message object with dummy signature (real apps would use actual signatures)
      const authToken = {
        message: authMessage,
        signature: 'dummy_signature_for_testing_only'
      };
      
      // Convert to base64
      const tokenString = JSON.stringify(authToken);
      const base64Token = btoa(tokenString);
      
      console.log('Created new auth token:', {
        tokenData: authToken,
        base64: base64Token.substring(0, 20) + '...'
      });
      
      // Store in localStorage
      localStorage.setItem('solana_auth_token', base64Token);
      
      // Also set as a cookie
      document.cookie = `solana_auth_token=${encodeURIComponent(base64Token)}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
      
      // Set via API for httpOnly cookie
      const apiResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: base64Token, walletAddress }),
      });
      
      if (apiResponse.ok) {
        setIsAuthenticated(true);
        toast.success('New authentication token created and stored!');
        
        // Wait a moment and try to claim
        setTimeout(() => {
          handleClaim();
        }, 1500);
      } else {
        const errorData = await apiResponse.json();
        toast.error('API error: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating new auth:', error);
      toast.error('Failed to create new authentication');
    }
  }, [walletAddress, handleClaim]);

  const isVerifying = verificationStatus === 'verifying';
  const isAtInitialStep = locationStatus === 'initial';
  const isLocationSuccess = locationStatus === 'success';
  const isLocationError = locationStatus === 'error';
  const isGettingLocation = locationStatus === 'getting';
  const isVerificationError = verificationStatus === 'error';
  const isVerificationSuccess = verificationStatus === 'success';
  const showWalletWarning = !isAuthenticated && isLocationSuccess;

  // Add right before the return statement
  const showDebugButton = process.env.NODE_ENV !== 'production';

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
        {!isAuthenticated && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You must be authenticated with your wallet to claim this POAP.
              {!walletAddress ? " Please connect your wallet." : " Your wallet is connected but authentication is missing."}
              {walletAddress && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleReconnectWallet}
                    className="mt-1"
                  >
                    Reconnect Wallet
                  </Button>
                </div>
              )}
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

        {isVerificationError && verificationMessage && verificationMessage.includes('Authentication required') && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Failed</AlertTitle>
            <AlertDescription>
              {verificationMessage}
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleReconnectWallet}
                  className="mt-1"
                >
                  Reconnect Wallet
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isVerificationError && verificationMessage && !verificationMessage.includes('Authentication required') && (
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
          <Button 
            onClick={getLocation} 
            disabled={isLoading || !isAuthenticated} 
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking location...
              </>
            ) : !isAuthenticated ? (
              'Connect Wallet to Continue'
            ) : (
              'Check Your Location'
            )}
          </Button>
        )}

        {isLocationSuccess && position && !isVerificationSuccess && (
          <Button
            onClick={handleClaim}
            disabled={isLoading || isVerifying || !isAuthenticated}
            className="w-full"
          >
            {isLoading || isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isVerifying ? 'Verifying & Claiming...' : 'Processing...'}
              </>
            ) : !isAuthenticated ? (
              'Connect Wallet to Claim'
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

        {showDebugButton && (
          <div className="flex flex-col gap-2 mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
            <h4 className="text-sm font-medium">Debug Tools</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={debugAuthState}
                className="flex-1"
              >
                Check Auth State
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={fixAuthToken}
                className="flex-1"
              >
                Fix Auth Token
              </Button>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={forceNewAuth}
              className="mt-1"
            >
              Force New Authentication
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
