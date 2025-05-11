'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Ban, Trash2 } from 'lucide-react';
import { POAPTabNav } from '@/components/poap/poap-tab-nav';
import { toast } from 'sonner';
import { formatDistance } from 'date-fns';

// Types for the distribution methods
interface DistributionMethod {
  id: string;
  type: 'ClaimLinks' | 'SecretWord' | 'LocationBased' | 'Airdrop';
  poapId: string;
  disabled: boolean;
  createdAt: string;
  // Relations depending on the type
  claimLinks?: ClaimLink[];
  secretWord?: SecretWord;
  locationBased?: LocationBased;
  airdrop?: Airdrop;
}

interface ClaimLink {
  id: string;
  token: string;
  claimed: boolean;
  claimedAt: string | null;
  expiresAt: string | null;
  createdAt?: string;
  claimedByWallet?: string;
  transactionSignature?: string;
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

interface Airdrop {
  id: string;
  addresses: string[];
  maxClaims: number | null;
  claimCount: number;
  startDate: string | null;
  endDate: string | null;
}

// Import extracted components
import { getClaimUrl } from '@/components/poap/distribution/utils';
import { MethodInfoCard } from '@/components/poap/distribution/method-info-card';
import { ClaimLinkTable } from '@/components/poap/distribution/claim-link-table';
import { QRCodeModal } from '@/components/poap/distribution/qr-code-modal';
import { AirdropCostAnalysis } from '@/components/poap/distribution/airdrop-cost-analysis';
import { AirdropAddressesList } from '@/components/poap/distribution/airdrop-addresses-list';
import { DeleteMethodDialog } from '@/components/poap/distribution/delete-method-dialog';

export default function DistributionMethodDetailsPage() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/');
  const id = pathSegments[2]; // Extract ID from URL path: /poaps/[id]/distribution/[methodId]
  const methodId = pathSegments[4]; // Extract methodId from URL path

  const [method, setMethod] = useState<DistributionMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // QR code modal state
  const [selectedQRCode, setSelectedQRCode] = useState<{ token: string; url: string } | null>(null);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet';

  // Open QR code modal with the selected link
  const openQRCodeModal = (token: string) => {
    const url = getClaimUrl(token);
    setSelectedQRCode({ token, url });
    // Reset revealed state when opening modal
  };

  // Fetch the distribution method details
  useEffect(() => {
    const fetchMethodDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/poaps/${id}/distribution/${methodId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Distribution method not found');
          }
          throw new Error('Failed to fetch distribution method details');
        }

        const data = await response.json();
        setMethod(data.distributionMethod);
      } catch (err) {
        console.error('Error fetching distribution method:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to load distribution method details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMethodDetails();
  }, [id, methodId]);

  // Function to toggle disabled state
  const toggleMethodStatus = async () => {
    if (!method || isProcessing) return;

    try {
      setIsProcessing(true);
      const action = method.disabled ? 'enable' : 'disable';

      const response = await fetch(`/api/poaps/${id}/distribution/${methodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: !method.disabled }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} distribution method`);
      }

      const data = await response.json();
      setMethod(data.distributionMethod);
      toast.success(`Distribution method ${action}d successfully`);
    } catch (err) {
      console.error(`Error updating distribution method:`, err);
      toast.error(err instanceof Error ? err.message : 'Failed to update method');
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to delete the method (logical delete)
  const deleteMethod = async () => {
    if (!method || isProcessing) return;

    try {
      setIsProcessing(true);

      const response = await fetch(`/api/poaps/${id}/distribution/${methodId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete distribution method');
      }

      toast.success('Distribution method deleted successfully');
      // Navigate back to the distribution page after deletion
      window.location.href = `/poaps/${id}/distribution`;
    } catch (err) {
      console.error('Error deleting distribution method:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete method');
      setIsProcessing(false);
    }
  };

  // Function to copy claim link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };

  // Check if an Airdrop distribution can be modified (only before start date)
  const canModifyAirdrop = () => {
    if (!method || method.type !== 'Airdrop' || !method.airdrop) return false;

    // If no start date is set, or it's in the future, modification is allowed
    if (!method.airdrop.startDate) return true;

    const startDate = new Date(method.airdrop.startDate);
    const now = new Date();
    return startDate > now;
  };

  // Function to download addresses
  const downloadAddresses = (format: 'json' | 'csv') => {
    if (!method?.airdrop?.addresses || method.airdrop.addresses.length === 0) return;

    let content = '';
    let filename = `airdrop-addresses-${method.id}`;

    if (format === 'json') {
      content = JSON.stringify(method.airdrop.addresses, null, 2);
      filename += '.json';
    } else {
      content = method.airdrop.addresses.join('\n');
      filename += '.csv';
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/poaps/${id}/distribution`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Distribution
            </Button>
          </Link>
        </div>

        {/* Use the shared tab navigation */}
        <div className="mb-8">
          <POAPTabNav poapId={id} />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading distribution method details...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : method ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {method.type === 'ClaimLinks'
                  ? 'Claim Links'
                  : method.type === 'SecretWord'
                    ? 'Secret Word'
                    : method.type === 'LocationBased'
                      ? 'Location Based'
                      : 'Airdrop Distribution'}{' '}
                Details
              </h2>
              <div className="flex gap-2">
                <Button
                  variant={method.disabled ? 'outline' : 'secondary'}
                  className="gap-1.5"
                  onClick={toggleMethodStatus}
                  disabled={isProcessing || (method.type === 'Airdrop' && !canModifyAirdrop())}
                >
                  {method.disabled ? (
                    <>
                      <Eye className="h-4 w-4" />
                      Enable
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4" />
                      Disable
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isProcessing || (method.type === 'Airdrop' && !canModifyAirdrop())}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Method Info Card */}
            <MethodInfoCard
              method={method}
              downloadAddresses={method.type === 'Airdrop' ? downloadAddresses : undefined}
            />

            {/* Airdrop Cost Analysis (only for Airdrop method) */}
            {method.type === 'Airdrop' && method.airdrop && (
              <AirdropCostAnalysis addressCount={method.airdrop.addresses.length} />
            )}

            {/* Airdrop Addresses List (only for Airdrop method) */}
            {method.type === 'Airdrop' && method.airdrop && (
              <AirdropAddressesList addresses={method.airdrop.addresses} />
            )}

            {/* Claim Links Section (only for ClaimLinks method) */}
            {method.type === 'ClaimLinks' && method.claimLinks && method.claimLinks.length > 0 && (
              <ClaimLinkTable
                claimLinks={method.claimLinks}
                openQRCodeModal={openQRCodeModal}
                cluster={cluster}
              />
            )}

            {/* Delete Method Dialog */}
            <DeleteMethodDialog
              isOpen={isDeleteDialogOpen}
              isProcessing={isProcessing}
              onOpenChange={setIsDeleteDialogOpen}
              onDelete={deleteMethod}
            />

            {/* QR Code Modal */}
            <QRCodeModal selectedQRCode={selectedQRCode} setSelectedQRCode={setSelectedQRCode} />
          </>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-700 mb-4">Distribution method not found</p>
            <Link href={`/poaps/${id}/distribution`}>
              <Button>Back to Distribution</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
