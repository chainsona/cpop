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
import { CheckCircle, Loader2, AlertTriangle, Coins, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ClaimStatus = 'claiming' | 'minting' | 'success' | 'error' | 'partial' | 'authenticating';

interface ClaimProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ClaimStatus;
  error?: string;
  popTitle?: string;
  txId?: string;
  claimId?: string;
  onRetryAuth?: () => void;
}

export function ClaimProgressModal({
  open,
  onOpenChange,
  status,
  error,
  popTitle,
  txId,
  claimId,
  onRetryAuth,
}: ClaimProgressModalProps) {
  const router = useRouter();
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);
  
  // Check if the error is authentication related
  const isAuthError = error?.toLowerCase().includes('auth') || 
                       error?.toLowerCase().includes('wallet') ||
                       error?.toLowerCase().includes('connect');

  // Auto redirect after successful claim
  useEffect(() => {
    // Only set up auto-redirect if status is success
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
    
    // Reset the redirect message state when status changes
    setShowRedirectMessage(false);
  }, [status, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {status === 'claiming' && 'Claiming POP...'}
            {status === 'minting' && 'Minting POP Token...'}
            {status === 'success' && 'POP Claimed Successfully!'}
            {status === 'partial' && 'POP Claim Initiated'}
            {status === 'error' && (isAuthError ? 'Authentication Required' : 'Claim Failed')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {status === 'claiming' && 'Please wait while we verify your location.'}
            {status === 'minting' && 'Please wait while we transfer the token to your wallet.'}
            {status === 'success' && 'Your POP has been added to your wallet.'}
            {status === 'partial' && 'Your POP claim is being processed and will appear in your wallet shortly.'}
            {status === 'error' && (error || 'There was an error claiming your POP.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {/* Loading States */}
          {(status === 'claiming' || status === 'minting' || status === 'authenticating') && (
            <div className="flex flex-col items-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-50">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
              </div>
              <p className="mt-4 text-sm text-neutral-600">
                {status === 'claiming' && 'Claiming your POP...'}
                {status === 'minting' && 'Transferring to your wallet...'}
                {status === 'authenticating' && 'Authenticating your wallet...'}
              </p>
            </div>
          )}

          {/* Partial Success State */}
          {status === 'partial' && (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-yellow-50">
                  <Coins className="h-16 w-16 text-yellow-500" />
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-600">
                {popTitle ? `"${popTitle}" claim initiated` : 'POP claim initiated'}
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
                {popTitle ? `"${popTitle}" added to your collection` : 'POP added to your collection'}
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
                {isAuthError ? (
                  <KeyRound className="h-16 w-16 text-red-500" />
                ) : (
                  <AlertTriangle className="h-16 w-16 text-red-500" />
                )}
              </div>
              <p className="mt-4 text-sm text-neutral-600">{error}</p>
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="flex flex-col space-y-2">
            {isAuthError && onRetryAuth && (
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  onRetryAuth();
                }} 
                className="w-full"
                type="button"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Authenticate Wallet
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="w-full"
              type="button"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 