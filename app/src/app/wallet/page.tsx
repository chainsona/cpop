'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletContext } from '@/contexts/wallet-context';
import { ConnectWallet } from '@/components/wallet/connect-wallet';
import { Wallet, ArrowLeft } from 'lucide-react';
import { POAPTokenProps } from '@/components/wallet/poap-token-card';
import { POAPTokenGrid } from '@/components/wallet/poap-token-grid';
import { usePageTitle } from '@/contexts/page-title-context';

export default function WalletPage() {
  const [tokens, setTokens] = useState<POAPTokenProps[]>([]);
  const [claims, setClaims] = useState<POAPTokenProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, isAuthenticated, walletAddress } = useWalletContext();
  const { setPageTitle } = usePageTitle();

  // Set page title
  useEffect(() => {
    setPageTitle('Wallet');
    
    return () => {
      setPageTitle('');
    };
  }, [setPageTitle]);

  // Load claimed POAPs and blockchain tokens when the wallet is authenticated
  const fetchData = async () => {
    if (!isAuthenticated || !walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch claims from database
      let claimsData = { claims: [] };
      try {
        const claimsResponse = await fetch('/api/wallet/claims', {
          credentials: 'include',
        });

        if (claimsResponse.ok) {
          claimsData = await claimsResponse.json();
        } else {
          console.warn('Failed to load claimed POAPs:', claimsResponse.status);
        }
      } catch (err) {
        console.error('Error fetching claims:', err);
      }

      // Map database claims to the component props format
      const formattedClaims = (claimsData.claims || []).map((claim: any) => ({
        id: claim.id,
        title: claim.poap?.title || 'Unknown POAP',
        description: claim.poap?.description || 'POAP details unavailable',
        imageUrl: claim.poap?.imageUrl || '/placeholder-token.svg',
        mintAddress: claim.mintAddress,
        transactionSignature: claim.transactionSignature,
        createdAt: claim.createdAt,
        amount: 1,
        source: 'database' as const,
        isCompressed: false, // Claimed tokens may not be compressed
      }));

      setClaims(formattedClaims);

      // Fetch tokens from blockchain that match POAP tokens
      try {
        const tokensResponse = await fetch('/api/wallet/tokens', {
          credentials: 'include',
        });

        if (tokensResponse.ok) {
          const tokensData = await tokensResponse.json();
          console.log('Token data:', tokensData);

          // All tokens returned are now guaranteed to be POAP tokens
          const formattedTokens = (tokensData.tokens || []).map((token: any) => ({
            id: token.id,
            title: token.title,
            description: token.description,
            imageUrl: token.imageUrl || '/placeholder-token.svg',
            mintAddress: token.mintAddress,
            amount: token.amount || 1,
            createdAt: token.createdAt,
            source: 'database' as const, // All tokens are from database
            isCompressed: token.isCompressed || false,
          }));

          setTokens(formattedTokens);

          // If we have no tokens, show a more helpful message
          if (formattedTokens.length === 0 && formattedClaims.length === 0) {
            setError(
              'No POAP tokens found in your wallet. Only compressed Token2022 POAP tokens are displayed.'
            );
          }
        } else {
          const errorData = await tokensResponse.json();
          console.error('Failed to load wallet tokens:', errorData);
          setError(errorData.message || 'Failed to load POAP tokens from your wallet');
        }
      } catch (err) {
        console.error('Error fetching blockchain tokens:', err);
        setError('Error connecting to blockchain. Please try again later.');
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load your POAPs');
    } finally {
      setLoading(false);
    }
  };

  // Load data on initial mount
  useEffect(() => {
    fetchData();
  }, [isAuthenticated, walletAddress]);

  const handleAuthChange = (authState: boolean) => {
    if (authState) {
      // Reload data when authenticated
      fetchData();
    }
  };

  const handleRetry = () => {
    fetchData();
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Connect Your Wallet</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Wallet className="h-16 w-16 text-blue-500 mb-4" />
              <p className="text-center mb-6 text-neutral-600">
                Connect your wallet to view your claimed POAPs
              </p>
              <ConnectWallet
                variant="default"
                size="lg"
                onAuthChange={handleAuthChange}
                showAddress={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="text-neutral-600 mt-1">Showing your POAP tokens</p>
        </div>
      </div>

      <POAPTokenGrid
        tokens={tokens}
        claimedTokens={claims}
        loading={loading}
        error={error}
        onRetry={handleRetry}
      />
    </div>
  );
}
