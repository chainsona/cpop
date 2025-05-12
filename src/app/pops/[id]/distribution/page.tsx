'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  Link2 as LinkIcon,
  LockKeyhole,
  MapPin,
  Eye,
  Ban,
  ArrowLeft,
  Plane,
} from 'lucide-react';
import { POPTabNav } from '@/components/pop/pop-tab-nav';
import { TokenStatusAlert } from '@/components/pop/token-status-alert';
import { toast } from 'sonner';
import { usePageTitle } from '@/contexts/page-title-context';
import { MethodCard } from '@/components/pop/distribution/method-card';
import { ClaimLinksForm } from '@/components/pop/distribution/claim-links-form';
import { SecretWordForm } from '@/components/pop/distribution/secret-word-form';
import { LocationBasedForm } from '@/components/pop/distribution/location-based-form';
import { AirdropForm } from '@/components/pop/distribution/airdrop-form';
import { AddMethodDialog } from '@/components/pop/distribution/add-method-dialog';

// Types for the distribution methods
interface DistributionMethod {
  id: string;
  type: 'ClaimLinks' | 'SecretWord' | 'LocationBased' | 'Airdrop';
  disabled: boolean;
  settings: any;
  createdAt: string;
  claimLinks?: Array<{
    id: string;
    token: string;
    claimed: boolean;
    claimedAt?: string | null;
    expiresAt?: string | null;
  }>;
  secretWord?: {
    word: string;
    maxClaims: number | null;
    claimCount: number;
    startDate: string | null;
    endDate: string | null;
  };
  locationBased?: {
    city: string;
    country: string | null;
    latitude?: number | null;
    longitude?: number | null;
    radius?: number;
    maxClaims: number | null;
    claimCount: number;
    startDate: string | null;
    endDate: string | null;
  };
  airdrop?: {
    addresses: string[];
    maxClaims: number | null;
    claimCount: number;
    startDate: string | null;
    endDate: string | null;
  };
}

