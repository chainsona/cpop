import { useState, useCallback, useRef, useEffect } from 'react';
import { TokenResponse, BlockchainTokenData, Metadata } from '../types';
import { toast } from 'sonner';
import { mintPOPTokens } from '@/lib/mint-tokens-utils';

/**
 * A custom hook for managing token data, blockchain data, and metadata
 * with clean loading states and proper error handling.
 */
export const useTokenData = (
  id: string,
  isAuthenticated: boolean,
  authenticate: () => Promise<boolean>
) => {
  // ----------------
  // Configuration
  // ----------------
  
  // DISABLED: Completely disable token metadata loading as requested
  const METADATA_LOADING_ENABLED = false;
  
  // ----------------
  // State management
  // ----------------
  
  // Core data states
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [blockchainData, setBlockchainData] = useState<BlockchainTokenData | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [hasDistributionMethods, setHasDistributionMethods] = useState(false);

  // Unified loading state
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean;
    isRefreshing: boolean;
    isMintLoading: boolean;
    blockchainDataLoading: boolean;
    metadataLoading: boolean;
  }>({
    isLoading: true,
    isRefreshing: false,
    isMintLoading: false,
    blockchainDataLoading: false,
    metadataLoading: false,
  });

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // ----------------
  // Internal refs for controlling data flow
  // ----------------
  const isMounted = useRef(true);
  const mintTimeRef = useRef<number | null>(null);
  const initialLoadComplete = useRef(false);
  const metadataLoaded = useRef(METADATA_LOADING_ENABLED ? false : true); // Always consider loaded if disabled
  const metadataLoadAttempted = useRef(METADATA_LOADING_ENABLED ? false : true); // Always consider attempted if disabled
  const lastMetadataFetchTime = useRef(0);
  const metadataUpdateCount = useRef(0);
  const fetchCount = useRef(0);
  
  // Cache metadata response to prevent unnecessary state updates
  const metadataCache = useRef<{
    data: Metadata | null;
    error: string | null;
    fetchTime: number,
  }>({
    data: null,
    error: null,
    fetchTime: 0,
  });
  
  // Prevent concurrent operations
  const fetchInProgress = useRef({
    token: false,
    blockchain: false,
    metadata: false,
    distribution: false,
  });

  // Track if any metadata fetch was queued during another fetch
  const pendingMetadataFetch = useRef(false);
  
  // Force complete loading after max attempts
  const maxLoadAttempts = 3;

  // ----------------
  // Computed properties
  // ----------------
  const isAnyOperationInProgress = 
    loadingState.isLoading || 
    loadingState.isRefreshing || 
    loadingState.blockchainDataLoading || 
    (METADATA_LOADING_ENABLED ? loadingState.metadataLoading : false);

  // Helper to check if token actually exists and is minted
  const hasValidToken = useCallback(() => {
    // Check if we have all the necessary token data
    return Boolean(
      tokenData && 
      tokenData.tokenMinted === true && 
      tokenData.token?.mintAddress
    );
  }, [tokenData]);
  
  // Helper to check if token has metadata URI 
  const hasMetadataUri = useCallback(() => {
    // If metadata loading is disabled, always return false
    if (!METADATA_LOADING_ENABLED) return false;
    
    // Token data might include metadataUri property which indicates metadata exists
    return Boolean(
      tokenData && 
      tokenData.token && 
      // Use safe optional chaining with 'as any' to avoid TypeScript errors
      (tokenData.token as any)?.metadataUri
    );
  }, [tokenData]);

  // ----------------
  // Helper functions
  // ----------------
  
  // Helper to validate a successful response
  const validateResponse = async (response: Response, errorMsg: string) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
      const detailedError = errorData.error || `HTTP error ${response.status}: ${errorMsg}`;
      throw new Error(detailedError);
    }
    return response;
  };
  
  // Helper to safely update state only if component is mounted
  const safeSetState = <T>(
    setter: (value: T | ((prev: T) => T)) => void,
    value: T | ((prev: T) => T)
  ) => {
    if (isMounted.current) {
      setter(value);
    }
  };

  // Helper to update loading state
  const updateLoadingState = (newState: Partial<typeof loadingState>) => {
    safeSetState(setLoadingState, prev => ({ ...prev, ...newState }));
  };
  
  // Add timeout to any promise
  const withTimeout = <T>(
    promise: Promise<T>,
    timeoutMs: number,
    operation: string
  ): Promise<T> => {
    const timeoutPromise = new Promise<T>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error(`${operation} operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  };
  
  // Helper to check if we should update metadata state (prevents unnecessary updates)
  const shouldUpdateMetadataState = (
    newData: Metadata | null,
    newError: string | null
  ): boolean => {
    // If metadata loading is disabled, never update
    if (!METADATA_LOADING_ENABLED) return false;
    
    // If the data hash matches current cache, don't update
    const newHash = newData ? JSON.stringify(newData) : '';
    const currentHash = metadataCache.current.data
      ? JSON.stringify(metadataCache.current.data)
      : '';
    
    const dataChanged = newHash !== currentHash;
    const errorChanged = newError !== metadataCache.current.error;
    
    // Only update if data or error changed
    return dataChanged || errorChanged;
  };
  
  // Force complete loading and ensure content is shown
  const forceCompleteLoading = useCallback(() => {
    if (loadingState.isLoading) {
      console.log('Forcing loading to complete');
      updateLoadingState({ 
        isLoading: false,
        isRefreshing: false,
        blockchainDataLoading: false,
        metadataLoading: false 
      });
      initialLoadComplete.current = true;
    }
  }, [loadingState.isLoading]);

  // ----------------
  // Core data fetching functions
  // ----------------
  
  // Fetch token data
  const fetchTokenData = useCallback(
    async (isRefresh = false): Promise<TokenResponse | null> => {
      // Increment fetch count to track number of attempts
      fetchCount.current += 1;
      
      // Prevent concurrent fetches
      if (fetchInProgress.current.token) {
        console.log('Token data fetch already in progress, skipping');
        return null;
      }
      
      // Force complete loading after max attempts
      if (fetchCount.current > maxLoadAttempts && !isRefresh) {
        console.log(`Reached max token fetch attempts (${maxLoadAttempts}), forcing completion`);
        forceCompleteLoading();
        return tokenData;
      }
      
      if (!isAuthenticated) {
        safeSetState(setError, 'You must connect your wallet to view token details');
        forceCompleteLoading();
        return null;
      }
      
      fetchInProgress.current.token = true;
      const startTime = Date.now();
      
      // Update loading state
      if (isRefresh) {
        updateLoadingState({ isRefreshing: true });
      } else if (!initialLoadComplete.current) {
        updateLoadingState({ isLoading: true });
      }
      
      try {
        // Get auth token 
        const solanaToken = localStorage.getItem('solana_auth_token');
        
        // Prepare headers
        const headers: HeadersInit = {};
        if (solanaToken) {
          headers['Authorization'] = `Solana ${solanaToken}`;
        }
        
        // Add cache-busting parameter
        const response = await withTimeout(
          fetch(`/api/pops/${id}/token?_=${Date.now()}`, {
            headers,
            cache: 'no-store',
          }),
          8000, 
          'Token data fetch'
        );
        
        // Validate response
        await validateResponse(response, 'Failed to fetch token data');
        
        // Parse data
        const data = await response.json();
        console.log(`Token data fetched in ${Date.now() - startTime}ms`);
        
        // Update state
        safeSetState(setTokenData, data);
        safeSetState(setError, null);
        
        return data;
      } catch (error) {
        console.error('Error fetching token data:', error);
        
        if (error instanceof Error) {
          if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            safeSetState(setError, 'You must connect your wallet to view token details');
          } else {
            safeSetState(setError, `Failed to load token data: ${error.message}`);
          }
        }
        
        // Complete loading even if fetch fails
        if (fetchCount.current >= maxLoadAttempts) {
          forceCompleteLoading();
        }
        
        return null;
      } finally {
        fetchInProgress.current.token = false;
        
        // Reset loading states
        if (isRefresh) {
          updateLoadingState({ isRefreshing: false });
        } else if (fetchCount.current >= maxLoadAttempts) {
          // Force complete loading after max attempts
          forceCompleteLoading();
        }
      }
    },
    [id, isAuthenticated, tokenData, forceCompleteLoading]
  );

  // Fetch blockchain data
  const fetchBlockchainData = useCallback(async (): Promise<BlockchainTokenData | null> => {
    // Skip if no token or mint address
    if (!hasValidToken()) return null;
    
    // Prevent concurrent fetches
    if (fetchInProgress.current.blockchain) {
      console.log('Blockchain data fetch already in progress, skipping');
      return null;
    }
    
    fetchInProgress.current.blockchain = true;
    updateLoadingState({ blockchainDataLoading: true });
    
    try {
      // Get auth token
      const solanaToken = localStorage.getItem('solana_auth_token');
      if (!solanaToken) {
        throw new Error('Authentication token not found');
      }
      
      // Fetch data
      const response = await withTimeout(
        fetch(`/api/pops/${id}/token/blockchain-supply`, {
          headers: { Authorization: `Solana ${solanaToken}` },
        }),
        8000,
        'Blockchain data fetch'
      );
      
      // Validate response
      await validateResponse(response, 'Failed to fetch blockchain data');
      
      // Parse and update state
      const data = await response.json();
      safeSetState(setBlockchainData, data);
      safeSetState(setBlockchainError, null);
      
      return data;
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      
      if (error instanceof Error) {
        safeSetState(setBlockchainError, error.message);
      }
      
      return null;
    } finally {
      fetchInProgress.current.blockchain = false;
      updateLoadingState({ blockchainDataLoading: false });
    }
  }, [id, hasValidToken]);

  // Fetch metadata - DISABLED
  const fetchMetadata = useCallback(
    async (forceRefresh = false): Promise<Metadata | null> => {
      // Skip all metadata loading if disabled
      if (!METADATA_LOADING_ENABLED) {
        console.log('Metadata loading is disabled, skipping fetch');
        return null;
      }
      
      // Rest of the existing fetchMetadata implementation 
      // (keeping it for future use but it won't be called)
      
      // Skip if missing token data or not minted
      if (!hasValidToken()) {
        console.log('Token not valid, skipping metadata fetch');
        return null;
      }
      
      // Skip if already loaded and not forcing refresh
      if (metadataLoaded.current && metadata && !forceRefresh) {
        console.log('Metadata already loaded, skipping fetch');
        return metadata;
      }
      
      // Prevent redundant fetches (rate limiting)
      const now = Date.now();
      const timeSinceLastFetch = now - lastMetadataFetchTime.current;
      if (timeSinceLastFetch < 5000 && !forceRefresh && metadataLoadAttempted.current) {
        console.log(
          `Skipping metadata fetch - too soon (${timeSinceLastFetch}ms since last fetch)`
        );
        return metadata;
      }
      
      // If a fetch is already in progress, mark it as pending and return
      if (fetchInProgress.current.metadata) {
        console.log('Metadata fetch already in progress, marking as pending');
        pendingMetadataFetch.current = true;
        return null;
      }
      
      // Mark fetch as in progress and update timestamp
      fetchInProgress.current.metadata = true;
      lastMetadataFetchTime.current = now;
      metadataLoadAttempted.current = true;
      updateLoadingState({ metadataLoading: true });
      
      console.log(`Starting metadata fetch #${metadataUpdateCount.current + 1}`);
      
      try {
        // Simulate successful completion since it's disabled
        return null;
      } catch (error) {
        console.error('Error fetching metadata:', error);
        return null;
      } finally {
        fetchInProgress.current.metadata = false;
        updateLoadingState({ metadataLoading: false });
      }
    },
    [id, metadata, tokenData, hasValidToken, hasMetadataUri]
  );

  // Fetch distribution methods
  const fetchDistributionMethods = useCallback(async (): Promise<void> => {
    if (fetchInProgress.current.distribution) return;
    
    fetchInProgress.current.distribution = true;
    
    try {
      const response = await withTimeout(
        fetch(`/api/pops/${id}/distribution`),
        5000,
        'Distribution methods fetch'
      );
      
      if (response.ok) {
        const data = await response.json();
        const activeMethods = (data.distributionMethods || []).filter(
          (method: any) => !method.disabled
        );
        
        safeSetState(setHasDistributionMethods, activeMethods.length > 0);
      }
    } catch (error) {
      console.error('Error fetching distribution methods:', error);
    } finally {
      fetchInProgress.current.distribution = false;
    }
  }, [id]);

  // ----------------
  // User actions
  // ----------------
  
  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    // Prevent refreshing if operations are in progress
    if (isAnyOperationInProgress) {
      console.log('Operations in progress, skipping manual refresh');
      return;
    }
    
    console.log('Starting manual refresh');
    
    try {
      // Only reset metadata loaded flag if metadata loading is enabled
      if (METADATA_LOADING_ENABLED) {
        metadataLoaded.current = false;
      }
      
      // Fetch token data first
      const data = await fetchTokenData(true);
      
      // Skip other fetches if token data fetch failed
      if (!data) return;
      
      // Fetch distribution methods
      await fetchDistributionMethods();
      
      // Fetch blockchain data if token is minted
      if (data.tokenMinted && data.token?.mintAddress) {
        await fetchBlockchainData().catch(err =>
          console.error('Error in blockchain data refresh:', err)
        );
          
        // Only fetch metadata if enabled
        if (METADATA_LOADING_ENABLED) {
          await fetchMetadata(true).catch(err => 
            console.error('Error in metadata refresh:', err)
          );
        }
      }
      
      toast.success('Token information refreshed');
    } catch (error) {
      console.error('Error during manual refresh:', error);
      toast.error('Failed to refresh data. Please try again.');
    }
  }, [
    fetchTokenData,
    fetchDistributionMethods,
    fetchBlockchainData,
    fetchMetadata,
    isAnyOperationInProgress,
  ]);

  // Debounced refresh
  const debouncedRefresh = useCallback(
    (() => {
      let timeout: NodeJS.Timeout | null = null;
      return () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => handleManualRefresh(), 300);
      };
    })(),
    [handleManualRefresh]
  );

  // Mint tokens
  const handleMintTokens = useCallback(
    async (
      onMintStart: () => void,
      setMintSuccess: () => void,
      setMintError: (error: string) => void,
      newSupply?: number
    ) => {
      // Set loading state
      updateLoadingState({ isMintLoading: true });
      
      try {
        const supplyToMint = newSupply || 100;
        
        // Use mint utility
        await mintPOPTokens({
          popId: id,
          authenticate,
          isAuthenticated,
          onMintStart,
          onSuccess: () => {
            // Update UI optimistically
            safeSetState(setTokenData, prev => {
              if (!prev) return null;
              return {
                ...prev,
                tokenMinted: true,
                tokenSupply: supplyToMint,
              };
            });
            
            // Set success state
            setMintSuccess();
            
            // Record mint time
            mintTimeRef.current = Date.now();
            
            // Reset metadata loaded flag if metadata loading is enabled
            if (METADATA_LOADING_ENABLED) {
              metadataLoaded.current = false;
            }
            
            // Refresh token data
            fetchTokenData(true);
          },
          onError: error => {
            setMintError(error);
          },
        });
      } catch (err) {
        console.error('Error minting tokens:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to mint tokens. Please try again.';
        toast.error(errorMessage);
        setMintError(errorMessage);
      } finally {
        updateLoadingState({ isMintLoading: false });
      }
    },
    [id, isAuthenticated, authenticate, fetchTokenData]
  );

  // ----------------
  // Lifecycle hooks
  // ----------------
  
  // Safety timer to force exit from loading state
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      forceCompleteLoading();
    }, 5000); // 5 seconds max loading time (reduced from 10)
    
    return () => clearTimeout(safetyTimer);
  }, [forceCompleteLoading]);
  
  // Initial data loading
  useEffect(() => {
    // Prevent multiple initializations
    if (initialLoadComplete.current) return;
    
    console.log('Starting initial data load (metadata loading disabled)');
    
    // Data loading function
    const loadInitialData = async () => {
      try {
        // Step 1: Fetch token data
        const data = await fetchTokenData();
        
        // Early exit if token data fetch failed
        if (!data) {
          console.log('Token data fetch failed, completing initialization anyway');
          initialLoadComplete.current = true;
          updateLoadingState({ isLoading: false });
          return;
        }
        
        // Check if we have a valid token - if not, skip additional fetching
        const isValidToken = data.tokenMinted && data.token?.mintAddress;
        
        // Fetch distribution methods (doesn't depend on token data)
        await fetchDistributionMethods();
        
        // Step 2: If token is minted, fetch blockchain data
        if (isValidToken) {
          await fetchBlockchainData().catch(err =>
            console.error('Error loading blockchain data:', err)
          );
          
          // Skip metadata fetching completely
          console.log('Skipping metadata fetching as requested');
        }
      } catch (error) {
        console.error('Error during initial data load:', error);
      } finally {
        // Mark as complete regardless of success/failure
        initialLoadComplete.current = true;
        
        // Ensure loading state is set to false
        setTimeout(() => {
          forceCompleteLoading();
        }, 300);
      }
    };
    
    // Start loading
    loadInitialData();
    
    // Safety timeout to ensure we exit loading state
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && loadingState.isLoading) {
        console.log('Safety timeout reached, forcing exit from loading state');
        forceCompleteLoading();
      }
    }, 6000); // Shorter timeout (6 seconds)
    
    // Cleanup function
    return () => {
      clearTimeout(safetyTimeout);
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ----------------
  // Return values
  // ----------------
  return {
    // Data
    tokenData,
    blockchainData,
    metadata: null, // Always return null for metadata since loading is disabled
    hasDistributionMethods,
    
    // Loading states
    isLoading: loadingState.isLoading,
    isRefreshing: loadingState.isRefreshing,
    isBlockchainLoading: loadingState.blockchainDataLoading,
    isMetadataLoading: false, // Always return false since loading is disabled
    isAnyOperationInProgress,
    
    // Errors
    error,
    blockchainError,
    metadataError: null, // Always return null for metadata error
    
    // Actions
    setError: (newError: string | null) => safeSetState(setError, newError),
    setIsLoading: (loading: boolean) => updateLoadingState({ isLoading: loading }),
    fetchTokenData,
    fetchBlockchainData,
    fetchMetadata, // Keep the function but it will do nothing
    handleMintTokens,
    handleManualRefresh: debouncedRefresh,
  };
};
