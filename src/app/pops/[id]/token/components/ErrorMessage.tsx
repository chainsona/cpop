import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AuthDebugInfo } from './AuthDebugInfo';
import { useState } from 'react';
import { resetAndReauthenticate } from '../utils';

interface ErrorMessageProps {
  error: string | null;
  isLoading: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  authenticate: () => Promise<boolean>;
  fetchTokenData: () => Promise<void>;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  id: string;
}

export const ErrorMessage = ({
  error,
  isLoading,
  isConnected,
  isAuthenticated,
  authenticate,
  fetchTokenData,
  setIsLoading,
  setError,
  id,
}: ErrorMessageProps) => {
  const [showDebug, setShowDebug] = useState(false);

  // Handle specific error messages
  if (error === 'Unauthorized') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 mb-4">You need to be logged in to view token information</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={async () => {
              try {
                setIsLoading(true);
                // Try to authenticate with NextAuth
                const success = await authenticate();
                if (success) {
                  // On successful authentication, clear error and fetch data
                  toast.success('Authentication successful');
                  setError(null);
                  fetchTokenData();
                } else {
                  toast.error('Authentication failed. Please try again.');
                }
              } catch (err) {
                console.error('Authentication error:', err);
                toast.error('Authentication process failed');
              } finally {
                setIsLoading(false);
              }
            }}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={fetchTokenData}
            disabled={isLoading}
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            onClick={() => resetAndReauthenticate(authenticate, setIsLoading, setError, fetchTokenData)}
            disabled={isLoading}
          >
            Reset Auth State
          </Button>
        </div>
        <p className="text-neutral-500 mt-4 text-sm">
          If you're already logged in, your session may have expired. Please log in again or try
          resetting your authentication state.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 text-neutral-500"
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'Hide Diagnostics' : 'Show Diagnostics'}
        </Button>
        <AuthDebugInfo 
          showDebug={showDebug}
          isConnected={isConnected}
          isAuthenticated={isAuthenticated}
          error={error}
          authenticate={authenticate}
          fetchTokenData={fetchTokenData}
          id={id}
        />
      </div>
    );
  } else if (error?.includes('permission')) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 mb-4">
          You don't have permission to view this POP's token information
        </p>
        <Link href="/pops">
          <Button>Back to My POPs</Button>
        </Link>
      </div>
    );
  }

  // Default error message
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p className="text-red-700 mb-4">{error}</p>
      <Button onClick={fetchTokenData}>Try Again</Button>
    </div>
  );
}; 