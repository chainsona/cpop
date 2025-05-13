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

interface POPMintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: MintStatus;
  error?: string;
  popId?: string;
  popTitle?: string;
}

export function POPMintModal({
  open,
  onOpenChange,
  status,
  error,
  popId,
  popTitle,
}: POPMintModalProps) {
  const [showSuccessDetails, setShowSuccessDetails] = useState(false);
  const [mintingProgress, setMintingProgress] = useState(10);

  // Show success details after a short delay
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setShowSuccessDetails(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  // Simulate progress during minting
  useEffect(() => {
    if (status === 'minting') {
      // Reset progress when minting starts
      setMintingProgress(10);
      
      // Simulate progress in steps
      const progressIntervals = [
        { progress: 30, delay: 500 },
        { progress: 60, delay: 1500 },
        { progress: 80, delay: 2500 },
        { progress: 90, delay: 4000 },
      ];
      
      // Create timeouts for each progress step
      const timeouts = progressIntervals.map(({ progress, delay }) => 
        setTimeout(() => setMintingProgress(progress), delay)
      );
      
      // Clean up all timeouts when unmounting or status changes
      return () => timeouts.forEach(timeout => clearTimeout(timeout));
    }
  }, [status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] sm:max-w-md bg-gradient-to-br from-white to-blue-50 border border-blue-100 shadow-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(40%_36%_at_50%_0%,rgba(59,130,246,0.08)_0%,rgba(255,255,255,0)_100%)]"></div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-50/50 to-transparent"></div>
        </div>

        <DialogHeader className="relative z-10">
          <DialogTitle className="text-center text-xl font-semibold text-blue-950">
            {status === 'minting' && 'Minting POP Token...'}
            {status === 'success' && 'POP Token Minted!'}
            {status === 'error' && 'Minting Failed'}
          </DialogTitle>
          <DialogDescription className="text-center text-blue-700">
            {status === 'minting' && 'Please wait while we process your request.'}
            {status === 'success' && 'Your POP Token has been successfully minted.'}
            {status === 'error' && (error || 'There was an error minting the POP Token.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 relative z-10">
          {/* Minting State */}
          {status === 'minting' && (
            <div className="flex flex-col items-center w-full">
              <div className="relative mb-5">
                {/* Circular progress indicator */}
                <div className="h-36 w-36 rounded-full bg-blue-50 flex items-center justify-center relative">
                  {/* Animated ring */}
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                    <circle 
                      className="text-gray-200" 
                      strokeWidth="4" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="44" 
                      cx="50" 
                      cy="50" 
                    />
                    <circle 
                      className="text-blue-600 transition-all duration-500 ease-out" 
                      strokeWidth="4" 
                      strokeDasharray="276.5" 
                      strokeDashoffset={276.5 - (mintingProgress / 100 * 276.5)} 
                      strokeLinecap="round" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="44" 
                      cx="50" 
                      cy="50" 
                    />
                  </svg>
                  
                  {/* Percentage in the middle */}
                  <div className="flex flex-col items-center justify-center relative">
                    <span className="text-2xl font-semibold text-blue-700">{mintingProgress}%</span>
                    <Loader2 className="h-8 w-8 absolute -z-10 animate-spin text-blue-600 opacity-70" />
                  </div>
                </div>
              
                {/* Pulse effect */}
                <div className="absolute inset-0 animate-ping bg-blue-100 rounded-full opacity-20" style={{animationDuration: '3s'}}></div>
              </div>
              
              <p className="mt-4 text-base font-medium text-blue-800">
                {mintingProgress < 30 ? "Preparing token..." : 
                 mintingProgress < 60 ? "Creating token..." : 
                 mintingProgress < 80 ? "Registering token..." : 
                 "Finalizing..."}
              </p>
              
              <p className="text-sm text-blue-600/70 mt-1.5 max-w-xs text-center">
                This process may take a few moments. Please don't close this window.
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="flex h-36 w-36 items-center justify-center rounded-full bg-green-50 shadow-inner border border-green-100">
                  <CheckCircle className="h-20 w-20 text-green-500" />
                  
                  {/* Subtle pulse effect */}
                  <div className="absolute inset-0 animate-ping bg-green-100 rounded-full opacity-20" style={{animationDuration: '4s'}}></div>
                </div>
                <div
                  className={cn(
                    "absolute -right-2 -top-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 transition-all duration-500 shadow-md",
                    showSuccessDetails ? "opacity-100 scale-100" : "opacity-0 scale-90"
                  )}
                >
                  <Coins className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="mt-6 text-base font-medium text-blue-800">
                {popTitle ? `"${popTitle}" tokens are ready` : 'POP tokens minted successfully'}
              </p>
              
              {popId && showSuccessDetails && (
                <Link
                  href={`/pops/${popId}/token`}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 px-4 py-2 rounded-full transition-all hover:bg-blue-100"
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
              <div className="flex h-36 w-36 items-center justify-center rounded-full bg-red-50 shadow-inner border border-red-100">
                <Coins className="h-20 w-20 text-red-500" />
              </div>
              <p className="mt-6 text-base font-medium text-red-800">{error || 'Failed to mint POP tokens'}</p>
            </div>
          )}
        </div>

        {(status === 'error' || (status === 'success' && !popId)) && (
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="mt-2 w-full bg-white hover:bg-blue-50 border-blue-200 text-blue-700 relative z-10"
          >
            Close
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
} 