'use client';

import { POAPTokenCard, POAPTokenProps } from './poap-token-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EmptyState } from '@/components/poap/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

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

  // First deduplicate the tokens array itself
  const uniqueTokens = poapTokens.reduce((acc: POAPTokenProps[], current) => {
    const isDuplicate = acc.some(item => 
      (item.id === current.id) || 
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
    const isDuplicate = allTokens.some(token => 
      token.id === claimed.id || 
      (token.mintAddress && claimed.mintAddress && token.mintAddress === claimed.mintAddress) ||
      (token.title === claimed.title && token.imageUrl === claimed.imageUrl)
    );
    
    if (!isDuplicate) {
      allTokens.push(claimed);
    }
  });

  const walletCount = uniqueTokens.length;
  const totalCount = allTokens.length;

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
          message="No POAP tokens found in your wallet. Explore events to claim your first POAP token."
          showButton={true}
          buttonText="Explore Events"
          buttonUrl="/"
          icon={<img src="/no-poaps.svg" alt="No POAP tokens found" className="h-12 w-12" />}
        />
      </div>
    );
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
        <TabsTrigger value="wallet">In Wallet ({walletCount})</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr">
          {allTokens.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                message="No POAP tokens found in your wallet or claimed history."
                showButton={false}
                icon={<Wallet className="h-8 w-8 text-neutral-400" />}
              />
            </div>
          ) : (
            allTokens.map(token => <POAPTokenCard key={`all-${token.id}`} {...token} />)
          )}
        </div>
      </TabsContent>

      <TabsContent value="wallet" className="mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr">
          {poapTokens.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                message="No POAP tokens found in your wallet. Claim POAPs to view them here."
                showButton={true}
                buttonText="Explore Events"
                buttonUrl="/"
                icon={<Wallet className="h-8 w-8 text-neutral-400" />}
              />
            </div>
          ) : (
            poapTokens.map(token => <POAPTokenCard key={`poap-${token.id}`} {...token} />)
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