// Interface for POP data
interface Pop {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  status: 'Draft' | 'Published' | 'Distributed' | 'Unclaimable';
  token?: {
    id: string;
    mintAddress: string;
    supply: number;
    decimals: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function POPDistributionPage() {
  const pathname = usePathname();
  const id = pathname.split('/')[2]; // Extract ID from URL path: /pops/[id]/distribution
  const { setPageTitle } = usePageTitle();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [distributionMethods, setDistributionMethods] = useState<DistributionMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [pop, setPop] = useState<Pop | null>(null);
  const [tokenStatus, setTokenStatus] = useState({ minted: false, supply: 0 });

  // Split methods into active and disabled
  const activeMethods = distributionMethods.filter(method => !method.disabled);
  const disabledMethods = distributionMethods.filter(method => method.disabled);

  useEffect(() => {
    async function fetchDistributionMethods() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/pops/${id}/distribution`);

        if (!response.ok) {
          throw new Error('Failed to fetch distribution methods');
        }

        const data = await response.json();
        setDistributionMethods(data.distributionMethods || []);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDistributionMethods();
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let retryCount = 0;
        const maxRetries = 3;

        // Fetch POP details with retry logic
        let popResponse;
        while (retryCount < maxRetries) {
          try {
            popResponse = await fetch(`/api/pops/${id}`);
            
            // Break out of retry loop if successful
            if (popResponse.ok) break;
            
            // If not found, no need to retry
            if (popResponse.status === 404) {
              setError('POP not found');
              setIsLoading(false);
              return;
            }
            
            // If it's an auth error, show specific message
            if (popResponse.status === 401 || popResponse.status === 403) {
              setError('Not authorized to view this POP');
              setIsLoading(false);
              return;
            }
            
            // Increment retry count
            retryCount++;
            
            // If we've reached max retries, throw error
            if (retryCount >= maxRetries) {
              const errorData = await popResponse.json().catch(() => ({ error: 'Unknown error' }));
              throw new Error(errorData.error || `Failed to fetch POP (Status: ${popResponse.status})`);
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          } catch (fetchError) {
            // If it's a network error, retry
            retryCount++;
            
            // If we've reached max retries, rethrow
            if (retryCount >= maxRetries) {
              throw fetchError;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          }
        }

        // Process response
        if (!popResponse || !popResponse.ok) {
          throw new Error('Failed to fetch POP after multiple attempts');
        }

        const popData = await popResponse.json();
        setPop(popData.pop);

        // Set token status
        setTokenStatus({
          minted: !!popData.pop.token,
          supply: popData.pop.token?.supply || 0,
        });

        if (popData.pop.title) {
          setPageTitle(`${popData.pop.title} - Distribution`);
        }

        // Fetch distribution methods
        try {
          const methodsResponse = await fetch(`/api/pops/${id}/distribution`);
          if (!methodsResponse.ok) {
            console.error('Failed to fetch distribution methods:', methodsResponse.status);
            // We can still continue with the page even if distribution methods fail
            setDistributionMethods([]);
          } else {
            const methodsData = await methodsResponse.json();
            setDistributionMethods(methodsData.distributionMethods || []);
          }
        } catch (methodsError) {
          console.error('Error fetching distribution methods:', methodsError);
          // We can still continue with the page even if distribution methods fail
          setDistributionMethods([]);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'An error occurred while loading POP data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      setPageTitle('');
    };
  }, [id, setPageTitle]);

  // Function to toggle active/disabled state
  const toggleMethodStatus = async (methodId: string, currentDisabled: boolean) => {
    try {
      setIsProcessing(true);

      const response = await fetch(`/api/pops/${id}/distribution/${methodId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disabled: !currentDisabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update method status');
      }

      // Update the local state
      setDistributionMethods(prevMethods =>
        prevMethods.map(method =>
          method.id === methodId ? { ...method, disabled: !currentDisabled } : method
        )
      );

      toast.success(`Method ${currentDisabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update method status');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to get the appropriate icon for a method type
  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'ClaimLinks':
        return <LinkIcon className="h-5 w-5 text-blue-600" />;
      case 'SecretWord':
        return <LockKeyhole className="h-5 w-5 text-emerald-600" />;
      case 'LocationBased':
        return <MapPin className="h-5 w-5 text-orange-600" />;
      case 'Airdrop':
        return <Plane className="h-5 w-5 text-purple-600" />;
      default:
        return null;
    }
  };

  // Helper function to format method details
  const getMethodDetails = (method: DistributionMethod) => {
    switch (method.type) {
      case 'ClaimLinks':
        return {
          title: 'Claim Links',
          description: method.claimLinks
            ? `${method.claimLinks.length} unique claim links, ${method.claimLinks.filter(l => l.claimed).length} claimed`
            : 'Distributed via unique claim links',
        };
      case 'SecretWord':
        return {
          title: 'Secret Word',
          description: method.secretWord
            ? `${method.secretWord.claimCount} claims${method.secretWord.maxClaims ? ` out of max ${method.secretWord.maxClaims}` : ''}`
            : 'Claimed using a secret word',
        };
      case 'LocationBased':
        return {
          title: 'Location Based',
          description: method.locationBased
            ? `${method.locationBased.city}${method.locationBased.maxClaims ? `: ${method.locationBased.claimCount} of ${method.locationBased.maxClaims} claimed` : ''}`
            : 'Available at a specific location',
        };
      case 'Airdrop':
        return {
          title: 'Airdrop Distribution',
          description: method.airdrop
            ? `${method.airdrop.addresses?.length || 0} addresses${method.airdrop.maxClaims ? `, ${method.airdrop.claimCount} of ${method.airdrop.maxClaims} claimed` : ''}`
            : 'Direct distribution to wallet addresses',
        };
      default:
        return {
          title: 'Unknown Method',
          description: 'Unknown distribution method',
        };
    }
  };

  // Method Card component for reuse
  const DistributionMethodCard = ({ method }: { method: DistributionMethod }) => {
    const { title, description } = getMethodDetails(method);

    return (
      <div
        key={method.id}
        className={`bg-white rounded-xl border ${method.disabled ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-200'} p-4 flex justify-between items-center`}
      >
        <Link
          href={`/pops/${id}/distribution/${method.id}`}
          className="flex items-center gap-4 flex-1 hover:opacity-90 transition-opacity"
        >
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${method.disabled ? 'bg-neutral-200' : 'bg-neutral-100'}`}
          >
            {getMethodIcon(method.type)}
          </div>
          <div>
            <h4
              className={`font-medium ${method.disabled ? 'text-neutral-600' : 'text-neutral-900'}`}
            >
              {title}
              {method.disabled && (
                <span className="ml-2 text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                  Disabled
                </span>
              )}
            </h4>
            <p className={`text-sm ${method.disabled ? 'text-neutral-500' : 'text-neutral-600'}`}>
              {description}
            </p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={e => {
            e.preventDefault(); // Prevent navigation
            toggleMethodStatus(method.id, method.disabled);
          }}
          disabled={isProcessing}
          className={
            method.disabled
              ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
          }
          title={method.disabled ? 'Enable method' : 'Disable method'}
        >
          {method.disabled ? <Eye className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
        </Button>
      </div>
    );
  };

  const handleDistributionMethodAdded = async (newMethod: DistributionMethod) => {
    setSelectedMethod(null);

    // Refetch the distribution methods to include the new one
    try {
      const response = await fetch(`/api/pops/${id}/distribution`);
      if (response.ok) {
        const data = await response.json();
        setDistributionMethods(data.distributionMethods || []);
      }

      // Also update the POP to get the latest token status
      const popResponse = await fetch(`/api/pops/${id}`);
      if (popResponse.ok) {
        const popData = await popResponse.json();
        setTokenStatus({
          minted: !!popData.pop.token,
          supply: popData.pop.token?.supply || 0,
        });
      }
    } catch (err: any) {
      console.error('Error refreshing data:', err);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/pops/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to POP
            </Button>
          </Link>
        </div>

        {/* Use the shared tab navigation */}
        <div className="mb-8">
          <POPTabNav popId={id} />
        </div>

        <h2 className="text-2xl font-bold mb-6">Distribution Setup</h2>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading distribution methods...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : (
          <>
            {/* Show token status alert */}
            <TokenStatusAlert 
              tokenStatus={tokenStatus} 
              popId={id} 
              hasDistributionMethods={activeMethods.length > 0}
              onTokensMinted={(newSupply) => {
                // Update the token status when tokens are minted
                setTokenStatus({
                  minted: true,
                  supply: newSupply || 0,
                });
              }}
            />

            {/* Active Distribution Methods */}
            {activeMethods.length > 0 && (
              <div className="mb-8 space-y-6">
                <h3 className="text-lg font-semibold text-neutral-700">
                  Active Distribution Methods
                </h3>
                <div className="grid gap-4 grid-cols-1">
                  {activeMethods.map(method => (
                    <DistributionMethodCard key={method.id} method={method} />
                  ))}
                </div>
              </div>
            )}

            {/* Disabled Distribution Methods - Collapsible Section */}
            {disabledMethods.length > 0 && (
              <div className="mb-8 space-y-4">
                <button
                  onClick={() => setShowDisabled(!showDisabled)}
                  className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <h3 className="text-lg font-semibold">Disabled Distribution Methods</h3>
                  {showDisabled ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                {showDisabled && (
                  <div className="grid gap-4 grid-cols-1 pt-2">
                    {disabledMethods.map(method => (
                      <DistributionMethodCard key={method.id} method={method} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Method selection or form based on state */}
            {!selectedMethod ? (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-neutral-700">
                    {activeMethods.length > 0
                      ? 'Add Another Distribution Method'
                      : 'How will people mint this POP?'}
                  </h3>
                </div>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                  <MethodCard
                    title="Claim Links"
                    icon={<LinkIcon className="h-6 w-6 text-blue-600" />}
                    description="Generate unique claim links that can be distributed to recipients"
                    onClick={() => setSelectedMethod('links')}
                  />
                  <MethodCard
                    title="Secret Word"
                    icon={<LockKeyhole className="h-6 w-6 text-emerald-600" />}
                    description="Set a secret word that recipients must enter to claim"
                    onClick={() => setSelectedMethod('secret')}
                  />
                  <MethodCard
                    title="Location Based"
                    icon={<MapPin className="h-6 w-6 text-orange-600" />}
                    description="Recipients must be in a specific location to claim"
                    onClick={() => setSelectedMethod('location')}
                  />
                  <MethodCard
                    title="Airdrop"
                    icon={<Plane className="h-6 w-6 text-purple-600" />}
                    description="Directly mint tokens to a list of Solana addresses"
                    onClick={() => setSelectedMethod('airdrop')}
                  />
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMethod(null)}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Choose different method
                </Button>

                {selectedMethod === 'links' && (
                  <ClaimLinksForm id={id} onSuccess={() => {
                    setSelectedMethod(null);
                    handleDistributionMethodAdded({} as DistributionMethod);
                  }} />
                )}
                {selectedMethod === 'secret' && (
                  <SecretWordForm id={id} onSuccess={() => {
                    setSelectedMethod(null);
                    handleDistributionMethodAdded({} as DistributionMethod);
                  }} />
                )}
                {selectedMethod === 'location' && (
                  <LocationBasedForm id={id} onSuccess={() => {
                    setSelectedMethod(null);
                    handleDistributionMethodAdded({} as DistributionMethod);
                  }} />
                )}
                {selectedMethod === 'airdrop' && (
                  <AirdropForm id={id} onSuccess={() => {
                    setSelectedMethod(null);
                    handleDistributionMethodAdded({} as DistributionMethod);
                  }} />
                )}
              </div>
            )}

            {/* Add method dialog */}
            {selectedMethod === 'add' && (
              <AddMethodDialog
                popId={id}
                onClose={() => setSelectedMethod(null)}
                onMethodAdded={handleDistributionMethodAdded}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
