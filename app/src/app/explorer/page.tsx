'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/poap/empty-state';
import { POAPCard } from '@/components/poap/poap-card';
import { PoapItem } from '@/types/poap';
import { fetchWithAuth } from '@/lib/api-client';
import { useWalletContext } from '@/contexts/wallet-context';
import { ConnectWallet } from '@/components/wallet/connect-wallet';

export default function ExplorerPage() {
  const [poaps, setPoaps] = useState<PoapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, isAuthenticated } = useWalletContext();

  useEffect(() => {
    async function fetchPoaps() {
      try {
        setIsLoading(true);
        const response = await fetchWithAuth('/api/poaps');
        
        if (!response.ok) {
          throw new Error('Failed to fetch POAPs');
        }
        
        const data = await response.json();
        setPoaps(data.poaps || []);
      } catch (err) {
        console.error('Error fetching POAPs:', err);
        setError('Failed to load POAPs');
      } finally {
        setIsLoading(false);
      }
    }

    if (isConnected && isAuthenticated) {
      fetchPoaps();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, isAuthenticated]);

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-6 w-6 text-pink-600" />
          <h1 className="text-3xl font-bold">Explorer</h1>
        </div>

        <p className="text-neutral-600 mb-8">
          Explore and explorer interesting POAPs from the community.
        </p>

        {/* Show auth wall if not connected */}
        {!isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center mb-8">
            <h2 className="text-xl font-semibold mb-4">Connect your wallet</h2>
            <p className="text-neutral-600 mb-6">
              Connect your wallet to explorer and explore POAPs.
            </p>
            <ConnectWallet />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading POAPs...</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {isConnected && isAuthenticated && !isLoading && poaps.length === 0 && !error && (
          <EmptyState message="No POAPs to explorer yet" />
        )}

        {/* Results */}
        {isConnected && isAuthenticated && !isLoading && poaps.length > 0 && (
          <div className="space-y-6">
            {poaps.map(poap => (
              <POAPCard key={poap.id} poap={poap} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 