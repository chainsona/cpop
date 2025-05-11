import { useState, useCallback, useRef, useEffect } from 'react';
import { TokenResponse, BlockchainTokenData, Metadata } from '../types';
import { toast } from 'sonner';
import { mintPOAPTokens } from '@/lib/mint-tokens-utils';

export const useTokenData = (
  id: string,
  isAuthenticated: boolean,
  authenticate: () => Promise<boolean>
) => {
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDistributionMethods, setHasDistributionMethods] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mintTimeRef = useRef<number | null>(null);

  // Add state for blockchain token data
  const [blockchainData, setBlockchainData] = useState<BlockchainTokenData | null>(null);
  const [isBlockchainLoading, setIsBlockchainLoading] = useState(false);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);

  // Add state for metadata
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Enhanced token data fetching with refresh capability
  const fetchTokenData = useCallback(
    async (showLoadingState = true, isRefreshOp = false) => {
      try {
        if (showLoadingState) {
          if (isRefreshOp) {
            setIsRefreshing(true);
          } else {
            setIsLoading(true);
          }
        }

        setError(null);

        // Don't attempt fetch if not authenticated
        if (!isAuthenticated) {
          setError('Unauthorized');
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }

        // Get Solana auth token directly from localStorage as stored by the wallet context
        const solanaToken =
          typeof window !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;

        // Create headers with Solana auth token if available
        const headers: HeadersInit = {};
        if (solanaToken) {
          headers['Authorization'] = `Solana ${solanaToken}`;
        }

        // Add cache-busting parameter to ensure fresh data
        const cacheBuster = Date.now();
        const response = await fetch(`/api/poaps/${id}/token?_=${cacheBuster}`, {
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            setError('Unauthorized');
          } else {
            throw new Error(errorData.error || 'Failed to fetch token data');
          }
        } else {
          const data = await response.json();
          // Check if data has actually changed before updating state
          if (JSON.stringify(data) !== JSON.stringify(tokenData)) {
            setTokenData(data);
          }
        }
      } catch (err) {
        console.error('Error fetching token data:', err);
        // Only set error if not a refresh operation
        if (!isRefreshOp) {
          setError(err instanceof Error ? err.message : 'Failed to load token data');
        }
      } finally {
        if (showLoadingState) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [id, isAuthenticated, tokenData]
  );

  // Fetch distribution methods
  const fetchDistributionMethods = useCallback(async () => {
    try {
      const response = await fetch(`/api/poaps/${id}/distribution`);

      if (response.ok) {
        const data = await response.json();
        // Check if there are any active (non-disabled) distribution methods
        const activeMethods = (data.distributionMethods || []).filter(
          (method: any) => !method.disabled
        );
        setHasDistributionMethods(activeMethods.length > 0);
      }
    } catch (error) {
      console.error('Error fetching distribution methods:', error);
    }
  }, [id]);

  // Start polling for token updates
  const startPolling = useCallback(() => {
    // Only start polling if there isn't already a polling interval
    if (!pollingIntervalRef.current) {
      setIsPolling(true);

      // Start with more frequent checks right after a mint operation
      const isMintRecent = mintTimeRef.current && Date.now() - mintTimeRef.current < 10000;
      const initialInterval = isMintRecent ? 2000 : 5000;

      pollingIntervalRef.current = setInterval(() => {
        const timeSinceMint = mintTimeRef.current ? Date.now() - mintTimeRef.current : Infinity;

        // More aggressive polling right after mint, then reduce frequency
        if (timeSinceMint < 10000) {
          fetchTokenData(false, true); // Silent refresh
        } else if (timeSinceMint < 30000) {
          // After 10 seconds, check less frequently
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = setInterval(() => {
              fetchTokenData(false, true); // Silent refresh
            }, 5000);
          }
        } else {
          // After 30 seconds, stop polling
          stopPolling();
        }
      }, initialInterval);
    }
  }, [fetchTokenData]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Initial data load
  useEffect(() => {
    fetchTokenData();
    fetchDistributionMethods();
  }, [id, fetchTokenData, fetchDistributionMethods]);

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchTokenData();
    } else if (error === 'Unauthorized') {
      authenticate().then(success => {
        if (success) {
          setError(null);
          fetchTokenData();
        }
      });
    }
  }, [isAuthenticated, error, id, authenticate, fetchTokenData]);

  // Add a function to fetch blockchain token data
  const fetchBlockchainTokenData = useCallback(async () => {
    if (!id || !tokenData?.token?.mintAddress) return;

    try {
      setIsBlockchainLoading(true);
      setBlockchainError(null);

      // Get auth token for API request
      const solanaToken =
        typeof window !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;

      if (!solanaToken) {
        setBlockchainError('Authentication token not found');
        console.error('Authentication token not found for blockchain data fetch');
        return;
      }

      const response = await fetch(`/api/poaps/${id}/token/blockchain-supply`, {
        headers: {
          Authorization: `Solana ${solanaToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `HTTP error ${response.status}`;
        setBlockchainError(errorMessage);
        console.error('Failed to fetch blockchain token data:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        return;
      }

      const data = await response.json();
      setBlockchainData(data);
      setBlockchainError(null);
    } catch (error) {
      setBlockchainError(error instanceof Error ? error.message : 'Unknown error');
      console.error('Error fetching blockchain token data:', error);
    } finally {
      setIsBlockchainLoading(false);
    }
  }, [id, tokenData?.token?.mintAddress]);

  // Add metadata fetching function
  const fetchMetadata = useCallback(async () => {
    try {
      setIsMetadataLoading(true);
      setMetadataError(null);

      if (!tokenData?.token?.mintAddress) {
        setMetadata(null);
        setMetadataError('No token has been created for this POAP yet.');
        return;
      }

      // Fetch the token metadata
      const metadataResponse = await fetch(`/api/poaps/${id}/token/metadata`);
      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch token metadata');
      }

      const metadataData = await metadataResponse.json();
      setMetadata(metadataData.metadata);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setMetadataError('Failed to load metadata. Please try again later.');
    } finally {
      setIsMetadataLoading(false);
    }
  }, [id, tokenData?.token?.mintAddress]);

  // Update the useEffect to also fetch blockchain data and metadata when tokens are minted
  useEffect(() => {
    if (tokenData?.tokenMinted) {
      fetchBlockchainTokenData();
      fetchMetadata();
    }
  }, [tokenData?.tokenMinted, fetchBlockchainTokenData, fetchMetadata]);

  // Enhanced mint tokens function with proper refresh
  const handleMintTokens = async (
    onMintStart: () => void,
    setMintSuccess: () => void,
    setMintError: (error: string) => void,
    newSupply?: number
  ) => {
    try {
      setIsLoading(true);
      const supplyToMint = newSupply || 100;
      
      // Use the centralized mint utility
      await mintPOAPTokens({
        poapId: id,
        authenticate,
        isAuthenticated,
        onMintStart,
        onSuccess: () => {
          // Update UI optimistically
          setTokenData(prevData => {
            if (!prevData) return null;
            return {
              ...prevData,
              tokenMinted: true,
              tokenSupply: supplyToMint,
            };
          });
          
          // Set the modal to success state
          setMintSuccess();
          
          // Record mint time for polling
          mintTimeRef.current = Date.now();
          
          // Start polling for token updates
          startPolling();
          
          // Fetch immediately as well
          fetchTokenData(false, true);
        },
        onError: (error) => {
          setMintError(error);
        }
      });
    } catch (err) {
      console.error('Error minting tokens:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint tokens. Please try again.';
      toast.error(errorMessage);
      setMintError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add metadata to manual refresh
  const handleManualRefresh = useCallback(() => {
    fetchTokenData(true, true)
      .then(() => {
        fetchBlockchainTokenData();
        fetchMetadata();
        toast.success('Token information refreshed');
      })
      .catch(() => {});
  }, [fetchTokenData, fetchBlockchainTokenData, fetchMetadata]);

  return {
    tokenData,
    isLoading,
    isRefreshing,
    error,
    setError,
    setIsLoading,
    hasDistributionMethods,
    isPolling,
    blockchainData,
    isBlockchainLoading,
    blockchainError,
    metadata,
    isMetadataLoading,
    metadataError,
    fetchTokenData,
    fetchBlockchainTokenData,
    fetchMetadata,
    handleMintTokens,
    handleManualRefresh,
  };
}; 