'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, KeyRound, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useWalletContext } from '@/contexts/wallet-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClaimProgressModal, ClaimStatus as ModalStatus } from './claim-progress-modal';

interface ClaimWithSecretProps {
  poapId: string;
  poapTitle?: string;
}

export function ClaimWithSecret({ poapId, poapTitle }: ClaimWithSecretProps) {
  const [secretWord, setSecretWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isConnected, isAuthenticated, authenticate, walletAddress } = useWalletContext();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [claimStatus, setClaimStatus] = useState<ModalStatus>('claiming');
  const [claimError, setClaimError] = useState<string | undefined>();
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const [claimId, setClaimId] = useState<string | undefined>();

  // Auto-authenticate when component mounts if wallet is connected but not authenticated
  useEffect(() => {
    const attemptAuthentication = async () => {
      if (isConnected && !isAuthenticated && !authLoading && walletAddress) {
        setAuthLoading(true);
        try {
          await authenticate();
        } catch (error) {
          console.error('Auto-authentication failed:', error);
        } finally {
          setAuthLoading(false);
        }
      }
    };

    attemptAuthentication();
  }, [isConnected, isAuthenticated, authenticate, authLoading, walletAddress]);

  const handleAuthenticate = async () => {
    setError(null);
    setAuthLoading(true);

    try {
      const success = await authenticate();
      if (!success) {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Error during authentication:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!secretWord.trim()) {
      setError('Please enter the secret word');
      return;
    }

    setLoading(true);

    try {
      // Check authentication first
      if (!isAuthenticated) {
        const authenticated = await authenticate();
        if (!authenticated) {
          setError('You must be authenticated to claim this POAP');
          setLoading(false);
          return;
        }
      }

      // Show the claiming modal
      setClaimStatus('claiming');
      setModalOpen(true);

      // Submit the secret word to claim the POAP
      const response = await fetch(`/api/poaps/${poapId}/claim/SecretWord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ secretWord }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to claim POAP');
      }

      const data = await response.json();

      // Update modal with success state
      setClaimStatus('success');
      setTransactionId(data.claimTxId);
      setClaimId(data.claimId);

      // Show success message
      toast.success('POAP claimed successfully!');
    } catch (err) {
      console.error('Error claiming POAP:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim POAP';

      // Update modal with error state
      setClaimStatus('error');
      setClaimError(errorMessage);
      setError(errorMessage);
      toast.error('Failed to claim POAP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated, show auth prompt
  if (!isAuthenticated) {
    return (
      <Card className="border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-500" />
            Claim with Secret Word
          </CardTitle>
          <CardDescription>Authentication required before claiming</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to authenticate your wallet before claiming this POAP.
            </AlertDescription>
          </Alert>

          <Button onClick={handleAuthenticate} disabled={authLoading} className="w-full">
            {authLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Authenticate Wallet'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-500" />
            Claim with Secret Word
          </CardTitle>
          <CardDescription>
            Enter the secret word provided by the event organizer to claim your POAP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter secret word"
                value={secretWord}
                onChange={e => setSecretWord(e.target.value)}
                disabled={loading}
                className="w-full"
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  Claim POAP <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Claim Progress Modal */}
      <ClaimProgressModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        status={claimStatus}
        error={claimError}
        poapTitle={poapTitle}
        txId={transactionId}
        claimId={claimId}
      />
    </>
  );
}
