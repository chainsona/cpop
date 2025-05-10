'use client';

import { useEffect, useState } from 'react';
import { POAPForm } from './POAPForm';
import { AlertCircle, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditPOAPProps {
  id: string;
}

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-neutral-100', className)} {...props} />;
}

export function EditPOAP({ id }: EditPOAPProps) {
  const [poapData, setPoapData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const fetchPOAP = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setDebugInfo(null);

        console.log(`Fetching POAP with ID: ${id}`);
        const response = await fetch(`/api/poaps/${id}`);

        // Get response status details
        const statusInfo = {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        };
        console.log('Response status:', statusInfo);

        if (!response.ok) {
          throw new Error(`Failed to fetch POAP data: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('Raw API response:', responseData);

        // Store debug info
        setDebugInfo(responseData);

        // Check if the response contains the POAP property
        if (!responseData.poap) {
          throw new Error('Invalid response format from API - missing poap property');
        }

        // Extract the POAP data from the response
        const poapDetails = responseData.poap;
        console.log('Extracted POAP data:', poapDetails);

        // Convert string dates to Date objects
        const formattedData = {
          ...poapDetails,
          id: poapDetails.id, // Ensure ID is passed correctly
          startDate: poapDetails.startDate ? new Date(poapDetails.startDate) : undefined,
          endDate: poapDetails.endDate ? new Date(poapDetails.endDate) : undefined,
        };

        setPoapData(formattedData);
      } catch (error) {
        console.error('Error fetching POAP:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPOAP();
    }
  }, [id]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>

        {debugInfo && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="h-4 w-4" />
              <h3 className="font-medium">Debug Information</h3>
            </div>
            <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-[300px]">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <POAPForm
      mode="edit"
      initialData={poapData}
      onSuccess={data => {
        // Redirect to the POAP details page
        window.location.href = `/poaps/${id}`;
      }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
