'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { POAPCard } from '@/components/poap/poap-card';
import { EmptyState } from '@/components/poap/empty-state';
import { PoapItem } from '@/types/poap';
import { fetchWithAuth } from '@/lib/api-client';
import { Loader2, Plus, Award } from 'lucide-react';
import { useWalletContext } from '@/contexts/wallet-context';
import { CreateExamplePOAP } from '@/components/poap/create-example-poap';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';

// Rate limiting - Track failed auth attempts
const AUTH_FAILURE_COOLDOWN = 10000; // 10 seconds cooldown after auth failure
let lastAuthFailure = 0;
let authFailureCount = 0;

export default function POAPListPage() {
  const [poaps, setPoaps] = useState<PoapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [error, setError] = useState<string | null>(null);
  const { isConnected, walletAddress, connect } = useWalletContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInCooldown, setAuthInCooldown] = useState(false);
  const router = useRouter();

  // Use refs to track current state without triggering re-renders
  const isAuthenticatedRef = useRef(isAuthenticated);
  const isConnectedRef = useRef(isConnected);

  // Update refs when state changes
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
    isConnectedRef.current = isConnected;
  }, [isAuthenticated, isConnected]);

  // Check if user is authenticated on initial load and redirect if needed
  useEffect(() => {
    // Check if there's a token in localStorage
    const token =
      typeof localStorage !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;
    
    const isAuth = !!token;
    setIsAuthenticated(isAuth);
    
    // If not authenticated and not in loading state, redirect to auth page
    if (!isAuth && typeof window !== 'undefined') {
      // Short delay to allow other hooks to initialize
      const redirectTimer = setTimeout(() => {
        router.push('/auth?returnUrl=/poaps');
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }

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
  }, [router]);

  // Fetch POAPs implementation - separated from the useCallback
  const doFetchPoaps = async () => {
    // Skip if we're in cooldown period due to auth failures
    if (authInCooldown) {
      console.log('Skipping API call - in cooldown period');
      return;
    }

    // For "My POAPs", we need authentication
    if (!isConnectedRef.current) {
      setPoaps([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check auth token before making the request
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;
      
      if (!token && isAuthenticatedRef.current) {
        // Token is missing but we thought we were authenticated
        console.log('Auth token missing, updating auth state...');
        setIsAuthenticated(false);
        setPoaps([]);
        setIsLoading(false);
        setError('Authentication token missing. Please authenticate with your wallet.');
        
        // Redirect to auth page
        router.push('/auth?returnUrl=/poaps');
        return;
      }
      
      if (!token) {
        // No token and we know we're not authenticated - redirect
        router.push('/auth?returnUrl=/poaps');
        return;
      }

      // Using the fetchWithAuth utility to include authentication headers
      console.log('Fetching POAPs with auth status:', { 
        isConnected: isConnectedRef.current, 
        isAuthenticated: isAuthenticatedRef.current,
        hasToken: !!token
      });
      
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

          // Clear the invalid token since it's no longer working
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('solana_auth_token');
          }

          // Track auth failures and implement cooldown
          authFailureCount++;
          lastAuthFailure = Date.now();

          // If we've had multiple failures, enter cooldown mode
          if (authFailureCount >= 2) {
            setAuthInCooldown(true);

            // Clear cooldown after specified time
            setTimeout(() => {
              setAuthInCooldown(false);
            }, AUTH_FAILURE_COOLDOWN);

            setError(
              `Authentication failing repeatedly. Please try again in ${AUTH_FAILURE_COOLDOWN / 1000} seconds.`
            );
          }

          setIsAuthenticated(false);
          
          // Redirect to auth page after a short delay
          setTimeout(() => {
            router.push('/auth?returnUrl=/poaps');
          }, 1500);
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
      console.log('POAPs fetched successfully:', { count: data.poaps?.length || 0 });
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
  }, [authInCooldown, router]);

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
  if (isLoading) {
    return (
      <Container>
        <div className="py-10 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-300 mb-4" />
          <p className="text-neutral-500">Loading your POAPs...</p>
        </div>
      </Container>
    );
  }

  // If not authenticated at this point, show nothing (we should have already redirected)
  if (!isAuthenticated) {
    return null;
  }

  // Main content - only shown to authenticated users
  return (
    <Container>
      <div className="py-10">
        <PageHeader
          title="My POAPs"
          subtitle={
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-blue-600" />
              <span>View and manage the POAPs you have created</span>
            </div>
          }
          actions={[
            {
              href: '/poaps/create',
              label: 'Create POAP',
              icon: <Plus className="h-4 w-4 mr-1" />,
              variant: 'default',
            },
          ]}
        >
          <div className="mt-2">
            <CreateExamplePOAP />
          </div>
        </PageHeader>

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

        {/* Show empty state when no POAPs are found but user is authenticated */}
        {isConnected && isAuthenticated && !isLoading && poaps.length === 0 ? (
          <EmptyState message="You haven't created any POAPs yet. Click 'Create POAP' to get started." />
        ) : (
          <div className="space-y-6">
            {poaps.map(poap => (
              <POAPCard key={poap.id} poap={poap} />
            ))}
          </div>
        )}

        {/* Show authentication prompt */}
        {isConnected && !isAuthenticated && !authInCooldown && (
          <EmptyState
            message="Authentication required to view the POAPs you've created. Please authenticate your wallet to continue."
            buttonText="Authenticate Wallet"
            showButton={true}
            buttonAction={() => {
              window.location.href = '/auth?returnUrl=/poaps';
            }}
            icon={<Loader2 className="h-8 w-8 text-neutral-400" />}
          />
        )}

        {/* Show connect wallet prompt */}
        {!isConnected && (
          <EmptyState
            message="Connect your Solana wallet to view the POAPs you've created."
            buttonText="Connect Wallet"
            showButton={true}
            buttonAction={connect}
            buttonUrl=""
          />
        )}
      </div>
    </Container>
  );
}
