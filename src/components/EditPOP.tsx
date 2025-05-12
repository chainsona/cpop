'use client';

import { useEffect, useState } from 'react';
import { POPForm } from './POPForm';
import { AlertCircle, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditPOPProps {
  id: string;
}

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-neutral-100', className)} {...props} />;
}

export function EditPOP({ id }: EditPOPProps) {
  const [popData, setPopData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const fetchPOP = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setDebugInfo(null);

        console.log(`Fetching POP with ID: ${id}`);
        const response = await fetch(`/api/pops/${id}`);

        // Get response status details
        const statusInfo = {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        };
        console.log('Response status:', statusInfo);

        if (!response.ok) {
          throw new Error(`Failed to fetch POP data: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('Raw API response:', responseData);

        // Store debug info
        setDebugInfo(responseData);

        // Check if the response contains the POP property
        if (!responseData.pop) {
          throw new Error('Invalid response format from API - missing pop property');
        }

        // Extract the POP data from the response
        const popDetails = responseData.pop;
        console.log('Extracted POP data:', popDetails);

        // Convert string dates to Date objects
        const formattedData = {
          ...popDetails,
          id: popDetails.id, // Ensure ID is passed correctly
          startDate: popDetails.startDate ? new Date(popDetails.startDate) : undefined,
          endDate: popDetails.endDate ? new Date(popDetails.endDate) : undefined,
        };

        setPopData(formattedData);
      } catch (error) {
        console.error('Error fetching POP:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPOP();
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
    <POPForm
      mode="edit"
      initialData={popData}
      onSuccess={data => {
        // Redirect to the POP details page
        window.location.href = `/pops/${id}`;
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
