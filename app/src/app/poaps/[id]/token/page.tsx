'use client';

import { ArrowLeft, Coins, RefreshCcw, InfoIcon, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { POAPTabNav } from '@/components/poap/poap-tab-nav';
import { TokenStatusAlert } from '@/components/poap/token-status-alert';
import { useWalletContext } from '@/contexts/wallet-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { POAPMintModal } from '@/components/poap/poap-mint-modal';
import { usePOAPMintModal } from '@/hooks/use-poap-mint-modal';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Import custom hooks and components
import { useTokenData } from './hooks/useTokenData';
import { TokenOverview } from './components/TokenOverview';
import { ErrorMessage } from './components/ErrorMessage';
import { MetadataViewer } from './components/MetadataViewer';

export default function POAPTokenPage() {
  const pathname = usePathname();
  const id = pathname.split('/')[2]; // Extract ID from URL path: /poaps/[id]/token
  const { isConnected, connecting, isAuthenticated, authenticate, connect } = useWalletContext();
  const [walletPrompted, setWalletPrompted] = useState(false);

  // Add refs at the top level
  const hasAttemptedFetch = useRef(false);
  const hasTriggeredAutoRefresh = useRef(false);

  // Use custom hooks
  const { modalState, openMintingModal, setMintSuccess, setMintError, onOpenChange } =
    usePOAPMintModal();

  const {
    tokenData,
    isLoading,
    isRefreshing,
    error,
    setError,
    setIsLoading,
    hasDistributionMethods,
    isAnyOperationInProgress,
    blockchainData,
    isBlockchainLoading,
    blockchainError,
    metadata,
    isMetadataLoading,
    metadataError,
    fetchTokenData,
    fetchBlockchainData,
    fetchMetadata,
    handleMintTokens,
    handleManualRefresh,
  } = useTokenData(id, isAuthenticated, authenticate);

  // Add type guards for string checking
  const isErrorString = (error: unknown): error is string => {
    return typeof error === 'string';
  };

  // Helper function to attempt wallet connection - memoized to avoid dependency issues
  const connectWallet = useCallback(async () => {
    try {
      if (!isConnected) {
        await connect();

        // Indicate wallet connection status for future reference
        if (typeof window !== 'undefined') {
          localStorage.setItem('walletConnected', 'true');
        }

        toast.success('Wallet connected successfully');
        // Authentication will be attempted automatically by wallet-context
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    }
  }, [isConnected, connect]);

  // Effect to check wallet connection on page load
  useEffect(() => {
    // One-time operation to avoid multiple connection attempts
    if (!isConnected && !connecting && !walletPrompted && typeof window !== 'undefined') {
      // Set wallet connection status in localStorage for other components to check
      localStorage.setItem('walletConnected', 'false');

      console.log('Wallet not connected, prompting connection');
      setWalletPrompted(true);

      // Attempt to connect with a slight delay
      setTimeout(() => {
        connectWallet();
      }, 500);
    } else if (isConnected && typeof window !== 'undefined') {
      // Update localStorage when connected
      localStorage.setItem('walletConnected', 'true');
    }
  }, [isConnected, connecting, walletPrompted, connectWallet]);

  // Add authentication monitoring effect
  useEffect(() => {
    // Only try to fetch data when authenticated and we haven't already tried
    if (isAuthenticated && !hasAttemptedFetch.current) {
      console.log('Authentication confirmed, fetching token data');
      hasAttemptedFetch.current = true;

      // Add a small delay to let authentication fully process
      setTimeout(() => {
        fetchTokenData()
          .then(() => {
            console.log('Token data loaded, fetching metadata');
            // Pass a single forceRefresh parameter
            if (!isAnyOperationInProgress) {
              return fetchMetadata(true);
            }
          })
          .catch(err => console.error('Error in data loading sequence:', err));
      }, 500);
    }

    // Reset the attempt flag when authentication changes
    return () => {
      hasAttemptedFetch.current = false;
    };
  }, [isAuthenticated, fetchTokenData, fetchMetadata, isAnyOperationInProgress]);

  // Add a proper wrapper for fetchTokenData that returns Promise<void>
  const handleFetchTokenData = useCallback(async (): Promise<void> => {
    await fetchTokenData();
  }, [fetchTokenData]);

  // Helper to check and safely use string methods on potentially non-string values
  const safeStringIncludes = (value: unknown, searchString: string): boolean => {
    return typeof value === 'string' && value.includes(searchString);
  };

  // Auto-refresh metadata when needed
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;

    // Automatically trigger a refresh once if we have an auth error
    // but only if we haven't already done one and no operation is in progress
    if (
      isAuthenticated &&
      metadataError &&
      safeStringIncludes(metadataError, 'authorized') &&
      !isRefreshing &&
      !isAnyOperationInProgress &&
      !hasTriggeredAutoRefresh.current
    ) {
      console.log('Auth error detected, triggering automatic refresh');
      // Set flag to prevent additional auto-refresh
      hasTriggeredAutoRefresh.current = true;

      // Add slight delay to avoid race conditions
      setTimeout(() => {
        handleManualRefresh();
      }, 1500);
    }

    // Only set up auto-refresh for preparation errors (not auth errors)
    // and only if no operation is currently in progress
    if (
      isAuthenticated &&
      tokenData?.tokenMinted &&
      metadataError &&
      (safeStringIncludes(metadataError, 'being prepared') ||
        safeStringIncludes(metadataError, 'not available yet')) &&
      !safeStringIncludes(metadataError, 'authorized') && // Skip for auth errors as we handle them differently
      !isAnyOperationInProgress && // Don't set up refresh if any operation is in progress
      !refreshInterval // Only if we don't already have an interval
    ) {
      console.log('Setting up metadata refresh interval for "in preparation" state');
      // Set up a refresh interval (every 15 seconds to reduce server load and flickering)
      refreshInterval = setInterval(() => {
        // Only refresh if no operation is in progress
        if (!isAnyOperationInProgress) {
          console.log('Auto-refreshing metadata (preparation state)');
          // Force refresh with a single parameter
          fetchMetadata(true).catch(err => console.error('Auto-refresh metadata error:', err));
        } else {
          console.log('Skipping auto-refresh - operation in progress');
        }
      }, 15000); // Increased to 15 seconds
    }

    // Clean up interval on component unmount or when dependencies change
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        console.log('Cleared metadata refresh interval');
      }
    };
  }, [
    isAuthenticated,
    tokenData,
    metadataError,
    fetchMetadata,
    handleManualRefresh,
    isRefreshing,
    isAnyOperationInProgress,
  ]);

  // Add a wrapper function for fetchBlockchainData
  const handleFetchBlockchainData = useCallback(async (): Promise<void> => {
    await fetchBlockchainData();
  }, [fetchBlockchainData]);

  // Render wallet connection UI if not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href={`/poaps/${id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-neutral-600 hover:text-neutral-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to POAP
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <POAPTabNav poapId={id} />
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Token Management</h2>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <div className="inline-block p-4 bg-amber-100 rounded-full mb-4">
              <Wallet className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-amber-800 mb-2">
              Wallet Connection Required
            </h3>
            <p className="text-amber-700 mb-6 max-w-md mx-auto">
              Please connect your wallet to view and manage token information for this POAP.
            </p>
            <Button
              onClick={connectWallet}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render main UI when wallet is connected
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/poaps/${id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to POAP
            </Button>
          </Link>
        </div>

        {/* Use the shared tab navigation */}
        <div className="mb-8">
          <POAPTabNav poapId={id} />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Token Management</h2>
          <div className="flex items-center gap-2">
            {isAnyOperationInProgress && (
              <div className="text-xs text-neutral-500 flex items-center">
                <RefreshCcw className="h-3 w-3 animate-spin mr-1" />
                Syncing...
              </div>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleManualRefresh}
                    disabled={isLoading || isRefreshing}
                  >
                    <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to refresh token data and metadata</p>
                  {safeStringIncludes(metadataError, 'authorized') && (
                    <p className="font-semibold text-red-500">Click to fix authorization errors</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Show token status alert if no tokens have been minted */}
        {tokenData && !tokenData.tokenMinted && (
          <TokenStatusAlert
            tokenStatus={{
              minted: tokenData.tokenMinted,
            }}
            poapId={id}
            hasDistributionMethods={hasDistributionMethods}
            onTokensMinted={() => handleMintTokens(openMintingModal, setMintSuccess, setMintError)}
          />
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading token information...</p>
          </div>
        ) : error ? (
          <ErrorMessage
            error={error}
            isLoading={isLoading}
            isConnected={isConnected}
            isAuthenticated={isAuthenticated}
            authenticate={authenticate}
            fetchTokenData={handleFetchTokenData}
            setIsLoading={setIsLoading}
            setError={setError}
            id={id}
          />
        ) : !tokenData?.tokenMinted ? (
          <div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8 text-center mb-6">
              <div className="inline-block p-4 bg-neutral-100 rounded-full mb-4">
                <Coins className="h-8 w-8 text-neutral-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                No Token Information Available
              </h3>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                Mint your POAP token to view details. Set up distribution methods to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/poaps/${id}/distribution`}>
                  <Button variant="outline" className="gap-1.5 w-full sm:w-auto">
                    Set Up Distribution
                  </Button>
                </Link>
                {hasDistributionMethods && (
                  <Button
                    className="gap-1.5 w-full sm:w-auto bg-amber-600 text-white hover:bg-amber-700"
                    onClick={() => {
                      handleMintTokens(openMintingModal, setMintSuccess, setMintError);
                    }}
                    disabled={isLoading}
                  >
                    <Coins className="h-4 w-4" />
                    Mint POAP Token
                  </Button>
                )}
              </div>
            </div>

            {/* Always show metadata section even when no token is created */}
            <div className="mt-6">
              <MetadataViewer
                metadata={metadata}
                isMetadataLoading={isMetadataLoading}
                metadataError={metadataError}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Token Details</h2>

            {/* Token Overview */}
            <TokenOverview
              token={tokenData.token}
              tokenSupply={tokenData.tokenSupply}
              blockchainData={blockchainData}
              isBlockchainLoading={isBlockchainLoading}
              blockchainError={blockchainError}
              fetchBlockchainTokenData={handleFetchBlockchainData}
            />

            {/* Metadata Content - Always show metadata viewer */}
            <div className="mt-6">
              <MetadataViewer
                metadata={metadata}
                isMetadataLoading={isMetadataLoading}
                metadataError={metadataError}
              />
            </div>
          </div>
        )}

        {/* Add the POAPMintModal component to the JSX */}
        <POAPMintModal
          open={modalState.open}
          onOpenChange={onOpenChange}
          status={modalState.status}
          error={modalState.error}
          poapId={id}
          poapTitle={tokenData?.poap?.title}
        />
      </div>
    </div>
  );
}
