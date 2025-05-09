'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Eye, Ban, Trash2 } from 'lucide-react';
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
import QRCode from 'react-qr-code';
import { formatDistance } from 'date-fns';

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
                  disabled={isProcessing}
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
                  disabled={isProcessing}
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
                          <dd className="col-span-2">{method.secretWord.word}</dd>
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
                  </dl>
                </div>

                {/* Claim Links Section */}
                {method.type === 'ClaimLinks' &&
                  method.claimLinks &&
                  method.claimLinks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Claim Links</h3>
                      <div className="overflow-hidden rounded-lg border border-neutral-200">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-neutral-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                >
                                  Link
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                >
                                  Status
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                >
                                  Expiry
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                              {method.claimLinks.map(link => {
                                const claimUrl = getClaimUrl(link.token);
                                return (
                                  <tr key={link.id} className={link.claimed ? 'bg-neutral-50' : ''}>
                                    <td className="px-6 py-4 text-sm text-neutral-600">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono truncate max-w-[150px]">
                                          {link.token.substring(0, 8)}...
                                        </span>
                                        {!link.claimed && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 p-0 w-7"
                                            onClick={() => copyToClipboard(claimUrl)}
                                          >
                                            <Copy className="h-3.5 w-3.5" />
                                            <span className="sr-only">Copy Link</span>
                                          </Button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                          link.claimed
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}
                                      >
                                        {link.claimed ? 'Claimed' : 'Available'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">
                                      {link.expiresAt ? formatExpiry(link.expiresAt) : 'No expiry'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => openQRCodeModal(link.token)}
                                        disabled={link.claimed}
                                      >
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View QR Code</span>
                                      </Button>
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
              <DialogContent className="sm:max-w-md max-w-[95vw] w-full p-4 sm:p-6">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-xl">Claim QR Code</DialogTitle>
                  <DialogDescription className="text-sm">
                    Scan this QR code to claim your POAP
                  </DialogDescription>
                </DialogHeader>

                {selectedQRCode && (
                  <div className="flex flex-col items-center justify-center py-3 sm:py-5">
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
                        <p className="font-mono text-xs truncate flex-1">
                          {isQRCodeRevealed
                            ? selectedQRCode.token
                            : '********************************'}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-6 w-6 p-0 flex-shrink-0 cursor-pointer hover:bg-neutral-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                          onClick={() => copyToClipboard(selectedQRCode.token)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-center w-full">
                      <p className="text-xs sm:text-sm text-neutral-500 mb-1">Claim URL</p>
                      <div className="flex items-center bg-neutral-100 rounded p-2">
                        <p className="font-mono text-xs truncate flex-1">
                          {isQRCodeRevealed
                            ? selectedQRCode.url
                            : `${window.location.origin}/claim/********`}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-6 w-6 p-0 flex-shrink-0 cursor-pointer hover:bg-neutral-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                          onClick={() => copyToClipboard(selectedQRCode.url)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="mt-2 sm:mt-4">
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
