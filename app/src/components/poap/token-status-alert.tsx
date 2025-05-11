import { AlertTriangle, Coins, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { useWalletContext } from '@/contexts/wallet-context';
import { POAPMintModal } from './poap-mint-modal';
import { usePOAPMintModal } from '@/hooks/use-poap-mint-modal';
import { mintPOAPTokens } from '@/lib/mint-tokens-utils';

interface TokenStatusAlertProps {
  tokenStatus: {
    minted: boolean;
    metadataOutdated?: boolean;
    lastUpdated?: string;
  };
  poapId: string;
  hasDistributionMethods?: boolean;
  onTokensMinted?: (newSupply?: number) => void;
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
  const { modalState, openMintingModal, setMintSuccess, setMintError, onOpenChange } =
    usePOAPMintModal();

  // Function to mint tokens using the centralized utility
  const mintTokens = async () => {
    setIsLoading(true);

    const result = await mintPOAPTokens({
      poapId,
      authenticate,
      isAuthenticated,
      onMintStart: openMintingModal,
      onSuccess: data => {
        setMintSuccess();
        // Call the callback if provided
        if (onTokensMinted) {
          onTokensMinted();
        }
      },
      onError: error => {
        setMintError(error);
      },
    });

    setIsLoading(false);
  };

  // Function to update token metadata
  const updateTokenMetadata = async () => {
    try {
      setIsUpdatingMetadata(true);

      // First ensure we're authenticated
      if (!isAuthenticated) {
        const success = await authenticate();
        if (!success) {
          setIsUpdatingMetadata(false);
          toast.error('Authentication failed. Please log in and try again.');
          return;
        }
      }

      // Get the Solana auth token exactly as stored by the wallet context
      const solanaToken =
        typeof window !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;

      if (!solanaToken) {
        setIsUpdatingMetadata(false);
        toast.error('Authentication token not found. Please log in again.');
        return;
      }

      // Make API call to update metadata
      const response = await fetch(`/api/poaps/${poapId}/token/update-metadata`, {
        method: 'POST',
        headers: {
          Authorization: `Solana ${solanaToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update metadata');
      }

      toast.success('Token metadata updated successfully!');

      // Call the callback if provided
      if (onMetadataUpdated) {
        onMetadataUpdated();
      }
    } catch (err) {
      console.error('Error updating token metadata:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to update metadata. Please try again.'
      );
    } finally {
      setIsUpdatingMetadata(false);
    }
  };

  // Render component with appropriate alert and modal
  let alertContent = null;

  // Token exists and needs metadata update - show update message
  if (tokenStatus.minted && tokenStatus.metadataOutdated) {
    alertContent = (
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
                Update Metadata
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }
  // Token exists - show success message
  else if (tokenStatus.minted) {
    alertContent = (
      <div className="bg-green-50 rounded-lg p-4 flex gap-3 items-start mb-6 shadow-sm">
        <Coins className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-green-800 mb-1">POAP Token is ready</h3>
          <p className="text-green-700 text-sm">
            Your POAP token has been successfully minted and is ready for distribution.
          </p>
        </div>
      </div>
    );
  }
  // No token and has distribution methods - show warning
  else if (!tokenStatus.minted && hasDistributionMethods) {
    alertContent = (
      <div className="bg-yellow-50 rounded-lg p-4 flex gap-3 items-start mb-6 shadow-sm">
        <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800 mb-1">POAP Token not minted yet</h3>
          <p className="text-yellow-700 text-sm mb-3">
            You've created distribution methods, but the POAP Token is not minted yet. Users won't
            be able to claim POAPs until the token is minted.
          </p>
          <Button
            size="sm"
            className="bg-yellow-500 text-white hover:bg-yellow-600 gap-1.5 border-0"
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

  // Return the alert content with the modal
  return (
    <>
      {alertContent}

      <POAPMintModal
        open={modalState.open}
        onOpenChange={onOpenChange}
        status={modalState.status}
        error={modalState.error}
        poapId={poapId}
      />
    </>
  );
}
