'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWalletContext } from '@/contexts/wallet-context';
import { WalletAuth } from '@/components/wallet/wallet-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallbackUrl?: string;
}

/**
 * Component that protects routes requiring wallet connection
 * If user is not connected, shows the wallet connection UI
 * If a fallbackUrl is provided, will redirect to that URL instead
 */
export function ProtectedRoute({ children, fallbackUrl }: ProtectedRouteProps) {
  const { isConnected, connecting } = useWalletContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user has a valid auth token
    const token = localStorage.getItem('solana_auth_token');
    
    // If token exists, user is authenticated
    if (token) {
      try {
        // You could add token validation here if needed
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Invalid auth token:', error);
        localStorage.removeItem('solana_auth_token');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    
    setIsLoading(false);
  }, [isConnected]);

  // If we're still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-neutral-500 mt-4">Checking authentication...</p>
      </div>
    );
  }

  // If authenticated, render the children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated and a fallback URL is provided, redirect
  if (fallbackUrl) {
    // Store the current path so we can redirect back after auth
    localStorage.setItem('auth_redirect', pathname);
    
    // Using router.push in useEffect to avoid React warnings about
    // state updates during rendering
    useEffect(() => {
      // Add the redirect parameter to the fallback URL
      const redirectUrl = new URL(fallbackUrl, window.location.origin);
      
      // Add the redirect parameter if the fallback URL is the auth page
      // This ensures we don't override any existing redirect parameter on other pages
      if (redirectUrl.pathname === '/auth') {
        redirectUrl.searchParams.set('redirect', pathname);
      }
      
      router.push(redirectUrl.pathname + redirectUrl.search);
    }, [router, fallbackUrl, pathname]);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-neutral-500 mt-4">Redirecting...</p>
      </div>
    );
  }

  // If not authenticated and no fallback URL, show the wallet auth UI
  return (
    <div className="container mx-auto py-12 px-4">
      <WalletAuth
        onAuthSuccess={() => setIsAuthenticated(true)}
      >
        {children}
      </WalletAuth>
    </div>
  );
} 