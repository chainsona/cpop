import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Eye, Share, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { ClaimLink } from './types';
import { getClaimUrl } from './utils';

interface ClaimLinkTableProps {
  claimLinks: ClaimLink[];
  openQRCodeModal: (token: string) => void;
  cluster?: string;
}

export const ClaimLinkTable = ({ claimLinks, openQRCodeModal, cluster = 'mainnet' }: ClaimLinkTableProps) => {
  const [claimLinksPage, setClaimLinksPage] = useState(1);
  const [claimLinksPageSize, setClaimLinksPageSize] = useState(50);

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

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Claim Links</h3>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-neutral-500 mb-1">Total Links</p>
          <p className="text-2xl font-bold">{claimLinks?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-neutral-500 mb-1">Claimed</p>
          <p className="text-2xl font-bold text-green-600">
            {claimLinks?.filter(link => link.claimed).length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-neutral-500 mb-1">Available</p>
          <p className="text-2xl font-bold text-blue-600">
            {claimLinks?.filter(link => !link.claimed).length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-neutral-500 mb-1">Claim Rate</p>
          <p className="text-2xl font-bold text-purple-600">
            {claimLinks && claimLinks.length > 0
              ? Math.round(
                  (claimLinks.filter(link => link.claimed).length /
                    claimLinks.length) *
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
                claimLinks?.map(link => ({
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
              a.download = `claim-links-export.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            <ExternalLink className="h-4 w-4" />
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
              {claimLinks
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
        
        {/* Pagination controls */}
        {claimLinks.length > claimLinksPageSize && (
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-t border-neutral-200">
            <div>
              <p className="text-sm text-neutral-700">
                Showing{' '}
                <span className="font-medium">
                  {(claimLinksPage - 1) * claimLinksPageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(
                    claimLinksPage * claimLinksPageSize,
                    claimLinks.length
                  )}
                </span>{' '}
                of{' '}
                <span className="font-medium">
                  {claimLinks.length}
                </span>{' '}
                links
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClaimLinksPage(p => Math.max(1, p - 1))}
                disabled={claimLinksPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClaimLinksPage(p => p + 1)}
                disabled={
                  claimLinksPage * claimLinksPageSize >= claimLinks.length
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 