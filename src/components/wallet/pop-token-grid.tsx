'use client';

import { POPTokenCard, POPTokenProps } from './pop-token-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet } from 'lucide-react';
import { EmptyState } from '@/components/pop/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

interface POPTokenGridProps {
  tokens: POPTokenProps[];
  claimedTokens: POPTokenProps[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function POPTokenGrid({
  tokens,
  claimedTokens,
  loading,
  error,
  onRetry,
}: POPTokenGridProps) {
  // We only want to show POP tokens now
  const popTokens = tokens.filter(token => token.source === 'database');

  // First deduplicate the tokens array itself
  const uniqueTokens = popTokens.reduce((acc: POPTokenProps[], current) => {
    const isDuplicate = acc.some(
      item =>
        item.id === current.id ||
        (item.mintAddress && current.mintAddress && item.mintAddress === current.mintAddress) ||
        (item.title === current.title && item.imageUrl === current.imageUrl)
    );
    if (!isDuplicate) {
      acc.push(current);
    }
    return acc;
  }, []);

  // Then deduplicate claimed tokens against the unique tokens list
  const allTokens = [...uniqueTokens];
  claimedTokens.forEach(claimed => {
    const isDuplicate = allTokens.some(
      token =>
        token.id === claimed.id ||
        (token.mintAddress && claimed.mintAddress && token.mintAddress === claimed.mintAddress) ||
        (token.title === claimed.title && token.imageUrl === claimed.imageUrl)
    );

    if (!isDuplicate) {
      allTokens.push(claimed);
    }
  });

  // Identify pending tokens (those with a transactionSignature)
  const pendingTokens = allTokens.filter(token => token.transactionSignature);

  const walletCount = uniqueTokens.length;
  const totalCount = allTokens.length;
  const pendingCount = pendingTokens.length;

  if (loading) {
    return (
      <div className="py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={`skeleton-${i}`} className="flex flex-col">
                <Skeleton className="aspect-square w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-8 w-full mt-auto" />
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <EmptyState
          message={error}
          showButton={true}
          buttonText="Retry"
          buttonAction={onRetry}
          icon={<Wallet className="h-8 w-8 text-neutral-400" />}
        />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="py-8">
        <EmptyState
          message="No POP tokens found in your wallet. Explore events to claim your first POP token."
          showButton={true}
          buttonText="Explore Events"
          buttonUrl="/"
          icon={<img src="/no-pops.svg" alt="No POP tokens found" className="h-12 w-12" />}
        />
      </div>
    );
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
        <TabsTrigger value="wallet">In Wallet ({walletCount})</TabsTrigger>
        <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr">
          {allTokens.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                message="No POP tokens found in your wallet or claimed history."
                showButton={false}
                icon={<Wallet className="h-8 w-8 text-neutral-400" />}
              />
            </div>
          ) : (
            allTokens.map(token => <POPTokenCard key={`all-${token.id}`} {...token} />)
          )}
        </div>
      </TabsContent>

      <TabsContent value="wallet" className="mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr">
          {popTokens.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                message="No POP tokens found in your wallet. Claim POPs to view them here."
                showButton={true}
                buttonText="Explore Events"
                buttonUrl="/"
                icon={<Wallet className="h-8 w-8 text-neutral-400" />}
              />
            </div>
          ) : (
            popTokens.map(token => <POPTokenCard key={`pop-${token.id}`} {...token} />)
          )}
        </div>
      </TabsContent>

      <TabsContent value="pending" className="mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr">
          {pendingTokens.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                message="No pending POP tokens found."
                showButton={false}
                icon={<Wallet className="h-8 w-8 text-neutral-400" />}
              />
            </div>
          ) : (
            pendingTokens.map(token => <POPTokenCard key={`pending-${token.id}`} {...token} />)
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
