'use client';

import { POAPTokenCard, POAPTokenProps } from './poap-token-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface POAPTokenGridProps {
  tokens: POAPTokenProps[];
  claimedTokens: POAPTokenProps[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function POAPTokenGrid({
  tokens,
  claimedTokens,
  loading,
  error,
  onRetry,
}: POAPTokenGridProps) {
  // We only want to show POAP tokens now
  const poapTokens = tokens.filter(token => token.source === 'database');

  // Add claimed tokens that aren't already in the wallet tokens list
  const allTokens = [...poapTokens];
  claimedTokens.forEach(claimed => {
    if (!allTokens.some(token => token.id === claimed.id)) {
      allTokens.push(claimed);
    }
  });

  const walletCount = poapTokens.length;
  const claimedCount = claimedTokens.length;
  const totalCount = allTokens.length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={onRetry}>Retry</Button>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="text-center py-8 flex flex-col items-center">
        <div className="w-64 h-64 mb-4">
          <img src="/no-poaps.svg" alt="No POAP tokens found" />
        </div>
        <h3 className="text-lg font-medium mb-2">No POAP Tokens Found</h3>
        <p className="text-neutral-500 mb-4">
          Your wallet doesn't contain any compressed POAP tokens registered in our system.
        </p>
        <Button asChild>
          <Link href="/">Explore Events</Link>
        </Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="all">All POAPs ({totalCount})</TabsTrigger>
        <TabsTrigger value="wallet">In Wallet ({walletCount})</TabsTrigger>
        {claimedCount > 0 && (
          <TabsTrigger value="claimed">Claimed POAPs ({claimedCount})</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="all" className="mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr">
          {allTokens.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-neutral-500">
                No POAP tokens found in your wallet or claimed history.
              </p>
            </div>
          ) : (
            allTokens.map(token => <POAPTokenCard key={`all-${token.id}`} {...token} />)
          )}
        </div>
      </TabsContent>

      <TabsContent value="wallet" className="mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr">
          {poapTokens.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-neutral-500">
                No POAP tokens found in your wallet. Claim POAPs to view them here.
              </p>
            </div>
          ) : (
            poapTokens.map(token => <POAPTokenCard key={`poap-${token.id}`} {...token} />)
          )}
        </div>
      </TabsContent>

      {claimedCount > 0 && (
        <TabsContent value="claimed" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr">
            {claimedTokens.map(token => (
              <POAPTokenCard key={`claimed-${token.id}`} {...token} />
            ))}
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
