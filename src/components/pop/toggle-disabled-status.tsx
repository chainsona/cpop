'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { XCircle, AlertTriangle } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { PopStatus } from '@/generated/prisma';

interface ToggleDisabledStatusProps {
  popId: string;
  isDisabled: boolean;
}

export function ToggleDisabledStatus({ popId, isDisabled }: ToggleDisabledStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(isDisabled);
  const router = useRouter();

  const toggleStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Determine the new status using the enum
      const newStatus = currentStatus ? PopStatus.Published : PopStatus.Disabled;

      console.log('Setting POP status to:', newStatus);

      // Update the status using the API
      const response = await fetchWithAuth(`/api/pops/${popId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update POP status');
      }

      // Update the local state
      setCurrentStatus(!currentStatus);
      
      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
      console.error('Error toggling POP status:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <Label htmlFor="disable-pop" className="text-sm font-medium">
              Disable POP
            </Label>
          </div>
          <p className="text-xs text-neutral-500">
            When disabled, users cannot claim or view this POP. You can re-enable it anytime.
          </p>
        </div>
        <Switch
          id="disable-pop"
          checked={currentStatus}
          onCheckedChange={toggleStatus}
          disabled={isLoading}
          aria-label="Disable POP"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2 text-red-700 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 