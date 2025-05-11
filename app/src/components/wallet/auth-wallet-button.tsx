'use client';

import { useState, useEffect } from 'react';
import { useWalletContext } from '@/contexts/wallet-context';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2 } from 'lucide-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface AuthWalletButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  text?: string;
  onAuthSuccess?: (token: string) => void;
}

export function AuthWalletButton({
  variant = 'default',
  size = 'default',
  className = '',
  text = 'Authenticate with Wallet',
  onAuthSuccess,
}: AuthWalletButtonProps) {
  const { isConnected, connecting, isAuthenticated, authenticate } = useWalletContext();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track successful authentication to handle redirect
  const [authSuccessful, setAuthSuccessful] = useState(false);

  // Handle redirection after authentication
  useEffect(() => {
    if (authSuccessful && isAuthenticated) {
      // Get return URL from query parameters
      const returnUrl = searchParams.get('returnUrl');
      const redirectParam = searchParams.get('redirect');
      const targetUrl = returnUrl || redirectParam || null;

      console.log('Authentication successful, checking for redirect:', {
        returnUrl,
        redirectParam,
        targetUrl,
      });

      if (targetUrl) {
        console.log('Redirecting to:', targetUrl);
        try {
          // Execute the redirect with a slight delay to ensure state updates are processed
          setTimeout(() => {
            router.push(targetUrl);
          }, 100);
        } catch (error) {
          console.error('Failed to redirect:', error);
          toast.error('Failed to redirect after authentication');
        }
      }

      // Reset flag after handling redirect
      setAuthSuccessful(false);
    }
  }, [authSuccessful, isAuthenticated, router, searchParams]);

  // Handle the button click action
  const handleClick = async () => {
    // If not connected, open wallet connect modal
    if (!isConnected) {
      setVisible(true);
      return;
    }

    // If connected but not authenticated, trigger authentication
    if (!isAuthenticated) {
      setIsAuthenticating(true);
      try {
        const success = await authenticate();
        console.log('Authentication result:', success);

        if (success) {
          // Get token for onAuthSuccess callback
          const token = localStorage.getItem('solana_auth_token');

          if (token && onAuthSuccess) {
            onAuthSuccess(token);
          }

          // Set flag to trigger redirect in useEffect
          setAuthSuccessful(true);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        toast.error('Authentication failed');
      } finally {
        setIsAuthenticating(false);
      }
    }
  };

  // Determine the button text based on the current state
  const getButtonText = () => {
    if (connecting) return 'Connecting...';
    if (isAuthenticating) return 'Authenticating...';
    if (isAuthenticated) return 'Authenticated';
    if (isConnected) return 'Authenticate';
    return text;
  };

  // Determine if the button should be disabled
  const isDisabled = connecting || isAuthenticating || isAuthenticated;

  return (
    <Button
      variant={isAuthenticated ? 'secondary' : variant}
      size={size}
      className={`flex items-center gap-2 ${isAuthenticated ? 'bg-green-50 text-green-600 hover:bg-green-100' : ''} ${className}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {connecting || isAuthenticating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      {getButtonText()}
    </Button>
  );
}
