'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { POPCard } from '@/components/pop/pop-card';
import { EmptyState } from '@/components/pop/empty-state';
import { PopItem } from '@/types/pop';
import { fetchWithAuth } from '@/lib/api-client';
import { Plus, Award } from 'lucide-react';
import { useWalletContext } from '@/contexts/wallet-context';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/navigation';
import { POPCardSkeletonList } from '@/components/pop/pop-card-skeleton';

// Rate limiting - Track failed auth attempts
const AUTH_FAILURE_COOLDOWN = 10000; // 10 seconds cooldown after auth failure
let lastAuthFailure = 0;
let authFailureCount = 0;

export default function POPListPage() {
  const [pops, setPops] = useState<PopItem[]>([]);
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
        router.push('/auth?returnUrl=/pops');
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

  // Fetch POPs implementation - separated from the useCallback
  const doFetchPops = async () => {
    // Skip if we're in cooldown period due to auth failures
    if (authInCooldown) {
      console.log('Skipping API call - in cooldown period');
      return;
    }

    // For "My POPs", we need authentication
    if (!isConnectedRef.current) {
      setPops([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check auth token before making the request
      const token =
        typeof localStorage !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;

      if (!token && isAuthenticatedRef.current) {
        // Token is missing but we thought we were authenticated
        console.log('Auth token missing, updating auth state...');
        setIsAuthenticated(false);
        setPops([]);
        setIsLoading(false);
        setError('Authentication token missing. Please authenticate with your wallet.');

        // Redirect to auth page
        router.push('/auth?returnUrl=/pops');
        return;
      }

      if (!token) {
        // No token and we know we're not authenticated - redirect
        router.push('/auth?returnUrl=/pops');
        return;
      }

      // Using the fetchWithAuth utility to include authentication headers
      console.log('Fetching POPs with auth status:', {
        isConnected: isConnectedRef.current,
        isAuthenticated: isAuthenticatedRef.current,
        hasToken: !!token,
      });

      const response = await fetchWithAuth('/api/pops');

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
            router.push('/auth?returnUrl=/pops');
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
      console.log('POPs fetched successfully:', { count: data.pops?.length || 0 });
      setPops(data.pops || []);
    } catch (err) {
      console.error('Error fetching POPs:', err);
      setError('Failed to load POPs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized fetch function with minimal dependencies
  const fetchPops = useCallback(() => {
    // Skip fetch if we're in cooldown
    if (!authInCooldown) {
      doFetchPops();
    }
  }, [authInCooldown, router]);

  // Only fetch on initial load and when auth/connection state actually changes
  useEffect(() => {
    // Only fetch if we're connected and authenticated and not in cooldown
    if (isConnected && isAuthenticated && !authInCooldown) {
      fetchPops();
    } else {
      // Clear existing data when not connected/authenticated
      setPops([]);
    }
  }, [isConnected, isAuthenticated, fetchPops, authInCooldown]);

  // Handle retry
  const handleRetry = () => {
    // Reset failure tracking on manual retry
    authFailureCount = 0;
    lastAuthFailure = 0;
    setAuthInCooldown(false);
    fetchPops();
  };

  // If not authenticated at this point, show nothing (we should have already redirected)
  if (!isAuthenticated) {
    return null;
  }

  // Main content - only shown to authenticated users
  return (
    <Container>
      <div className="py-10">
        <PageHeader
          title="My POPs"
          subtitle={
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-blue-600" />
              <span>View and manage the POPs you have created</span>
            </div>
          }
          actions={[
            {
              href: '/pops/create',
              label: 'Create POP',
              icon: <Plus className="h-4 w-4 mr-1" />,
              variant: 'default',
            },
          ]}
        />

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

        {/* Loading state - show skeleton loaders */}
        {isLoading && <POPCardSkeletonList count={3} />}

        {/* Show empty state when no POPs are found but user is authenticated */}
        {isConnected && isAuthenticated && !isLoading && pops.length === 0 ? (
          <EmptyState message="You haven't created any POPs yet. Click 'Create POP' to get started." />
        ) : !isLoading && pops.length > 0 && (
          <div className="space-y-6">
            {pops.map(pop => (
              <POPCard key={pop.id} pop={pop} />
            ))}
          </div>
        )}

        {/* Show authentication prompt */}
        {isConnected && !isAuthenticated && !authInCooldown && (
          <EmptyState
            message="Authentication required to view the POPs you've created. Please authenticate your wallet to continue."
            buttonText="Authenticate Wallet"
            showButton={true}
            buttonAction={() => {
              window.location.href = '/auth?returnUrl=/pops';
            }}
            icon={<Award className="h-8 w-8 text-neutral-400" />}
          />
        )}

        {/* Show connect wallet prompt */}
        {!isConnected && (
          <EmptyState
            message="Connect your Solana wallet to view the POPs you've created."
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
