'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/poap/empty-state';
import { POAPCard } from '@/components/poap/poap-card';
import { PoapItem } from '@/types/poap';
import { useWalletContext } from '@/contexts/wallet-context';
import { ConnectWallet } from '@/components/wallet/connect-wallet';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';

export default function ExplorerPage() {
  const [poaps, setPoaps] = useState<PoapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, isAuthenticated } = useWalletContext();

  useEffect(() => {
    async function fetchPoaps() {
      try {
        setIsLoading(true);

        // Use the correct port based on the development server
        const port = process.env.NODE_ENV === 'development' ? window.location.port : '';
        const baseUrl = `${window.location.protocol}//${window.location.hostname}${port ? ':' + port : ''}`;

        console.log(`Fetching POAPs from: ${baseUrl}/api/poaps`);

        const response = await fetch(`${baseUrl}/api/poaps`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Failed to fetch POAPs:', response.status, errorData);
          throw new Error(`Failed to fetch POAPs: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);

        setPoaps(data.poaps || []);
      } catch (err) {
        console.error('Error fetching POAPs:', err);
        setError('Failed to load POAPs');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPoaps();
  }, []);

  return (
    <Container>
      <div className="py-10">
        <PageHeader
          title="Explorer"
          subtitle={
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-pink-600" />
              <span>Interesting POAPs from the community</span>
            </div>
          }
        />

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
        {!isLoading && poaps.length === 0 && !error && (
          <EmptyState message="No public POAPs to explore yet" />
        )}

        {/* Results */}
        {!isLoading && poaps.length > 0 && (
          <div className="space-y-6">
            {poaps.map(poap => (
              <POAPCard key={poap.id} poap={poap} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
