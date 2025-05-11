'use client';

import { ArrowLeft, Coins, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { POAPTabNav } from '@/components/poap/poap-tab-nav';
import { TokenStatusAlert } from '@/components/poap/token-status-alert';
import { useWalletContext } from '@/contexts/wallet-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { POAPMintModal } from '@/components/poap/poap-mint-modal';
import { usePOAPMintModal } from '@/hooks/use-poap-mint-modal';

// Import custom hooks and components
import { useTokenData } from './hooks/useTokenData';
import { TokenOverview } from './components/TokenOverview';
import { ErrorMessage } from './components/ErrorMessage';
import { MetadataViewer } from './components/MetadataViewer';

export default function POAPTokenPage() {
  const pathname = usePathname();
  const id = pathname.split('/')[2]; // Extract ID from URL path: /poaps/[id]/token
  const { isConnected, isAuthenticated, authenticate } = useWalletContext();

  // Use custom hooks
  const { modalState, openMintingModal, setMintSuccess, setMintError, onOpenChange } =
    usePOAPMintModal();

  const {
    tokenData,
    isLoading,
    isRefreshing,
    error,
    setError,
    setIsLoading,
    hasDistributionMethods,
    isPolling,
    blockchainData,
    isBlockchainLoading,
    blockchainError,
    metadata,
    isMetadataLoading,
    metadataError,
    fetchTokenData,
    fetchBlockchainTokenData,
    handleMintTokens,
    handleManualRefresh,
  } = useTokenData(id, isAuthenticated, authenticate);

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/poaps/${id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to POAP
            </Button>
          </Link>
        </div>

        {/* Use the shared tab navigation */}
        <div className="mb-8">
          <POAPTabNav poapId={id} />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Token Management</h2>
          <div className="flex items-center gap-2">
            {isPolling && (
              <div className="text-xs text-neutral-500 flex items-center">
                <RefreshCcw className="h-3 w-3 animate-spin mr-1" />
                Syncing...
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleManualRefresh}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Show token status alert if no tokens have been minted */}
        {tokenData && !tokenData.tokenMinted && (
          <TokenStatusAlert
            tokenStatus={{
              minted: tokenData.tokenMinted,
            }}
            poapId={id}
            hasDistributionMethods={hasDistributionMethods}
            onTokensMinted={() => handleMintTokens(openMintingModal, setMintSuccess, setMintError)}
          />
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading token information...</p>
          </div>
        ) : error ? (
          <ErrorMessage
            error={error}
            isLoading={isLoading}
            isConnected={isConnected}
            isAuthenticated={isAuthenticated}
            authenticate={authenticate}
            fetchTokenData={fetchTokenData}
            setIsLoading={setIsLoading}
            setError={setError}
            id={id}
          />
        ) : !tokenData?.tokenMinted ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8 text-center">
            <div className="inline-block p-4 bg-neutral-100 rounded-full mb-4">
              <Coins className="h-8 w-8 text-neutral-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              No Token Information Available
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              Mint your POAP token to view details. Set up distribution methods to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/poaps/${id}/distribution`}>
                <Button variant="outline" className="gap-1.5 w-full sm:w-auto">
                  Set Up Distribution
                </Button>
              </Link>
              {hasDistributionMethods && (
                <Button
                  className="gap-1.5 w-full sm:w-auto bg-amber-600 text-white hover:bg-amber-700"
                  onClick={() => {
                    handleMintTokens(openMintingModal, setMintSuccess, setMintError);
                  }}
                  disabled={isLoading}
                >
                  <Coins className="h-4 w-4" />
                  Mint POAP Token
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Token Details</h2>
            
            {/* Token Overview */}
            <TokenOverview
              token={tokenData.token}
              tokenSupply={tokenData.tokenSupply}
              blockchainData={blockchainData}
              isBlockchainLoading={isBlockchainLoading}
              blockchainError={blockchainError}
              fetchBlockchainTokenData={fetchBlockchainTokenData}
            />
            
            {/* Metadata Content */}
            <div className="mt-6">
              <MetadataViewer
                metadata={metadata}
                isMetadataLoading={isMetadataLoading}
                metadataError={metadataError}
              />
            </div>
          </div>
        )}

        {/* Add the POAPMintModal component to the JSX */}
        <POAPMintModal
          open={modalState.open}
          onOpenChange={onOpenChange}
          status={modalState.status}
          error={modalState.error}
          poapId={id}
          poapTitle={tokenData?.poap?.title}
        />
      </div>
    </div>
  );
}
