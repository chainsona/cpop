'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { isBase64Image } from '@/lib/poap-utils';
import { POAPCard } from '@/components/poap/poap-card';
import { EmptyState } from '@/components/poap/empty-state';
import { PoapItem } from '@/types/poap';
import { fetchWithAuth } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import { useWalletContext } from '@/contexts/wallet-context';
import { ConnectWallet } from '@/components/wallet/connect-wallet';
import { CreateExamplePOAP } from '@/components/poap/create-example-poap';
import { usePageTitle } from '@/contexts/page-title-context';

// Rate limiting - Track failed auth attempts
const AUTH_FAILURE_COOLDOWN = 10000; // 10 seconds cooldown after auth failure
let lastAuthFailure = 0;
let authFailureCount = 0;

export default function POAPListPage() {
  const [poaps, setPoaps] = useState<PoapItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, walletAddress, connect } = useWalletContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInCooldown, setAuthInCooldown] = useState(false);
  const { setPageTitle } = usePageTitle();

  // Use refs to track current state without triggering re-renders
  const isAuthenticatedRef = useRef(isAuthenticated);
  const isConnectedRef = useRef(isConnected);

  // Set page title
  useEffect(() => {
    setPageTitle('My POAPs');
    
    return () => {
      setPageTitle('');
    };
  }, [setPageTitle]);

  // Update refs when state changes
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
    isConnectedRef.current = isConnected;
  }, [isAuthenticated, isConnected]);

  // Count how many base64 images are present
  const base64ImageCount = poaps.filter(poap => isBase64Image(poap.imageUrl)).length;

  // Handle auth state changes from the ConnectWallet component
  const handleAuthChange = useCallback((authState: boolean) => {
    setIsAuthenticated(authState);

    // When auth becomes successful, reset failure tracking
    if (authState) {
      setError(null);
      authFailureCount = 0;
      lastAuthFailure = 0;
      setAuthInCooldown(false);
    }
  }, []);

  // Check if user is authenticated on initial load
  useEffect(() => {
    // Check if there's a token in localStorage
    const token =
      typeof localStorage !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;
    setIsAuthenticated(!!token);

    // Check if we're in cooldown state
    const now = Date.now();
    if (lastAuthFailure > 0 && now - lastAuthFailure < AUTH_FAILURE_COOLDOWN) {
      setAuthInCooldown(true);

      // Set a timer to clear cooldown
      const cooldownTimer = setTimeout(
        () => {
          setAuthInCooldown(false);
        },
        AUTH_FAILURE_COOLDOWN - (now - lastAuthFailure)
      );

      return () => clearTimeout(cooldownTimer);
    }
  }, []);

  // Fetch POAPs implementation - separated from the useCallback
  const doFetchPoaps = async () => {
    // Skip if we're in cooldown period due to auth failures
    if (authInCooldown) {
      console.log('Skipping API call - in cooldown period');
      return;
    }

    // Don't fetch if we're not connected and authenticated
    // Use refs to avoid dependency issues
    if (!isConnectedRef.current || !isAuthenticatedRef.current) {
      setPoaps([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Using the fetchWithAuth utility to include authentication headers
      const response = await fetchWithAuth('/api/poaps');

      if (!response.ok) {
        if (response.status === 401) {
          // Get detailed error message if available
          try {
            const errorData = await response.json();
            setError(
              `Authentication error: ${errorData.error || 'Please reconnect your wallet and try again.'}`
            );
          } catch (e) {
            setError('Authentication error. Please reconnect your wallet and try again.');
          }

          // Track auth failures and implement cooldown
          authFailureCount++;
          lastAuthFailure = Date.now();

          // If we've had multiple failures, enter cooldown mode
          if (authFailureCount >= 2) {
            setAuthInCooldown(true);

            // Clear invalid tokens
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('solana_auth_token');
            }

            // Clear cooldown after specified time
            setTimeout(() => {
              setAuthInCooldown(false);
            }, AUTH_FAILURE_COOLDOWN);

            setError(
              `Authentication failing repeatedly. Pausing requests for ${AUTH_FAILURE_COOLDOWN / 1000} seconds.`
            );
          }

          setIsAuthenticated(false);
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
        setIsLoading(false);
        return;
      }

      // Success - reset failure counters
      authFailureCount = 0;
      lastAuthFailure = 0;

      const data = await response.json();
      setPoaps(data.poaps || []);
    } catch (err) {
      console.error('Error fetching POAPs:', err);
      setError('Failed to load POAPs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized fetch function with minimal dependencies
  const fetchPoaps = useCallback(() => {
    // Skip fetch if we're in cooldown
    if (!authInCooldown) {
      doFetchPoaps();
    }
  }, [authInCooldown]);

  // Only fetch on initial load and when auth/connection state actually changes
  useEffect(() => {
    // Only fetch if we're connected and authenticated and not in cooldown
    if (isConnected && isAuthenticated && !authInCooldown) {
      fetchPoaps();
    } else {
      // Clear existing data when not connected/authenticated
      setPoaps([]);
    }
  }, [isConnected, isAuthenticated, fetchPoaps, authInCooldown]);

  // Handle retry
  const handleRetry = () => {
    // Reset failure tracking on manual retry
    authFailureCount = 0;
    lastAuthFailure = 0;
    setAuthInCooldown(false);
    fetchPoaps();
  };

  // Loading state
  if (isLoading && isConnected && isAuthenticated) {
    return (
      <div className="container mx-auto py-10 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-300 mb-4" />
        <p className="text-neutral-500">Loading your POAPs...</p>
      </div>
    );
  }

  // Main content
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My POAPs</h1>
        <div className="flex gap-2">
          <CreateExamplePOAP />
          <Link href="/poaps/create">
            <Button>Create POAP</Button>
          </Link>
        </div>
      </div>

      {/* Display error message if any */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6 text-red-700 flex flex-col">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="self-start mt-2"
            onClick={handleRetry}
            disabled={authInCooldown}
          >
            {authInCooldown ? 'Cooling down...' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Display cooldown message */}
      {authInCooldown && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6 text-yellow-700">
          <p>Too many authentication failures. Waiting before trying again.</p>
        </div>
      )}

      {/* Show authentication prompt */}
      {isConnected && !isAuthenticated && !authInCooldown && (
        <EmptyState
          message="You need to authenticate with your wallet to view and manage your POAPs."
          buttonText="Authenticate Wallet"
          showButton={true}
          icon={<Loader2 className="h-8 w-8 text-neutral-400" />}
        />
      )}

      {/* Show connect wallet prompt */}
      {!isConnected && (
        <EmptyState
          message="You need to connect your Solana wallet to view and manage your POAPs."
          buttonText="Connect Wallet"
          showButton={true}
          buttonAction={connect}
          buttonUrl=""
        />
      )}

      {/* Show empty state when no POAPs are found but user is authenticated */}
      {isConnected && isAuthenticated && !isLoading && poaps.length === 0 ? (
        <EmptyState message="You haven't created any POAPs yet" />
      ) : (
        isConnected &&
        isAuthenticated &&
        !isLoading && (
          <div className="space-y-6">
            {poaps.map(poap => (
              <POAPCard key={poap.id} poap={poap} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
