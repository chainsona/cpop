'use client';

import { ArrowLeft, Copy, ExternalLink, QrCode, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { POAPTabNav } from '@/components/poap/poap-tab-nav';
import { Coins } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TokenStatusAlert } from '@/components/poap/token-status-alert';
import { useWalletContext } from '@/contexts/wallet-context';

// Interface for token data
interface PoapData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

// Token structure from the database
interface TokenData {
  id: string;
  mintAddress: string;
  supply: number;
  decimals: number;
  createdAt: string;
  claimed?: number;
  available?: number;
}

// Interface for token response
interface TokenResponse {
  token: TokenData | null;
  tokenMinted: boolean;
  tokenSupply: number;
  poap: PoapData;
}

export default function POAPTokenPage() {
  const pathname = usePathname();
  const id = pathname.split('/')[2]; // Extract ID from URL path: /poaps/[id]/token
  const { isConnected, isAuthenticated, authenticate } = useWalletContext();

  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [hasDistributionMethods, setHasDistributionMethods] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mintTimeRef = useRef<number | null>(null);

  // Enhanced token data fetching with refresh capability
  const fetchTokenData = useCallback(async (showLoadingState = true, isRefreshOp = false) => {
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
  }, [id, isAuthenticated, tokenData]);

  // Wrapper for onClick handler compatibility
  const fetchTokenDataHandler = useCallback(() => {
    fetchTokenData(true, false);
  }, [fetchTokenData]);
  
  // Wrapper for Try Again button in error state
  const tryAgainHandler = useCallback(() => {
    fetchTokenData(true, false);
  }, [fetchTokenData]);

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
      const isMintRecent = mintTimeRef.current && (Date.now() - mintTimeRef.current < 10000);
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

  // Enhanced mint tokens function with proper refresh
  const handleMintTokens = async (newSupply: number) => {
    try {
      setIsLoading(true);
      
      // Ensure we're authenticated before minting tokens
      if (!isAuthenticated) {
        toast.error('Authentication required to mint tokens');
        const success = await authenticate();
        if (!success) {
          setIsLoading(false);
          return;
        }
      }

      // Get the Solana auth token exactly as stored by the wallet context
      const solanaToken =
        typeof window !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;

      if (!solanaToken) {
        toast.error('Authentication token not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      // Make API call to mint tokens
      const response = await fetch(`/api/poaps/${id}/mint`, {
        method: 'POST',
        headers: {
          Authorization: `Solana ${solanaToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
          await authenticate();
        } else {
          throw new Error(errorData.error || 'Failed to mint tokens');
        }
      } else {
        const data = await response.json();

        // Update UI optimistically
        setTokenData(prevData => {
          if (!prevData) return null;
          return {
            ...prevData,
            tokenMinted: true,
            tokenSupply: newSupply,
          };
        });

        toast.success('Tokens minted successfully!');

        // Record mint time for polling
        mintTimeRef.current = Date.now();
        
        // Start polling for token updates
        startPolling();
        
        // Fetch immediately as well
        await fetchTokenData(false, true);
      }
    } catch (err) {
      console.error('Error minting tokens:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to mint tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function for manual refresh with visual indication
  const handleManualRefresh = useCallback(() => {
    fetchTokenData(true, true)
      .then(() => toast.success('Token information refreshed'))
      .catch(() => {});
  }, [fetchTokenData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setIsCopied(true);
        toast.success('Address copied to clipboard');
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast.error('Failed to copy to clipboard');
      });
  };

  // Format a number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Helper function to render external links
  const renderExternalLinks = () => {
    if (!tokenData?.token) {
      return null;
    }

    const mintAddress = tokenData.token.mintAddress;

    return (
      <Card>
        <CardHeader>
          <CardTitle>External Resources</CardTitle>
          <CardDescription>View your token on blockchain explorers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
              <span className="text-purple-700 font-medium">View on Solana Explorer</span>
              <Link href={`https://explorer.solana.com/address/${mintAddress}`} target="_blank">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
              </Link>
            </div>

            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
              <span className="text-purple-700 font-medium">View on Solscan</span>
              <Link href={`https://solscan.io/token/${mintAddress}`} target="_blank">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Debug component for displaying auth state
  const AuthDebugInfo = () => {
    if (!showDebug) return null;

    // Check for token in localStorage
    const hasLocalToken =
      typeof window !== 'undefined' && !!localStorage.getItem('solana_auth_token');

    // Check for token in cookies
    const hasCookieToken =
      typeof document !== 'undefined' &&
      document.cookie.split('; ').some(row => row.startsWith('solana_auth_token='));

    // Check for next-auth session cookie
    const hasNextAuthSession =
      typeof document !== 'undefined' &&
      document.cookie.split('; ').some(row => row.startsWith('next-auth.session-token='));

    // Function to test mint API directly
    const testMintApiDirectly = async () => {
      try {
        toast.info('Testing token minting...');

        // First ensure we're authenticated
        if (!isAuthenticated) {
          toast.warning('Authenticating first...');
          const success = await authenticate();
          if (!success) {
            toast.error('Authentication failed. Cannot proceed with token mint.');
            return;
          }
        }

        // Get token after authentication
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;

        if (!token) {
          toast.error('No Solana auth token found after authentication');
          return;
        }

        console.log('[Debug] Testing mint with token');

        // Make direct API call to mint tokens
        const response = await fetch(`/api/poaps/${id}/mint`, {
          method: 'POST',
          headers: {
            Authorization: `Solana ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('[Debug] Mint API response:', {
          status: response.status,
          data,
        });

        if (response.ok) {
          toast.success('POAP tokens minted successfully!');
          // Refresh the page after successful mint
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.error(`Mint failed: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('[Debug] Error testing mint API:', err);
        toast.error('Error minting tokens');
      }
    };

    return (
      <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-left">
        <h4 className="font-bold mb-2">Authentication Diagnostics:</h4>
        <ul className="space-y-1">
          <li>Connected: {isConnected ? '✅' : '❌'}</li>
          <li>Authenticated: {isAuthenticated ? '✅' : '❌'}</li>
          <li>Solana Token (localStorage): {hasLocalToken ? '✅' : '❌'}</li>
          <li>Solana Token (cookie): {hasCookieToken ? '✅' : '❌'}</li>
          <li>NextAuth Session: {hasNextAuthSession ? '✅' : '❌'}</li>
          <li>Error State: {error || 'None'}</li>
        </ul>
        <div className="mt-2 pt-2 border-t border-gray-300 flex flex-col gap-2">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                authenticate().then(success => {
                  if (success) {
                    toast.success('Re-authenticated successfully');
                    fetchTokenData();
                  } else {
                    toast.error('Re-authentication failed');
                  }
                });
              }
            }}
            className="text-blue-600 hover:text-blue-800 text-xs underline"
          >
            Force Re-authenticate
          </button>

          <button
            onClick={testMintApiDirectly}
            className="text-green-600 hover:text-green-800 text-xs underline"
          >
            Test Mint API Directly
          </button>
        </div>
      </div>
    );
  };

  // Helper function to completely reset authentication state
  const resetAndReauthenticate = async () => {
    try {
      setIsLoading(true);

      // Clear all token storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('solana_auth_token');
      }

      // Clear cookies (in a simple way)
      if (typeof document !== 'undefined') {
        document.cookie = 'solana_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie =
          'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'next-auth.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }

      // Re-authenticate with wallet
      const success = await authenticate();

      if (success) {
        toast.success('Authentication reset successful');
        setError(null);
        fetchTokenData();
      } else {
        toast.error('Failed to re-authenticate after reset');
      }
    } catch (err) {
      console.error('Error during auth reset:', err);
      toast.error('Authentication reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Adding the reset button to error message
  const renderErrorMessage = () => {
    // Handle specific error messages
    if (error === 'Unauthorized') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 mb-4">You need to be logged in to view token information</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  // Try to authenticate with NextAuth
                  const success = await authenticate();
                  if (success) {
                    // On successful authentication, clear error and fetch data
                    toast.success('Authentication successful');
                    setError(null);
                    fetchTokenData();
                  } else {
                    toast.error('Authentication failed. Please try again.');
                  }
                } catch (err) {
                  console.error('Authentication error:', err);
                  toast.error('Authentication process failed');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={fetchTokenDataHandler}
              disabled={isLoading}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              onClick={resetAndReauthenticate}
              disabled={isLoading}
            >
              Reset Auth State
            </Button>
          </div>
          <p className="text-neutral-500 mt-4 text-sm">
            If you're already logged in, your session may have expired. Please log in again or try
            resetting your authentication state.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-neutral-500"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide Diagnostics' : 'Show Diagnostics'}
          </Button>
          <AuthDebugInfo />
        </div>
      );
    } else if (error?.includes('permission')) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 mb-4">
            You don't have permission to view this POAP's token information
          </p>
          <Link href="/poaps">
            <Button>Back to My POAPs</Button>
          </Link>
        </div>
      );
    }

    // Default error message
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={tryAgainHandler}>Try Again</Button>
      </div>
    );
  };

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
            {isPolling && (
              <div className="text-xs text-neutral-500 flex items-center">
                <RefreshCcw className="h-3 w-3 animate-spin mr-1" />
                Syncing...
              </div>
            )}
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
          </div>
        </div>

        {/* Show token status alert if no tokens have been minted */}
        {tokenData && !tokenData.tokenMinted && (
          <TokenStatusAlert
            tokenStatus={{
              minted: tokenData.tokenMinted,
              supply: tokenData.tokenSupply || 0,
            }}
            poapId={id}
            hasDistributionMethods={hasDistributionMethods}
            onTokensMinted={handleMintTokens}
          />
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading token information...</p>
          </div>
        ) : error ? (
          renderErrorMessage()
        ) : !tokenData?.tokenMinted ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8 text-center">
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
                  // Get estimated token count
                  const estimatedTokenCount = 100; // Default estimate
                  handleMintTokens(estimatedTokenCount);
                }}
                disabled={isLoading}
              >
                <Coins className="h-4 w-4" />
                Mint POAP Token
              </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Token Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Coins className="h-5 w-5 text-blue-500 mr-2" />
                  Token Overview
                </CardTitle>
                <CardDescription>Information about your POAP's compressed token</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-2">Supply Status</h3>
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                        <span className="text-blue-700 font-medium">Total Supply</span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">
                          {formatNumber(tokenData.tokenSupply)}
                        </Badge>
                      </div>

                      {tokenData.token && (
                        <>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                            <span className="text-green-700 font-medium">Available Tokens</span>
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              {formatNumber(tokenData.token.supply || 0)}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-md">
                            <span className="text-purple-700 font-medium">Claimed Tokens</span>
                            <Badge variant="outline" className="bg-purple-100 text-purple-700">
                              {formatNumber(tokenData.token.supply || 0)}
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {tokenData.token && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">
                        Token Information
                      </h3>
                      <div className="space-y-2">
                        <div className="p-3 bg-neutral-50 rounded-md">
                          <p className="text-sm text-neutral-500 mb-1">Mint Address</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-neutral-100 p-1 rounded text-neutral-700 overflow-hidden overflow-ellipsis">
                              {tokenData.token.mintAddress}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              onClick={() =>
                                tokenData.token
                                  ? copyToClipboard(tokenData.token.mintAddress)
                                  : null
                              }
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="p-3 bg-neutral-50 rounded-md">
                          <p className="text-sm text-neutral-500 mb-1">Created</p>
                          <p className="text-sm">
                            {new Date(tokenData.token.createdAt || '').toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-neutral-500 flex items-center">
                  <QrCode className="h-3.5 w-3.5 mr-1" />
                  This is a compressed token using Solana's Compressed NFT standard
                </div>
              </CardFooter>
            </Card>

            {/* Explorer Links - Using the helper function */}
            {renderExternalLinks()}
          </div>
        )}
      </div>
    </div>
  );
}
