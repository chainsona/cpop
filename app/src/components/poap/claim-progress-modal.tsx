'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertTriangle, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ClaimStatus = 'claiming' | 'success' | 'error';

interface ClaimProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ClaimStatus;
  error?: string;
  poapTitle?: string;
  txId?: string;
  claimId?: string;
}

export function ClaimProgressModal({
  open,
  onOpenChange,
  status,
  error,
  poapTitle,
  txId,
  claimId,
}: ClaimProgressModalProps) {
  const router = useRouter();
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);

  // Auto redirect after successful claim
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setShowRedirectMessage(true);
      }, 1500);

      const redirectTimer = setTimeout(() => {
        router.push('/wallet');
      }, 3000);

      return () => {
        clearTimeout(timer);
        clearTimeout(redirectTimer);
      };
    }
  }, [status, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {status === 'claiming' && 'Claiming POAP...'}
            {status === 'success' && 'POAP Claimed Successfully!'}
            {status === 'error' && 'Claim Failed'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {status === 'claiming' && 'Please wait while we mint your POAP token.'}
            {status === 'success' && 'Your POAP has been added to your wallet.'}
            {status === 'error' && (error || 'There was an error claiming your POAP.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {/* Claiming State */}
          {status === 'claiming' && (
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
                    showRedirectMessage ? "opacity-100" : "opacity-0"
                  )}
                >
                  <Coins className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-600">
                {poapTitle ? `"${poapTitle}" added to your collection` : 'POAP added to your collection'}
              </p>
              {txId && (
                <a
                  href={`https://explorer.solana.com/tx/${txId}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  View transaction
                </a>
              )}
              {showRedirectMessage && (
                <p className="mt-4 animate-pulse text-sm font-medium text-blue-600">
                  Redirecting to your wallet...
                </p>
              )}
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="flex flex-col items-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-16 w-16 text-red-500" />
              </div>
              <p className="mt-4 text-sm text-neutral-600">{error}</p>
            </div>
          )}
        </div>

        {status === 'error' && (
          <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-2 w-full">
            Close
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
} 