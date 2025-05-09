'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Link as LinkIcon,
  LockKeyhole,
  MapPin,
  Eye,
  Ban,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MethodCard } from '@/components/poap/distribution/method-card';
import { ClaimLinksForm } from '@/components/poap/distribution/claim-links-form';
import { SecretWordForm } from '@/components/poap/distribution/secret-word-form';
import { LocationBasedForm } from '@/components/poap/distribution/location-based-form';
import { POAPTabNav } from '@/components/poap/poap-tab-nav';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Types for the distribution methods
interface DistributionMethod {
  id: string;
  type: 'ClaimLinks' | 'SecretWord' | 'LocationBased';
  poapId: string;
  disabled: boolean;
  createdAt: string;
  // Relations depending on the type
  claimLinks?: ClaimLink[];
  secretWord?: SecretWord;
  locationBased?: LocationBased;
}

interface ClaimLink {
  id: string;
  token: string;
  claimed: boolean;
  claimedAt: string | null;
  expiresAt: string | null;
}

interface SecretWord {
  id: string;
  word: string;
  maxClaims: number | null;
  claimCount: number;
  startDate: string | null;
  endDate: string | null;
}

interface LocationBased {
  id: string;
  city: string;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  radius: number;
  maxClaims: number | null;
  claimCount: number;
  startDate: string | null;
  endDate: string | null;
}

export default function POAPDistributionPage() {
  const pathname = usePathname();
  const id = pathname.split('/')[2]; // Extract ID from URL path: /poaps/[id]/distribution
  
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [distributionMethods, setDistributionMethods] = useState<DistributionMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);

  // Split methods into active and disabled
  const activeMethods = distributionMethods.filter(method => !method.disabled);
  const disabledMethods = distributionMethods.filter(method => method.disabled);

  // Fetch distribution methods from the database
  useEffect(() => {
    const fetchDistributionMethods = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/poaps/${id}/distribution`);

        if (!response.ok) {
          throw new Error('Failed to fetch distribution methods');
        }

        const data = await response.json();
        setDistributionMethods(data.distributionMethods || []);
      } catch (err) {
        console.error('Error fetching distribution methods:', err);
        setError('Failed to load distribution methods');
        toast.error('Failed to load distribution methods');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDistributionMethods();
  }, [id]);

  // Function to toggle active/disabled state
  const toggleMethodStatus = async (methodId: string, currentDisabled: boolean) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      const action = currentDisabled ? 'enable' : 'disable';

      const response = await fetch(`/api/poaps/${id}/distribution/${methodId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disabled: !currentDisabled,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} distribution method`);
      }

      // Update the local state
      setDistributionMethods(prev =>
        prev.map(method =>
          method.id === methodId ? { ...method, disabled: !currentDisabled } : method
        )
      );

      toast.success(`Distribution method ${action}d successfully`);
    } catch (err) {
      console.error(
        `Error ${currentDisabled ? 'enabling' : 'disabling'} distribution method:`,
        err
      );
      toast.error(err instanceof Error ? err.message : 'Failed to update distribution method');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to get the appropriate icon for a method type
  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'ClaimLinks':
        return <LinkIcon className="h-6 w-6 text-blue-600" />;
      case 'SecretWord':
        return <LockKeyhole className="h-6 w-6 text-emerald-600" />;
      case 'LocationBased':
        return <MapPin className="h-6 w-6 text-orange-600" />;
      default:
        return null;
    }
  };

  // Helper function to format method details
  const getMethodDetails = (method: DistributionMethod) => {
    switch (method.type) {
      case 'ClaimLinks':
        const links = method.claimLinks || [];
        const claimed = links.filter(link => link.claimed).length;
        return {
          title: 'Claim Links',
          description: `${links.length} links generated, ${claimed} claimed${method.claimLinks?.[0]?.expiresAt ? `, expires on ${new Date(method.claimLinks[0].expiresAt).toLocaleDateString()}` : ''}`,
        };
      case 'SecretWord':
        if (!method.secretWord)
          return { title: 'Secret Word', description: 'No details available' };
        return {
          title: 'Secret Word',
          description: `Word: ${method.secretWord.word}, ${method.secretWord.claimCount} claims so far${method.secretWord.maxClaims ? ` (max: ${method.secretWord.maxClaims})` : ''}`,
        };
      case 'LocationBased':
        if (!method.locationBased)
          return { title: 'Location Based', description: 'No details available' };
        return {
          title: 'Location Based',
          description: `${method.locationBased.city}${method.locationBased.country ? `, ${method.locationBased.country}` : ''}, radius: ${method.locationBased.radius}m, ${method.locationBased.claimCount} claims`,
        };
      default:
        return { title: 'Unknown Method', description: 'No details available' };
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
          href={`/poaps/${id}/distribution/${method.id}`}
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

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/poaps/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to POAP
            </Button>
          </Link>
        </div>

        {/* Use the shared tab navigation */}
        <div className="mb-8">
          <POAPTabNav poapId={id} />
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
                      : 'How will people claim this POAP?'}
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
                  <ClaimLinksForm id={id} onSuccess={() => setSelectedMethod(null)} />
                )}
                {selectedMethod === 'secret' && (
                  <SecretWordForm id={id} onSuccess={() => setSelectedMethod(null)} />
                )}
                {selectedMethod === 'location' && (
                  <LocationBasedForm id={id} onSuccess={() => setSelectedMethod(null)} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
