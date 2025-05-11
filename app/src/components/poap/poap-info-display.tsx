import {
  Hash,
  Calendar,
  Building,
  User,
  Coins,
  RefreshCcw,
  Copy,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InteractiveExternalLink } from '@/components/ui/interactive-link';
import { formatDateRange } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { getStatusDisplay } from './status-display';
import { toast } from 'sonner';

interface POAPInfoDisplayProps {
  poap: {
    id: string;
    title: string;
    startDate: Date | string;
    endDate: Date | string;
    status: 'Draft' | 'Published' | 'Distributed' | 'Unclaimable';
    website: string | null;
    token?: {
      id: string;
      mintAddress: string;
    } | null;
  };
  organization: { name: string; url: string } | null;
  artists: Array<{ name: string; url: string }>;
  metadataOutdated: boolean;
  onMetadataUpdated: () => void;
  isAuthenticated: boolean;
  isCreator?: boolean;
}

export function POAPInfoDisplay({
  poap,
  organization,
  artists,
  metadataOutdated,
  onMetadataUpdated,
  isAuthenticated,
  isCreator = false,
}: POAPInfoDisplayProps) {
  const statusDisplay = getStatusDisplay(poap.status);
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ID */}
      <div className="flex items-start gap-3">
        <Hash className="h-5 w-5 text-neutral-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-neutral-500 mb-1">POAP ID</div>
          <div className="font-mono text-sm">{poap.id}</div>
        </div>
      </div>

      {/* Date */}
      <div className="flex items-start gap-3">
        <Calendar className="h-5 w-5 text-neutral-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-neutral-500 mb-1">Date</div>
          <div>{formatDateRange(new Date(poap.startDate), new Date(poap.endDate))}</div>
        </div>
      </div>

      {/* Website link - if available */}
      {poap.website && (
        <div className="flex items-start gap-3">
          <InteractiveExternalLink
            href={poap.website}
            className="h-5 w-5 text-neutral-400 flex-shrink-0 mt-0.5"
          >
            <span className="sr-only">External link</span>
          </InteractiveExternalLink>
          <div>
            <div className="text-sm font-medium text-neutral-500 mb-1">Website</div>
            <a
              href={poap.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              {new URL(poap.website).hostname}
            </a>
          </div>
        </div>
      )}

      {/* Status - visible only to creators */}
      {isCreator && (
        <div className="flex items-start gap-3">
          <div className={cn('h-5 w-5 flex-shrink-0 mt-0.5', statusDisplay.color)}>
            {statusDisplay.icon}
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-500 mb-1">Status</div>
            <StatusBadge
              className={cn(statusDisplay.borderColor, statusDisplay.bgColor, statusDisplay.color)}
            >
              {statusDisplay.label}
            </StatusBadge>
          </div>
        </div>
      )}

      {/* Token Information - visible only if authenticated */}
      {isAuthenticated && poap.token && (
        <div className="flex items-start gap-3">
          <Coins className="h-5 w-5 text-neutral-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-neutral-500 mb-1">Token</div>
            <div className="flex items-center gap-2">
              <Link
                href={`/poaps/${poap.id}/token`}
                className="text-blue-600 hover:text-blue-700 hover:underline block text-sm max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
              >
                {poap.token?.mintAddress}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={() => copyToClipboard(poap.token?.mintAddress || '')}
                title="Copy to clipboard"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={() =>
                  window.open(
                    `https://explorer.solana.com/address/${poap.token?.mintAddress}?cluster=${cluster}`,
                    '_blank'
                  )
                }
                title="View on Solana Explorer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
            {metadataOutdated && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    onMetadataUpdated();
                    toast.info('Metadata update scheduled');
                  }}
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Update Metadata
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Organization - shown if available, visible with or without auth */}
      {organization && (
        <div className="flex items-start gap-3">
          <Building className="h-5 w-5 text-neutral-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-neutral-500 mb-1">Organization</div>
            {organization.url ? (
              <a
                href={organization.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                {organization.name}
              </a>
            ) : (
              <div>{organization.name}</div>
            )}
          </div>
        </div>
      )}

      {/* Artists section - shown if available, visible with or without auth */}
      {artists.length > 0 && (
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-neutral-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-neutral-500 mb-1">
              {artists.length > 1 ? 'Artists' : 'Artist'}
            </div>
            <div className="space-y-1">
              {artists.map((artist, index) => (
                <div key={index}>
                  {artist.url ? (
                    <a
                      href={artist.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {artist.name}
                    </a>
                  ) : (
                    artist.name
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
