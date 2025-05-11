'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWalletContext } from '@/contexts/wallet-context';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/contexts/page-title-context';
import { AuthWalletButton } from '@/components/wallet/auth-wallet-button';
import { toast } from 'sonner';

function AuthContent() {
  const { isConnected, isAuthenticated: contextAuthenticated } = useWalletContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Support both redirect and returnUrl parameters
  const redirectParam = searchParams.get('redirect');
  const returnUrlParam = searchParams.get('returnUrl');
  const redirectPath = returnUrlParam || redirectParam || '/';
  const { setPageTitle } = usePageTitle();

  // Set page title
  useEffect(() => {
    setPageTitle('Authentication');
    
    return () => {
      setPageTitle('');
    };
  }, [setPageTitle]);

  // Store the redirect path in localStorage when the component mounts
  useEffect(() => {
    if (redirectPath && redirectPath !== '/') {
      localStorage.setItem('auth_redirect', redirectPath);
      console.log('Stored redirect path:', redirectPath);
    }
  }, [redirectPath]);

  // Check if the user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('solana_auth_token');
    const isAuth = !!token || contextAuthenticated;
    
    console.log('Checking authentication status:', { 
      hasToken: !!token, 
      contextAuthenticated,
      redirectPath,
      returnUrlParam,
      redirectParam
    });
    
    setIsAuthenticated(isAuth);
    setLoading(false);
    
    // If already authenticated, handle redirect immediately
    if (isAuth) {
      handleRedirect();
    }
  }, [contextAuthenticated, redirectPath, returnUrlParam, redirectParam]);

  // Handle redirection after authentication status changes
  useEffect(() => {
    if (isAuthenticated && !loading) {
      handleRedirect();
    }
  }, [isAuthenticated, loading]);

  // Centralized redirect handling
  const handleRedirect = () => {
    // Get the redirect path from localStorage or use default
    const storedRedirect = localStorage.getItem('auth_redirect');
    const targetPath = returnUrlParam || redirectParam || storedRedirect || '/';
    
    // Clear the stored redirect
    localStorage.removeItem('auth_redirect');
    
    console.log('Authentication successful, redirecting to:', targetPath);
    
    try {
      // Navigate to the target path with slight delay to ensure state updates
      setTimeout(() => {
        router.push(targetPath);
      }, 100);
    } catch (error) {
      console.error('Redirect error:', error);
      toast.error('Failed to redirect after authentication');
    }
  };

  // Handle successful authentication callback from button
  const handleAuthSuccess = (token: string) => {
    console.log('Auth success callback triggered');
    setIsAuthenticated(true);
    // Redirection will be handled by the useEffect
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-neutral-500 mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md py-12 px-4">
      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Wallet Authentication</h1>
          <p className="text-neutral-500">
            Connect your Solana wallet to access protected areas of the application
          </p>
          {redirectPath && redirectPath !== '/' && (
            <p className="text-sm text-blue-500 mt-2">
              You'll be redirected to: {redirectPath}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <AuthWalletButton
            text="Authenticate with Wallet"
            onAuthSuccess={handleAuthSuccess}
            className="w-full"
          />

          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="text-neutral-500"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-neutral-500 mt-4">Loading auth page...</p>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
} 