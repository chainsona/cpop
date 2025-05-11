'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Coins } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type MintStatus = 'minting' | 'success' | 'error';

interface POAPMintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: MintStatus;
  error?: string;
  poapId?: string;
  poapTitle?: string;
}

export function POAPMintModal({
  open,
  onOpenChange,
  status,
  error,
  poapId,
  poapTitle,
}: POAPMintModalProps) {
  const [showSuccessDetails, setShowSuccessDetails] = useState(false);

  // Show success details after a short delay
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setShowSuccessDetails(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {status === 'minting' && 'Minting POAP Token...'}
            {status === 'success' && 'POAP Token Minted!'}
            {status === 'error' && 'Minting Failed'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {status === 'minting' && 'Please wait while we process your request.'}
            {status === 'success' && 'Your POAP Token has been successfully minted.'}
            {status === 'error' && (error || 'There was an error minting the POAP Token.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {/* Minting State */}
          {status === 'minting' && (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
                <div className="h-32 w-32 rounded-full bg-blue-50 opacity-50"></div>
              </div>
              <p className="mt-4 text-sm text-neutral-600">This may take a few moments...</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div
                  className={cn(
                    "absolute -right-2 -top-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 transition-opacity duration-300",
                    showSuccessDetails ? "opacity-100" : "opacity-0"
                  )}
                >
                  <Coins className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-600">
                {poapTitle ? `"${poapTitle}" tokens are ready` : 'POAP tokens minted successfully'}
              </p>
              
              {poapId && showSuccessDetails && (
                <Link
                  href={`/poaps/${poapId}/token`}
                  className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1.5"
                  onClick={() => onOpenChange(false)}
                >
                  <Coins className="h-4 w-4" />
                  View token details
                </Link>
              )}
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="flex flex-col items-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-red-50">
                <Coins className="h-16 w-16 text-red-500" />
              </div>
              <p className="mt-4 text-sm text-neutral-600">{error || 'Failed to mint POAP tokens'}</p>
            </div>
          )}
        </div>

        {(status === 'error' || (status === 'success' && !poapId)) && (
          <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-2 w-full">
            Close
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
} 