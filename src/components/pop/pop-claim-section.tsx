'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Info, Award } from 'lucide-react';
import { ClaimWithSecret } from './claim-with-secret';
import { ClaimWithLocation } from './claim-with-location';
import { useWalletContext } from '@/contexts/wallet-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Helper function to safely get auth token
const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('solana_auth_token') || '';
};

interface POPClaimSectionProps {
  popId: string;
  title: string;
}

interface ClaimStatus {
  hasClaimed: boolean;
  claimTimestamp?: string;
  claimTxId?: string;
}

export function POPClaimSection({ popId, title }: POPClaimSectionProps) {
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const [claimMethods, setClaimMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localClaimSuccess, setLocalClaimSuccess] = useState(false);
  const [locationBasedData, setLocationBasedData] = useState<{
    id: string;
    radius: number;
  } | null>(null);
  const { isAuthenticated, authenticate, walletAddress } = useWalletContext();
  const router = useRouter();

  // Check localStorage for successful claims
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasClaimedLocally = localStorage.getItem(`pop-${popId}-claimed`) === 'true';
      setLocalClaimSuccess(hasClaimedLocally);
    }
  }, [popId]);

  // Fetch claim methods and user claim status
  useEffect(() => {
    const fetchClaimData = async () => {
      if (!popId) return;

      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching claim methods for POP: ${popId}`);

        // Get available claim methods for this POP
        const methodsResponse = await fetch(`/api/pops/${popId}/claim/methods`, {
          credentials: 'include',
          headers: {
            'Authorization': `Solana ${getAuthToken()}`,
          },
        }).catch(err => {
          console.error('Network error fetching claim methods:', err);
          throw new Error('Network error. Please check your connection and try again.');
        });

        if (!methodsResponse.ok) {
          let errorMessage = 'Failed to load claim options';
          try {
            const errorData = await methodsResponse.json();
            errorMessage = errorData.message || `Error: ${methodsResponse.status}`;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }

          console.error(`Failed to fetch claim methods: ${methodsResponse.status}`);
          throw new Error(errorMessage);
        }

        const methodsData = await methodsResponse.json();
        console.log(`Claim methods loaded:`, methodsData.methods || []);
        setClaimMethods(methodsData.methods || []);

        // Fetch location-based distribution method details if available
        if (methodsData.methods?.includes('LocationBased')) {
          try {
            const locationResponse = await fetch(`/api/pops/${popId}/distribution/location`, {
              credentials: 'include',
              headers: {
                'Authorization': `Solana ${getAuthToken()}`,
              },
            });

            if (locationResponse.ok) {
              const locationData = await locationResponse.json();
              if (locationData.id && locationData.radius) {
                setLocationBasedData({
                  id: locationData.id,
                  radius: locationData.radius,
                });
              }
            } else {
              console.warn('Failed to fetch location-based distribution details');
            }
          } catch (err) {
            console.error('Error fetching location-based details:', err);
          }
        }

        // If authenticated, check if user has already claimed
        if (isAuthenticated && walletAddress) {
          console.log(`Checking claim status for user ${walletAddress.substring(0, 8)}...`);
          const statusResponse = await fetch(`/api/pops/${popId}/claim/status`, {
            credentials: 'include',
            headers: {
              'Authorization': `Solana ${getAuthToken()}`,
            },
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log(`Claim status:`, statusData);
            setClaimStatus(statusData);
          } else {
            console.warn(`Claim status check returned ${statusResponse.status}`);
            // Don't throw error here, as this is not critical for displaying claim options
          }
        }
      } catch (err) {
        console.error('Error fetching claim data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load claim options. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClaimData();
  }, [popId, isAuthenticated, walletAddress]);

  const handleAuthenticateClick = async () => {
    try {
      setLoading(true);
      const success = await authenticate();

      if (success) {
        toast.success('Wallet authenticated successfully');
        // Refresh page data after authentication
        router.refresh();
      } else {
        toast.error('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Failed to authenticate wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to the wallet page to view claimed tokens
  const handleViewWallet = () => {
    router.push('/wallet');
  };

  if (loading) {
    return (
      <Card className="border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle>Claim your POP</CardTitle>
          <CardDescription>Loading claim options...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Error Loading Claim Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-700">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.refresh()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If locally stored claim success (just claimed)
  if (localClaimSuccess) {
    return (
      <Card className="border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            POP Claimed Successfully
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200 mb-4">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle>Claim Successful</AlertTitle>
            <AlertDescription>
              You have successfully claimed this POP token. It should now be available in your
              wallet.
            </AlertDescription>
          </Alert>

          <Button onClick={handleViewWallet} className="w-full">
            View in Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If user has already claimed this POP (according to API)
  if (claimStatus?.hasClaimed) {
    return (
      <Card className="border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            POP Already Claimed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle>Successfully claimed</AlertTitle>
            <AlertDescription>
              You have already claimed this POP token.
              {claimStatus.claimTimestamp && (
                <span className="block text-sm text-neutral-500 mt-1">
                  Claimed on {new Date(claimStatus.claimTimestamp).toLocaleString()}
                </span>
              )}
            </AlertDescription>
          </Alert>

          {claimStatus.claimTxId ? (
            <div className="mt-4 text-sm">
              <a
                href={`https://explorer.solana.com/tx/${claimStatus.claimTxId}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View transaction on Solana Explorer
              </a>
            </div>
          ) : (
            <Button onClick={handleViewWallet} className="w-full mt-4">
              View in Wallet
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // If user is not authenticated
  if (!isAuthenticated) {
    return (
      <Card className="border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle>Claim your POP</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-blue-50 border-blue-200 mb-4">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to connect and authenticate your wallet before claiming this POP.
            </AlertDescription>
          </Alert>

          <Button onClick={handleAuthenticateClick} className="w-full">
            Authenticate to Claim
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If no claim methods are available
  if (!claimMethods.length) {
    return (
      <Card className="border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-700">
            There are currently no active claim methods for this POP. Please check back later or
            contact the event organizer.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render available claim methods
  if (claimMethods.filter(method => method !== 'ClaimLinks').length > 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Claim your POP</h2>

        {claimMethods.includes('SecretWord') && (
          <ClaimWithSecret popId={popId} popTitle={title} />
        )}

        {claimMethods.includes('LocationBased') && locationBasedData && (
          <ClaimWithLocation
            popId={popId}
            popTitle={title}
            distributionMethodId={locationBasedData.id}
            radius={locationBasedData.radius}
            walletAddress={walletAddress || undefined}
          />
        )}
      </div>
    );
  }

  return null;
}
