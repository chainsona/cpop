'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/pop/empty-state';
import { POPCard } from '@/components/pop/pop-card';
import { PopItem } from '@/types/pop';
import { Container } from '@/components/ui/container';
import { PageTitle } from '@/components/ui/page-title';
import { POPCardSkeletonList } from '@/components/pop/pop-card-skeleton';

export default function ExplorerPage() {
  const [pops, setPops] = useState<PopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPops() {
      try {
        setIsLoading(true);

        // Use the correct port based on the development server
        const port = process.env.NODE_ENV === 'development' ? window.location.port : '';
        const baseUrl = `${window.location.protocol}//${window.location.hostname}${port ? ':' + port : ''}`;

        const apiUrl = `${baseUrl}/api/pops/public`;
        console.log(`Fetching public POPs from: ${apiUrl}`);

        const response = await fetch(apiUrl, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Failed to fetch public POPs:', response.status, errorData);
          throw new Error(`Failed to fetch public POPs: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);
        
        if (!data.pops || !Array.isArray(data.pops)) {
          console.error('Unexpected response format:', data);
          setDebugInfo(`Unexpected response format: ${JSON.stringify(data, null, 2)}`);
          setPops([]);
        } else {
          setPops(data.pops);
          setDebugInfo(
            `Found ${data.pops.length} POPs. ` + 
            (data.pops.length > 0 
              ? `First POP: ${data.pops[0].title} (${data.pops[0].status})`
              : 'No POPs in response.')
          );
        }
      } catch (err) {
        console.error('Error fetching public POPs:', err);
        setError('Failed to load public POPs');
        setDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPops();
  }, []);

  return (
    <Container>
      <div className="py-10">
        <PageTitle
          title="Explorer"
          subtitle={
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-pink-600" />
              <span>Interesting POPs from the community</span>
            </div>
          }
        />

        {/* Loading state - Show skeleton */}
        {isLoading && <POPCardSkeletonList count={4} />}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-8">
            <p className="text-red-700">{error}</p>
            {debugInfo && process.env.NODE_ENV === 'development' && (
              <pre className="mt-2 text-xs text-left bg-neutral-100 p-2 rounded overflow-auto">
                {debugInfo}
              </pre>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && pops.length === 0 && !error && (
          <div>
            <EmptyState message="No public POPs to explore yet" />
            {debugInfo && process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-xs text-neutral-500 bg-neutral-100 p-4 rounded-lg">
                <h3 className="font-semibold">Debug Info:</h3>
                <pre className="overflow-auto whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {!isLoading && pops.length > 0 && (
          <div className="space-y-6">
            {pops.map(pop => (
              <POPCard key={pop.id} pop={pop} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
