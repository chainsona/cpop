'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletContext } from '@/contexts/wallet-context';
import { ConnectWallet } from '@/components/wallet/connect-wallet';
import { Wallet } from 'lucide-react';
import { POPTokenProps } from '@/components/wallet/pop-token-card';
import { POPTokenGrid } from '@/components/wallet/pop-token-grid';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import { WalletMismatchAlert } from '@/components/wallet/wallet-mismatch-alert';

export default function WalletPage() {
  const [tokens, setTokens] = useState<POPTokenProps[]>([]);
  const [claims, setClaims] = useState<POPTokenProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { 
    isConnected, 
    isAuthenticated, 
    walletAddress, 
    hasWalletMismatch 
  } = useWalletContext();

  // Debug logging
  useEffect(() => {
    console.log('Wallet connection state:', { 
      isConnected, 
      isAuthenticated, 
      walletAddress,
      hasWalletMismatch
    });
  }, [isConnected, isAuthenticated, walletAddress, hasWalletMismatch]);

  // Load claimed POPs and blockchain tokens when the wallet is authenticated
  const fetchData = async () => {
    if (!isAuthenticated || !walletAddress) {
      setError('Please authenticate your wallet to view your POPs');
      setLoading(false);
      return;
    }

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
          console.warn('Failed to load claimed POPs:', claimsResponse.status);
        }
      } catch (err) {
        console.error('Error fetching claims:', err);
      }

      // Map database claims to the component props format
      const formattedClaims = (claimsData.claims || []).map((claim: any) => ({
        id: claim.id,
        title: claim.pop?.title || 'Unknown POP',
        description: claim.pop?.description || 'POPdetails unavailable',
        imageUrl: claim.pop?.imageUrl || '/placeholder-token.svg',
        mintAddress: claim.mintAddress,
        transactionSignature: claim.transactionSignature,
        createdAt: claim.createdAt,
        amount: 1,
        source: 'database' as const,
        isCompressed: false, // Claimed tokens may not be compressed
      }));

      setClaims(formattedClaims);

      // Fetch tokens from blockchain that match POP Tokens
      try {
        const tokensResponse = await fetch('/api/wallet/tokens', {
          credentials: 'include',
        });

        if (tokensResponse.ok) {
          const tokensData = await tokensResponse.json();
          console.log('Token data:', tokensData);

          // All tokens returned are now guaranteed to be POP Tokens
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
            setError('Only compressed Token2022 POP Tokens are displayed.');
          }
        } else {
          try {
            const errorData = await tokensResponse.json();
            console.error('Failed to load wallet tokens:', errorData);

            // Check if errorData is empty or doesn't have a message
            if (!errorData || Object.keys(errorData).length === 0 || !errorData.message) {
              setError(`Failed to load POP Tokens (HTTP ${tokensResponse.status})`);
            } else if (tokensResponse.status === 401) {
              setError('Authentication required. Please reconnect your wallet.');
            } else {
              setError(errorData.message);
            }
          } catch (jsonError) {
            console.error('Failed to load wallet tokens. Status:', tokensResponse.status);
            if (tokensResponse.status === 401) {
              setError('Authentication required. Please reconnect your wallet.');
            } else {
              setError(`Failed to load POP Tokens (HTTP ${tokensResponse.status})`);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching blockchain tokens:', err);
        setError('Error connecting to blockchain. Please try again later.');
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load your POPs');
    } finally {
      setLoading(false);
    }
  };

  // Load data on initial mount
  useEffect(() => {
    fetchData();
  }, [isAuthenticated, walletAddress]);

  // Handle authentication change
  const handleAuthChange = (authenticated: boolean) => {
    console.log('Authentication changed:', authenticated);
    if (authenticated) {
      // Trigger a reload of token data when authenticated
      handleRetry();
    }
  };

  const handleRetry = () => {
    fetchData();
  };

  if (!isConnected || !isAuthenticated) {
    return (
      <Container>
        <div className="py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {isConnected ? 'Authenticate Your Wallet' : 'Connect Your Wallet'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <Wallet className="h-16 w-16 text-blue-500 mb-4" />
                <p className="text-center mb-6 text-neutral-600">
                  {isConnected
                    ? 'Please authenticate your wallet to view your POPs'
                    : 'Connect your wallet to view your claimed POPs'}
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
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8">
        <PageHeader
          title="Wallet"
          subtitle={
            <div className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-blue-500" />
              <span>View your POP Tokens</span>
            </div>
          }
          backLink="/"
          backLabel="Back to Home"
        />

        {/* Show wallet mismatch alert if applicable */}
        {hasWalletMismatch && <WalletMismatchAlert />}

        <POPTokenGrid
          tokens={tokens}
          claimedTokens={claims}
          loading={loading}
          error={error}
          onRetry={handleRetry}
        />
      </div>
    </Container>
  );
}
