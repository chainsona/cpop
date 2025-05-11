'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/poap/empty-state';
import { POAPCard } from '@/components/poap/poap-card';
import { PoapItem } from '@/types/poap';
import { Container } from '@/components/ui/container';
import { PageTitle } from '@/components/ui/page-title';

export default function ExplorerPage() {
  const [poaps, setPoaps] = useState<PoapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPoaps() {
      try {
        setIsLoading(true);

        // Use the correct port based on the development server
        const port = process.env.NODE_ENV === 'development' ? window.location.port : '';
        const baseUrl = `${window.location.protocol}//${window.location.hostname}${port ? ':' + port : ''}`;

        const apiUrl = `${baseUrl}/api/poaps/public`;
        console.log(`Fetching public POAPs from: ${apiUrl}`);

        const response = await fetch(apiUrl, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Failed to fetch public POAPs:', response.status, errorData);
          throw new Error(`Failed to fetch public POAPs: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);
        
        if (!data.poaps || !Array.isArray(data.poaps)) {
          console.error('Unexpected response format:', data);
          setDebugInfo(`Unexpected response format: ${JSON.stringify(data, null, 2)}`);
          setPoaps([]);
        } else {
          setPoaps(data.poaps);
          setDebugInfo(
            `Found ${data.poaps.length} POAPs. ` + 
            (data.poaps.length > 0 
              ? `First POAP: ${data.poaps[0].title} (${data.poaps[0].status})`
              : 'No POAPs in response.')
          );
        }
      } catch (err) {
        console.error('Error fetching public POAPs:', err);
        setError('Failed to load public POAPs');
        setDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPoaps();
  }, []);

  return (
    <Container>
      <div className="py-10">
        <PageTitle
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
            {debugInfo && process.env.NODE_ENV === 'development' && (
              <pre className="mt-2 text-xs text-left bg-neutral-100 p-2 rounded overflow-auto">
                {debugInfo}
              </pre>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && poaps.length === 0 && !error && (
          <div>
            <EmptyState message="No public POAPs to explore yet" />
            {debugInfo && process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-xs text-neutral-500 bg-neutral-100 p-4 rounded-lg">
                <h3 className="font-semibold">Debug Info:</h3>
                <pre className="overflow-auto whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}
          </div>
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
