'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Copy,
  Eye,
  Ban,
  Trash2,
  EyeOff,
  Zap,
  DollarSign,
  Microchip,
  Download,
  Share,
  ExternalLink,
} from 'lucide-react';
import { POAPTabNav } from '@/components/poap/poap-tab-nav';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRCode from 'react-qr-code';
import { formatDistance } from 'date-fns';
import { SecretWordDisplay } from '@/components/poap/distribution/secret-word-display';

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

  // State to track if QR code is revealed
  const [isQRCodeRevealed, setIsQRCodeRevealed] = useState(false);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Pagination state for different tables
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [claimLinksPage, setClaimLinksPage] = useState(1);
  const [claimLinksPageSize, setClaimLinksPageSize] = useState(50);
  const [downloadFormat, setDownloadFormat] = useState<'json' | 'csv'>('csv');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet';

  // Open QR code modal with the selected link
  const openQRCodeModal = (token: string) => {
    const url = getClaimUrl(token);
    setSelectedQRCode({ token, url });
    // Reset revealed state when opening modal
    setIsQRCodeRevealed(false);
  };

  // Toggle QR code visibility
  const toggleQRCodeVisibility = () => {
    setIsQRCodeRevealed(prev => !prev);
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

  // Function to share a claim link
  const shareClaimLink = (token: string, claimUrl: string) => {
    // Try to use the Web Share API if available (mostly on mobile)
    if (navigator.share) {
      navigator
        .share({
          title: 'POAP Claim Link',
          text: 'Claim your POAP using this link',
          url: claimUrl,
        })
        .then(() => toast.success('Link shared successfully'))
        .catch(error => {
          // User cancelled or share failed
          if (error.name !== 'AbortError') {
            console.error('Error sharing:', error);
            toast.error('Failed to share link');
            // Fall back to clipboard
            copyToClipboard(claimUrl);
          }
        });
    } else {
      // Fall back to clipboard copy on desktop
      copyToClipboard(claimUrl);

      // Show a toast with more detailed instructions
      toast.success(
        <div className="space-y-1">
          <p>Link copied to clipboard</p>
          <p className="text-xs text-neutral-500">Share this link with your attendees</p>
        </div>
      );
    }
  };

  // Helper function to generate claim URL from token
  const getClaimUrl = (token: string) => {
    return `${window.location.origin}/claim/${token}`;
  };

  // Helper function to format the method title
  const getMethodTitle = () => {
    if (!method) return '';

    switch (method.type) {
      case 'ClaimLinks':
        return 'Claim Links';
      case 'SecretWord':
        return 'Secret Word';
      case 'LocationBased':
        return 'Location Based';
      case 'Airdrop':
        return 'Airdrop Distribution';
      default:
        return 'Unknown Method';
    }
  };

  // Helper function to format expires info
  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 'No expiration';

    const expires = new Date(expiresAt);
    const now = new Date();

    if (expires < now) {
      return 'Expired';
    }

    return `Expires in ${formatDistance(expires, now, { addSuffix: false })}`;
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

  // Calculate estimated costs for Airdrop distribution
  const calculateAirdropCost = (recipientCount: number) => {
    // Constants from Helius Airdrop
    const baseFee = 5000; // 5000 lamports per transaction
    const compressionFee = 10000; // 10000 lamports for ZK compression
    const defaultComputeUnitLimit = 1400000; // Default CU limit
    const MICRO_LAMPORTS_PER_LAMPORT = 1000000; // 1 lamport = 1,000,000 microlamports
    const maxAddressesPerTransaction = 22; // Max addresses per tx for airdrop
    const defaultPriorityFee = 1; // Default priority fee in microlamports
    const accountRent = 0.00203928; // Solana rent for token accounts (~0.002 SOL)

    // Calculate number of transactions needed
    const transactionCount = Math.ceil(recipientCount / maxAddressesPerTransaction);

    // Calculate compressed fees (in SOL)
    const compressedBaseFee = (transactionCount * baseFee) / 1e9; // Convert lamports to SOL
    const compressedZkFee = (transactionCount * compressionFee) / 1e9;
    const compressedPriorityFee =
      (transactionCount * defaultComputeUnitLimit * defaultPriorityFee) /
      (MICRO_LAMPORTS_PER_LAMPORT * 1e9);
    const compressedTotal = compressedBaseFee + compressedZkFee + compressedPriorityFee;

    // Calculate normal fees (in SOL)
    const normalBaseFee = (transactionCount * baseFee) / 1e9;
    const normalAccountRent = recipientCount * accountRent;
    const normalPriorityFee =
      (transactionCount * defaultComputeUnitLimit * defaultPriorityFee) /
      (MICRO_LAMPORTS_PER_LAMPORT * 1e9);
    const normalTotal = normalBaseFee + normalAccountRent + normalPriorityFee;

    // Calculate savings
    const savingsAmount = normalTotal - compressedTotal;
    const savingsPercentage = (savingsAmount / normalTotal) * 100;
    const cappedSavingsPercentage = Math.min(savingsPercentage, 99.9);

    return {
      compressedCost: compressedTotal.toFixed(6),
      regularCost: normalTotal.toFixed(6),
      savings: cappedSavingsPercentage.toFixed(2),
      compressedDetails: {
        baseFee: compressedBaseFee.toFixed(6),
        zkFee: compressedZkFee.toFixed(6),
        priorityFee: compressedPriorityFee.toFixed(6),
      },
      regularDetails: {
        baseFee: normalBaseFee.toFixed(6),
        accountRent: normalAccountRent.toFixed(6),
        priorityFee: normalPriorityFee.toFixed(6),
      },
      txCount: transactionCount,
      recipients: recipientCount,
    };
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
              <h2 className="text-2xl font-bold">{getMethodTitle()} Details</h2>
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

            {/* Method details card */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
              <div className="grid grid-cols-1 gap-6">
                {/* Method Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Method Information</h3>
                  <dl className="space-y-2">
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="font-medium text-neutral-600">Type:</dt>
                      <dd className="col-span-2">{getMethodTitle()}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="font-medium text-neutral-600">Status:</dt>
                      <dd className="col-span-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            method.disabled
                              ? 'bg-neutral-100 text-neutral-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {method.disabled ? 'Disabled' : 'Active'}
                        </span>
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="font-medium text-neutral-600">Created:</dt>
                      <dd className="col-span-2">{new Date(method.createdAt).toLocaleString()}</dd>
                    </div>

                    {/* Type-specific details */}
                    {method.type === 'ClaimLinks' && method.claimLinks && (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-neutral-600">Total Links:</dt>
                          <dd className="col-span-2">{method.claimLinks.length}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-neutral-600">Claimed:</dt>
                          <dd className="col-span-2">
                            {method.claimLinks.filter(link => link.claimed).length}
                          </dd>
                        </div>
                        {method.claimLinks[0]?.expiresAt && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="font-medium text-neutral-600">Expiry:</dt>
                            <dd className="col-span-2">
                              {new Date(method.claimLinks[0].expiresAt).toLocaleDateString()}
                            </dd>
                          </div>
                        )}
                      </>
                    )}

                    {method.type === 'SecretWord' && method.secretWord && (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-neutral-600">Word:</dt>
                          <dd className="col-span-2">
                            <SecretWordDisplay word={method.secretWord.word} />
                          </dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-neutral-600">Claims:</dt>
                          <dd className="col-span-2">
                            {method.secretWord.claimCount}
                            {method.secretWord.maxClaims && ` of ${method.secretWord.maxClaims}`}
                          </dd>
                        </div>
                        {(method.secretWord.startDate || method.secretWord.endDate) && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="font-medium text-neutral-600">Valid Period:</dt>
                            <dd className="col-span-2">
                              {method.secretWord.startDate &&
                                new Date(method.secretWord.startDate).toLocaleDateString()}
                              {method.secretWord.startDate && method.secretWord.endDate && ' - '}
                              {method.secretWord.endDate &&
                                new Date(method.secretWord.endDate).toLocaleDateString()}
                            </dd>
                          </div>
                        )}
                      </>
                    )}

                    {method.type === 'LocationBased' && method.locationBased && (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-neutral-600">Location:</dt>
                          <dd className="col-span-2">
                            {method.locationBased.city}
                            {method.locationBased.country && `, ${method.locationBased.country}`}
                          </dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-neutral-600">Radius:</dt>
                          <dd className="col-span-2">{method.locationBased.radius}m</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-neutral-600">Claims:</dt>
                          <dd className="col-span-2">
                            {method.locationBased.claimCount}
                            {method.locationBased.maxClaims &&
                              ` of ${method.locationBased.maxClaims}`}
                          </dd>
                        </div>
                        {(method.locationBased.startDate || method.locationBased.endDate) && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="font-medium text-neutral-600">Valid Period:</dt>
                            <dd className="col-span-2">
                              {method.locationBased.startDate &&
                                new Date(method.locationBased.startDate).toLocaleDateString()}
                              {method.locationBased.startDate &&
                                method.locationBased.endDate &&
                                ' - '}
                              {method.locationBased.endDate &&
                                new Date(method.locationBased.endDate).toLocaleDateString()}
                            </dd>
                          </div>
                        )}
                      </>
                    )}

                    {method.type === 'Airdrop' && method.airdrop && (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-neutral-600">Addresses:</dt>
                          <dd className="col-span-2 flex items-center gap-2">
                            {method.airdrop.addresses.length} wallet addresses
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-full ml-2"
                              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">Export</span>
                            </Button>
                            {showDownloadOptions && (
                              <div className="absolute mt-8 ml-20 bg-white shadow-lg rounded-md border border-neutral-200 p-2 z-10">
                                <div className="flex flex-col space-y-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start"
                                    onClick={() => {
                                      downloadAddresses('csv');
                                      setShowDownloadOptions(false);
                                    }}
                                  >
                                    CSV
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start"
                                    onClick={() => {
                                      downloadAddresses('json');
                                      setShowDownloadOptions(false);
                                    }}
                                  >
                                    JSON
                                  </Button>
                                </div>
                              </div>
                            )}
                          </dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-neutral-600">Claims:</dt>
                          <dd className="col-span-2">
                            {method.airdrop.claimCount}
                            {method.airdrop.maxClaims && ` of ${method.airdrop.maxClaims}`}
                          </dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-neutral-600">Status:</dt>
                          <dd className="col-span-2">
                            {method.airdrop.startDate ? (
                              new Date(method.airdrop.startDate) > new Date() ? (
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Scheduled
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                                  In Progress
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                                In Progress
                              </span>
                            )}
                          </dd>
                        </div>
                        {(method.airdrop.startDate || method.airdrop.endDate) && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="font-medium text-neutral-600">Valid Period:</dt>
                            <dd className="col-span-2">
                              {method.airdrop.startDate &&
                                new Date(method.airdrop.startDate).toLocaleDateString()}
                              {method.airdrop.startDate && method.airdrop.endDate && ' - '}
                              {method.airdrop.endDate &&
                                new Date(method.airdrop.endDate).toLocaleDateString()}
                            </dd>
                          </div>
                        )}

                        {/* Cost estimate section */}
                        <div className="mt-6 col-span-3">
                          <h4 className="text-sm font-semibold uppercase text-neutral-500 mb-3">
                            Cost Analysis
                          </h4>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="flex items-start gap-3 mb-3">
                              <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h3 className="font-semibold text-blue-800">Cost Estimation</h3>
                                <p className="text-sm text-blue-700">
                                  Showing cost savings from ZK Compression technology.
                                </p>
                              </div>
                            </div>

                            {(() => {
                              const {
                                compressedCost,
                                regularCost,
                                savings,
                                compressedDetails,
                                regularDetails,
                                txCount,
                              } = calculateAirdropCost(method.airdrop.addresses.length);

                              return (
                                <div className="space-y-4">
                                  <dl className="space-y-2 bg-white rounded-md p-3 border border-blue-100">
                                    <div className="flex justify-between py-1">
                                      <dt className="text-blue-700 font-medium">
                                        Cost with ZK Compression:
                                      </dt>
                                      <dd className="font-semibold text-blue-800">
                                        {compressedCost} SOL
                                      </dd>
                                    </div>
                                    <div className="flex justify-between py-1 border-t border-blue-50 pl-3 text-sm">
                                      <dt className="text-blue-600">→ ZK Compression Fee:</dt>
                                      <dd className="text-blue-700">
                                        {compressedDetails.zkFee} SOL
                                      </dd>
                                    </div>
                                    <div className="flex justify-between py-1 pl-3 text-sm">
                                      <dt className="text-blue-600">→ Base Transaction Fee:</dt>
                                      <dd className="text-blue-700">
                                        {compressedDetails.baseFee} SOL
                                      </dd>
                                    </div>
                                    <div className="flex justify-between py-1 pl-3 text-sm">
                                      <dt className="text-blue-600">
                                        → Priority Fee (~{txCount} tx):
                                      </dt>
                                      <dd className="text-blue-700">
                                        {compressedDetails.priorityFee} SOL
                                      </dd>
                                    </div>

                                    <div className="flex justify-between py-1 border-t border-blue-100 mt-1">
                                      <dt className="text-blue-700">Cost without compression:</dt>
                                      <dd className="font-semibold text-blue-700">
                                        {regularCost} SOL
                                      </dd>
                                    </div>
                                    <div className="flex justify-between py-1 border-t border-blue-50 pl-3 text-sm">
                                      <dt className="text-blue-600">→ Account Rent:</dt>
                                      <dd className="text-blue-700">
                                        {regularDetails.accountRent} SOL
                                      </dd>
                                    </div>
                                    <div className="flex justify-between py-1 pl-3 text-sm">
                                      <dt className="text-blue-600">→ Base Transaction Fee:</dt>
                                      <dd className="text-blue-700">
                                        {regularDetails.baseFee} SOL
                                      </dd>
                                    </div>
                                    <div className="flex justify-between py-1 pl-3 text-sm">
                                      <dt className="text-blue-600">
                                        → Priority Fee (~{txCount} tx):
                                      </dt>
                                      <dd className="text-blue-700">
                                        {regularDetails.priorityFee} SOL
                                      </dd>
                                    </div>

                                    <div className="flex justify-between py-1 border-t border-blue-100 mt-1">
                                      <dt className="text-blue-700">You saved:</dt>
                                      <dd className="font-semibold text-green-700">{savings}%</dd>
                                    </div>
                                  </dl>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Wallet addresses list */}
                        <div className="mt-6 col-span-3">
                          <h4 className="text-sm font-semibold uppercase text-neutral-500 mb-3">
                            Recipient Addresses
                          </h4>
                          <div className="bg-white p-4 rounded-lg border border-neutral-200">
                            <Tabs defaultValue="list" className="w-full">
                              <TabsList className="mb-4">
                                <TabsTrigger value="list">List View</TabsTrigger>
                                <TabsTrigger value="stats">Stats</TabsTrigger>
                              </TabsList>

                              <TabsContent value="list">
                                <div className="overflow-hidden rounded-lg border border-neutral-200">
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-neutral-200">
                                      <thead className="bg-neutral-50">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            #
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Wallet Address
                                          </th>
                                          <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-neutral-200">
                                        {method.airdrop.addresses
                                          .slice((page - 1) * pageSize, page * pageSize)
                                          .map((address, index) => (
                                            <tr key={index}>
                                              <td className="px-4 py-2 text-sm text-neutral-600">
                                                {(page - 1) * pageSize + index + 1}
                                              </td>
                                              <td className="px-4 py-2 text-sm font-mono">
                                                {address}
                                              </td>
                                              <td className="px-4 py-2 text-right">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 p-0 w-7"
                                                  onClick={() => copyToClipboard(address)}
                                                >
                                                  <Copy className="h-3.5 w-3.5" />
                                                  <span className="sr-only">Copy Address</span>
                                                </Button>
                                              </td>
                                            </tr>
                                          ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Pagination controls */}
                                  {method.airdrop.addresses.length > pageSize && (
                                    <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-t border-neutral-200">
                                      <div>
                                        <p className="text-sm text-neutral-700">
                                          Showing{' '}
                                          <span className="font-medium">
                                            {(page - 1) * pageSize + 1}
                                          </span>{' '}
                                          to{' '}
                                          <span className="font-medium">
                                            {Math.min(
                                              page * pageSize,
                                              method.airdrop.addresses.length
                                            )}
                                          </span>{' '}
                                          of{' '}
                                          <span className="font-medium">
                                            {method.airdrop.addresses.length}
                                          </span>{' '}
                                          addresses
                                        </p>
                                      </div>
                                      <div className="flex space-x-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setPage(p => Math.max(1, p - 1))}
                                          disabled={page === 1}
                                        >
                                          Previous
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setPage(p => p + 1)}
                                          disabled={
                                            page * pageSize >= method.airdrop.addresses.length
                                          }
                                        >
                                          Next
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>

                              <TabsContent value="stats">
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                      <h5 className="text-sm text-neutral-600 mb-1">
                                        Total Recipients
                                      </h5>
                                      <p className="text-2xl font-bold">
                                        {method.airdrop.addresses.length}
                                      </p>
                                    </div>
                                    <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                      <h5 className="text-sm text-neutral-600 mb-1">
                                        Estimated Cost
                                      </h5>
                                      <p className="text-2xl font-bold">
                                        {
                                          calculateAirdropCost(method.airdrop.addresses.length)
                                            .compressedCost
                                        }{' '}
                                        SOL
                                      </p>
                                    </div>
                                    <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                      <h5 className="text-sm text-neutral-600 mb-1">
                                        Cost Savings
                                      </h5>
                                      <p className="text-2xl font-bold text-green-600">
                                        {
                                          calculateAirdropCost(method.airdrop.addresses.length)
                                            .savings
                                        }
                                        %
                                      </p>
                                    </div>
                                  </div>

                                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                    <h5 className="text-sm font-medium mb-3">
                                      Transaction Information
                                    </h5>
                                    <dl className="space-y-2">
                                      <div className="flex justify-between">
                                        <dt>Number of Transactions:</dt>
                                        <dd className="font-medium">
                                          ~
                                          {
                                            calculateAirdropCost(method.airdrop.addresses.length)
                                              .txCount
                                          }
                                        </dd>
                                      </div>
                                      <div className="flex justify-between">
                                        <dt>Addresses per Transaction:</dt>
                                        <dd className="font-medium">Up to 22</dd>
                                      </div>
                                      <div className="flex justify-between">
                                        <dt>Default Compute Unit Limit:</dt>
                                        <dd className="font-medium">1,400,000</dd>
                                      </div>
                                      <div className="flex justify-between">
                                        <dt>Default Priority Fee:</dt>
                                        <dd className="font-medium">1 μLamport</dd>
                                      </div>
                                    </dl>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </div>
                      </>
                    )}
                  </dl>
                </div>

                {/* Claim Links Section */}
                {method.type === 'ClaimLinks' &&
                  method.claimLinks &&
                  method.claimLinks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Claim Links</h3>

                      {/* Stats Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-sm text-neutral-500 mb-1">Total Links</p>
                          <p className="text-2xl font-bold">{method.claimLinks?.length || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-sm text-neutral-500 mb-1">Claimed</p>
                          <p className="text-2xl font-bold text-green-600">
                            {method.claimLinks?.filter(link => link.claimed).length || 0}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-sm text-neutral-500 mb-1">Available</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {method.claimLinks?.filter(link => !link.claimed).length || 0}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-sm text-neutral-500 mb-1">Claim Rate</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {method.claimLinks && method.claimLinks.length > 0
                              ? Math.round(
                                  (method.claimLinks.filter(link => link.claimed).length /
                                    method.claimLinks.length) *
                                    100
                                )
                              : 0}
                            %
                          </p>
                        </div>
                      </div>

                      {/* Export/Download Section */}
                      <div className="flex justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-500">Show:</span>
                          <select
                            className="border border-neutral-200 rounded text-sm px-2 py-1"
                            value={claimLinksPageSize}
                            onChange={e => {
                              setClaimLinksPageSize(Number(e.target.value));
                              setClaimLinksPage(1);
                            }}
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                              // Export logic here
                              const jsonData =
                                method.claimLinks?.map(link => ({
                                  token: link.token,
                                  claimed: link.claimed,
                                  claimUrl: getClaimUrl(link.token),
                                  expiresAt: link.expiresAt,
                                  claimedAt: link.claimedAt,
                                })) || [];

                              const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
                                type: 'application/json',
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `claim-links-${method.id}.json`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                          >
                            <Download className="h-4 w-4" />
                            Export Links
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-neutral-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                >
                                  #
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                >
                                  Link Token
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                >
                                  Status
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                >
                                  Claim
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                              {method.claimLinks
                                .slice(
                                  (claimLinksPage - 1) * claimLinksPageSize,
                                  claimLinksPage * claimLinksPageSize
                                )
                                .map((link, index) => {
                                  const claimUrl = getClaimUrl(link.token);

                                  // Calculate time until expiry
                                  let timeUntilExpiry = '';
                                  if (link.expiresAt) {
                                    const expiryDate = new Date(link.expiresAt);
                                    const now = new Date();
                                    if (expiryDate > now) {
                                      const diffTime = Math.abs(
                                        expiryDate.getTime() - now.getTime()
                                      );
                                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                      timeUntilExpiry = `${diffDays} days`;

                                      // If less than 7 days, show more precise time
                                      if (diffDays < 7) {
                                        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
                                        if (diffHours < 24) {
                                          timeUntilExpiry = `${diffHours} hours`;
                                        }
                                      }
                                    } else {
                                      timeUntilExpiry = 'Expired';
                                    }
                                  }

                                  return (
                                    <tr
                                      key={link.id}
                                      className={`hover:bg-neutral-50 ${
                                        link.claimed
                                          ? 'bg-green-50'
                                          : link.expiresAt && new Date(link.expiresAt) < new Date()
                                            ? 'bg-neutral-100'
                                            : ''
                                      }`}
                                    >
                                      <td className="px-4 py-3 text-sm text-neutral-600">
                                        {(claimLinksPage - 1) * claimLinksPageSize + index + 1}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-neutral-600">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono truncate max-w-[150px]">
                                            {link.token.substring(0, 12)}...
                                          </span>
                                          {!link.claimed && (
                                            <>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 p-0 w-7"
                                                onClick={() => copyToClipboard(link.token)}
                                              >
                                                <Copy className="h-3.5 w-3.5" />
                                                <span className="sr-only">Copy Token</span>
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 p-0 w-7"
                                                onClick={() =>
                                                  window.open(getClaimUrl(link.token), '_blank')
                                                }
                                              >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                <span className="sr-only">Open Claim Link</span>
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            link.claimed
                                              ? 'bg-green-100 text-green-700'
                                              : link.expiresAt &&
                                                  new Date(link.expiresAt) < new Date()
                                                ? 'bg-neutral-100 text-neutral-700'
                                                : 'bg-blue-100 text-blue-700'
                                          }`}
                                        >
                                          {link.claimed
                                            ? 'Claimed'
                                            : link.expiresAt &&
                                                new Date(link.expiresAt) < new Date()
                                              ? 'Expired'
                                              : 'Available'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-neutral-600">
                                        {link.claimed ? (
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs">
                                                {link.claimedAt
                                                  ? new Date(link.claimedAt).toLocaleString()
                                                  : '—'}
                                              </span>
                                            </div>
                                            {link.transactionSignature && (
                                              <div>
                                                <a
                                                  href={
                                                    link.transactionSignature.startsWith('sim_')
                                                      ? '#'
                                                      : `https://explorer.solana.com/tx/${link.transactionSignature}?cluster=${cluster}`
                                                  }
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className={`text-xs flex items-center gap-1 ${
                                                    link.transactionSignature.startsWith('sim_')
                                                      ? 'text-neutral-500 cursor-default'
                                                      : 'text-blue-600 hover:text-blue-800'
                                                  }`}
                                                  onClick={e => {
                                                    if (
                                                      link.transactionSignature?.startsWith('sim_')
                                                    ) {
                                                      e.preventDefault();
                                                      toast.info(
                                                        'This is a simulated transaction and cannot be viewed on explorer'
                                                      );
                                                    }
                                                  }}
                                                >
                                                  <span>
                                                    {link.transactionSignature.startsWith('sim_')
                                                      ? 'Simulated transaction'
                                                      : 'View on explorer'}
                                                  </span>
                                                  {!link.transactionSignature.startsWith(
                                                    'sim_'
                                                  ) && <ExternalLink className="h-3 w-3" />}
                                                </a>
                                              </div>
                                            )}
                                            {link.claimedByWallet && (
                                              <div className="flex items-center gap-1">
                                                <span className="text-xs font-mono text-neutral-500 truncate max-w-[150px]">
                                                  {link.claimedByWallet.substring(0, 8)}...
                                                </span>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-5 p-0 w-5"
                                                  onClick={() =>
                                                    link.claimedByWallet &&
                                                    copyToClipboard(link.claimedByWallet)
                                                  }
                                                >
                                                  <Copy className="h-3 w-3" />
                                                  <span className="sr-only">Copy Wallet</span>
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          '—'
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => openQRCodeModal(link.token)}
                                            disabled={
                                              !!link.claimed ||
                                              !!(
                                                link.expiresAt &&
                                                new Date(link.expiresAt) < new Date()
                                              )
                                            }
                                          >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">View QR Code</span>
                                          </Button>
                                          {!link.claimed && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0"
                                              onClick={() => shareClaimLink(link.token, claimUrl)}
                                            >
                                              <Share className="h-4 w-4" />
                                              <span className="sr-only">Share Link</span>
                                            </Button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Delete Method Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to delete this distribution method?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will mark the distribution method as deleted
                    and it will no longer be available for claims.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteMethod}
                    disabled={isProcessing}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isProcessing ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* QR Code Modal */}
            <Dialog open={!!selectedQRCode} onOpenChange={open => !open && setSelectedQRCode(null)}>
              <DialogContent className="sm:max-w-md max-w-[95vw] w-full p-0 overflow-hidden">
                <div className="overflow-y-auto max-h-[85vh]">
                  <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
                    <DialogTitle className="text-xl">Claim QR Code</DialogTitle>
                    <DialogDescription className="text-sm">
                      Scan this QR code to claim your POAP
                    </DialogDescription>
                  </DialogHeader>

                  {selectedQRCode && (
                    <div className="flex flex-col items-center justify-center px-4 py-3 sm:px-6 sm:py-5">
                      <div
                        className="bg-white p-2 sm:p-4 rounded-xl shadow-sm mb-3 sm:mb-4 relative cursor-pointer w-full max-w-[280px] hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={toggleQRCodeVisibility}
                        tabIndex={0}
                        role="button"
                        aria-label="Toggle QR code visibility"
                      >
                        <div
                          className={`transition-all duration-300 ${isQRCodeRevealed ? '' : 'blur-md'}`}
                        >
                          <QRCode
                            value={selectedQRCode.url}
                            size={256}
                            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                            viewBox={`0 0 256 256`}
                          />
                        </div>

                        {!isQRCodeRevealed && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/40 rounded-full p-2 sm:p-4">
                              <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <span className="sr-only">Click to reveal QR code</span>
                          </div>
                        )}
                      </div>

                      <div className="text-center mb-2 w-full">
                        <p
                          className="text-xs sm:text-sm text-neutral-500 mb-1 cursor-pointer hover:text-neutral-700 transition-colors focus:outline-none"
                          onClick={toggleQRCodeVisibility}
                          tabIndex={0}
                          role="button"
                        >
                          {isQRCodeRevealed ? 'QR code visible' : 'Click to reveal QR code'}
                        </p>
                      </div>

                      <div className="text-center mb-3 w-full">
                        <p className="text-xs sm:text-sm text-neutral-500 mb-1">Token</p>
                        <div className="flex items-center bg-neutral-100 rounded p-2">
                          <div className="font-mono text-xs truncate w-full pr-2">
                            {isQRCodeRevealed
                              ? selectedQRCode.token
                              : '********************************'}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 flex-shrink-0 cursor-pointer hover:bg-neutral-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                            onClick={() => copyToClipboard(selectedQRCode.token)}
                            aria-label="Copy to clipboard"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-center w-full">
                        <p className="text-xs sm:text-sm text-neutral-500 mb-1">Claim URL</p>
                        <div className="flex items-center bg-neutral-100 rounded p-2">
                          <div className="font-mono text-xs truncate w-full pr-2">
                            {isQRCodeRevealed
                              ? selectedQRCode.url
                              : `${window.location.origin}/claim/********`}
                          </div>
                          <div className="flex-shrink-0 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 flex-shrink-0 cursor-pointer hover:bg-neutral-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                              onClick={() =>
                                window.open(
                                  isQRCodeRevealed
                                    ? selectedQRCode.url
                                    : `${window.location.origin}/claim/${selectedQRCode.token}`,
                                  '_blank'
                                )
                              }
                              aria-label="Visit claim link"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 flex-shrink-0 cursor-pointer hover:bg-neutral-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                              onClick={() => copyToClipboard(selectedQRCode.url)}
                              aria-label="Copy to clipboard"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="px-4 py-4 border-t border-neutral-200 sm:px-6">
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedQRCode(null)}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
