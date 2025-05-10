import { AlertTriangle, Coins, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useWalletContext } from '@/contexts/wallet-context';

interface TokenStatusAlertProps {
  tokenStatus: {
    minted: boolean;
    supply: number;
    metadataOutdated?: boolean;
    lastUpdated?: string;
  };
  poapId: string;
  hasDistributionMethods?: boolean;
  onTokensMinted?: (newSupply: number) => void;
  onMetadataUpdated?: () => void;
}

/**
 * Component that displays the token minting status for a POAP
 * Shows either a success message with token count or a warning about tokens
 * Only shows warning when there's at least one enabled distribution method
 */
export function TokenStatusAlert({
  tokenStatus,
  poapId,
  hasDistributionMethods = false,
  onTokensMinted,
  onMetadataUpdated,
}: TokenStatusAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingMetadata, setIsUpdatingMetadata] = useState(false);
  const { isAuthenticated, authenticate } = useWalletContext();

  // Function to mint tokens
  const mintTokens = async () => {
    try {
      setIsLoading(true);

      // First ensure we're authenticated
      if (!isAuthenticated) {
        toast.warning('Authentication required to mint tokens');
        const success = await authenticate();
        if (!success) {
          toast.error('Authentication failed. Please try again.');
          return;
        }
      }

      // Get auth token for API request
      const solanaToken =
        typeof window !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;

      if (!solanaToken) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Make the API call with proper Solana authentication
      const response = await fetch(`/api/poaps/${poapId}/mint`, {
        method: 'POST',
        headers: {
          Authorization: `Solana ${solanaToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mint tokens');
      }

      // Success! Show toast notification
      toast.success('POAP tokens minted successfully!');

      // Call the callback to update parent state if provided
      if (onTokensMinted && data.tokenSupply) {
        onTokensMinted(data.tokenSupply);
      }
    } catch (error) {
      console.error('Error minting tokens:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mint tokens');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update token metadata
  const updateTokenMetadata = async () => {
    try {
      setIsUpdatingMetadata(true);

      // First ensure we're authenticated
      if (!isAuthenticated) {
        toast.warning('Authentication required to update token metadata');
        const success = await authenticate();
        if (!success) {
          toast.error('Authentication failed. Please try again.');
          return;
        }
      }

      // Get auth token for API request
      const solanaToken =
        typeof window !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;

      if (!solanaToken) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Make the API call with proper Solana authentication
      const response = await fetch(`/api/poaps/${poapId}/token/update-metadata`, {
        method: 'POST',
        headers: {
          Authorization: `Solana ${solanaToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update token metadata');
      }

      // Success! Show toast notification
      toast.success('Token metadata updated successfully!');

      // Call the callback to update parent state if provided
      if (onMetadataUpdated) {
        onMetadataUpdated();
      }
    } catch (error) {
      console.error('Error updating token metadata:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update token metadata');
    } finally {
      setIsUpdatingMetadata(false);
    }
  };

  // Token exists and needs metadata update - show update message
  if (tokenStatus.minted && tokenStatus.metadataOutdated) {
    return (
      <div className="bg-purple-50 rounded-lg p-4 flex gap-3 items-start mb-6 shadow-sm">
        <RefreshCw className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-purple-800 mb-1">Token metadata needs to be updated</h3>
          <p className="text-purple-700 text-sm mb-3">
            Your POAP details have changed since the token metadata was last updated
            {tokenStatus.lastUpdated &&
              ` on ${new Date(tokenStatus.lastUpdated).toLocaleDateString()}`}
            .
          </p>
          <Button
            size="sm"
            className="bg-purple-600 text-white hover:bg-purple-700 gap-1.5 border-0"
            onClick={updateTokenMetadata}
            disabled={isUpdatingMetadata}
          >
            {isUpdatingMetadata ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating metadata...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Update Token Metadata
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Token exists and has supply - show success message
  if (tokenStatus.minted && tokenStatus.supply > 0) {
    return (
      <div className="bg-green-50 rounded-lg p-4 flex gap-3 items-start mb-6 shadow-sm">
        <Coins className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-green-800 mb-1">
            {tokenStatus.supply.toLocaleString()} compressed tokens minted
          </h3>
          <p className="text-green-700 text-sm">
            Your POAP has compressed tokens ready for distribution. Adding more distribution methods
            will automatically increase your token supply.
          </p>
        </div>
      </div>
    );
  }

  // Token exists but has 0 supply - show info message
  if (tokenStatus.minted && tokenStatus.supply === 0) {
    return (
      <div className="bg-blue-50 rounded-lg p-4 flex gap-3 items-start mb-6 shadow-sm">
        <Coins className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-800 mb-1">POAP token created with 0 supply</h3>
          <p className="text-blue-700 text-sm">
            Your POAP token has been created but has 0 supply. Adding more distribution methods will
            automatically mint additional tokens as needed.
          </p>
        </div>
      </div>
    );
  }

  // If there are no distribution methods at all, don't show the warning
  if (!hasDistributionMethods) {
    return null;
  }

  // Show warning only if no token exists but there are distribution methods
  return (
    <div className="bg-amber-50 rounded-lg p-4 flex gap-3 items-start mb-6 shadow-sm animate-pulse-subtle">
      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-medium text-amber-800 mb-1">Action Required: Mint Your POAP Tokens</h3>
        <p className="text-amber-700 text-sm mb-3">
          Your distribution methods are ready, but you need to mint tokens first.
        </p>
        <Button
          size="sm"
          className="bg-amber-600 text-white hover:bg-amber-700 gap-1.5 border-0"
          onClick={mintTokens}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Minting...
            </>
          ) : (
            <>
              <Coins className="h-4 w-4" />
              Mint POAP Token
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
