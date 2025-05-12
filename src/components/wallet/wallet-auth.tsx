'use client';

import { useEffect, useState } from 'react';
import { useWalletContext } from '@/contexts/wallet-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';
import { WalletConnectButton } from './wallet-connect-button';
import { SignatureMessage } from '@/lib/solana-auth';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import { useRouter, useSearchParams } from 'next/navigation';

export interface WalletAuthProps {
  onAuthSuccess?: (token: string) => void;
  children?: React.ReactNode;
  buttonText?: string;
  showConnectedState?: boolean;
}

/**
 * Solana wallet authentication component
 * Allows users to sign in with their Solana wallet
 */
export function WalletAuth({
  onAuthSuccess,
  children,
  buttonText = 'Sign in with Solana',
  showConnectedState = false,
}: WalletAuthProps) {
  const { isConnected, walletAddress, isAuthenticated, authenticate } = useWalletContext();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for stored token and handle redirects when the component mounts
  useEffect(() => {
    // Handle successful authentication (if we have onAuthSuccess or need to redirect)
    if (isAuthenticated) {
      // Get token from storage for passing to onAuthSuccess callback
      const cookieToken = getCookie('solana_auth_token');
      const localToken = localStorage.getItem('solana_auth_token');
      const token = cookieToken || localToken;
      
      if (token && onAuthSuccess) {
        onAuthSuccess(token.toString());
      } else {
        // Check for redirect parameter
        handleRedirectAfterAuth();
      }
    }
  }, [isAuthenticated]);

  // Handle redirect after authentication
  const handleRedirectAfterAuth = () => {
    // Check for redirect in localStorage first (from auth page)
    const storedRedirect = localStorage.getItem('auth_redirect');
    
    // Then check URL params
    const redirectParam = searchParams.get('redirect');
    
    // Determine the target path with priority: 
    // 1. Stored redirect from auth page
    // 2. URL redirect param
    // 3. Default to home
    const targetPath = storedRedirect || redirectParam || '/';
    
    // Clear the stored redirect
    localStorage.removeItem('auth_redirect');
    
    // Navigate to the target path if we're not already there
    if (window.location.pathname !== targetPath) {
      router.push(targetPath);
    }
  };

  const handleSignIn = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsAuthenticating(true);

    try {
      // Use the authenticate method from the context
      const success = await authenticate();
      
      if (success) {
        // If we have a success callback, call it with the token
        const token = getCookie('solana_auth_token') || localStorage.getItem('solana_auth_token');
        if (token && onAuthSuccess) {
          onAuthSuccess(token.toString());
        } else {
          // Check for redirect parameter
          handleRedirectAfterAuth();
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Failed to authenticate with wallet');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // If children are provided, render the children when authenticated
  if (children) {
    if (isAuthenticated) {
      return <>{children}</>;
    }
    
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
        <h3 className="text-lg font-medium">Wallet Authentication Required</h3>
        <p className="text-sm text-neutral-500 text-center mb-2">
          Please connect and authenticate with your Solana wallet to continue.
        </p>
        
        {!isConnected ? (
          <WalletConnectButton />
        ) : (
          <Button 
            onClick={handleSignIn} 
            disabled={isAuthenticating}
            className="flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            {isAuthenticating ? 'Authenticating...' : buttonText}
          </Button>
        )}
      </div>
    );
  }

  // Simple button mode
  if (isAuthenticated && showConnectedState) {
    return (
      <Button variant="secondary" className="flex items-center gap-2 bg-green-50 text-green-600 hover:bg-green-100" disabled>
        <Wallet className="h-4 w-4" />
        Authenticated
      </Button>
    );
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={!isConnected || isAuthenticating}
      className="flex items-center gap-2"
    >
      <Wallet className="h-4 w-4" />
      {isAuthenticating ? 'Authenticating...' : buttonText}
    </Button>
  );
} 