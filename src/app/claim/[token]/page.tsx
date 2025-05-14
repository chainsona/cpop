'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Trophy, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useWalletContext } from '@/contexts/wallet-context';
import { WalletConnectButton } from '@/components/wallet/wallet-connect-button';
import QRCode from 'react-qr-code';
import { ClaimPageSkeleton } from '@/components/pop/claim-skeleton';
import { SolanaPayQRCode } from '@/components/SolanaPayQRCode';

interface POP {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  creatorId: string;
  creatorName?: string;
}

interface ClaimStatus {
  valid: boolean;
  claimed: boolean;
  expired: boolean;
  pop: POP | null;
  message: string;
  claimTimestamp?: string;
  claimTxId?: string;
}

// Function to format wallet address with ellipsis
const formatWalletAddress = (address: string | null): string => {
  if (!address) return '';
  if (address.length <= 16) return address;

  return `${address.slice(0, 10)}...${address.slice(-10)}`;
};

// Function to get a shortened URL value for QR codes
const getShortenedQrValue = (pop: POP): string => {
  // Use a shorter identifier - just the ID with a prefix
  return `https://cpop.maikers.com/p/${pop.id}`;
};

// Component to render the Solana Pay QR code
const PopDisplay = ({
  pop,
  size,
  className = '',
  token,
}: {
  pop: POP;
  size: number;
  className?: string;
  token: string;
}) => {
  // Ensure minimum size for the QR code
  const displaySize = Math.max(size, 128);

  return (
    <div className={`${className} hidden sm:block`}>
      <div className="flex flex-col items-center">
        <div className="bg-white p-2 rounded-lg">
          <SolanaPayQRCode claimToken={token} size={displaySize} className="w-full" />
        </div>
      </div>
    </div>
  );
};

// Simple component to display just the POP image
const PopImage = ({
  pop,
  size = 100,
  className = '',
}: {
  pop: POP;
  size?: number;
  className?: string;
}) => {
  return (
    <div className={className}>
      {pop.imageUrl ? (
        <div
          className="relative rounded-xl overflow-hidden"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <Image src={pop.imageUrl} alt={pop.title} fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div
          className="bg-blue-50 flex items-center justify-center rounded-xl overflow-hidden"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <Trophy
            style={{
              width: `${Math.floor(size / 3)}px`,
              height: `${Math.floor(size / 3)}px`,
            }}
            className="text-blue-500"
          />
        </div>
      )}
    </div>
  );
};

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { isConnected, walletAddress: connectedWalletAddress } = useWalletContext();

  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewportHeight, setViewportHeight] = useState<string>('100vh');

  // Set correct viewport height to avoid scrolling issues on mobile
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(`${window.innerHeight}px`);
    };

    // Set height initially
    updateViewportHeight();

    // Update height on resize
    window.addEventListener('resize', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/claim/${token}/verify`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to verify claim token');
        }

        const data = await response.json();
        setClaimStatus(data);
      } catch (err) {
        console.error('Error verifying claim token:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setClaimStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  useEffect(() => {
    if (isConnected && connectedWalletAddress && !useManualAddress) {
      setWalletAddress(connectedWalletAddress);
    }
  }, [isConnected, connectedWalletAddress, useManualAddress]);

  // Auto-redirect to wallet page after 10 seconds when claimed
  useEffect(() => {
    if (claimStatus?.claimed) {
      const redirectTimer = setTimeout(() => {
        router.push('/wallet');
      }, 10000);

      return () => clearTimeout(redirectTimer);
    }
  }, [router, claimStatus?.claimed]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();

    const addressToUse =
      !useManualAddress && isConnected && connectedWalletAddress
        ? connectedWalletAddress
        : walletAddress;

    if (!addressToUse || !addressToUse.trim()) {
      toast.error('Please enter a valid Solana wallet address');
      return;
    }

    try {
      setIsClaiming(true);

      const response = await fetch(`/api/claim/${token}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: addressToUse }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to claim POP');
      }

      const data = await response.json();

      // Update claim status to reflect the claim
      setClaimStatus(prevStatus =>
        prevStatus ? { ...prevStatus, claimed: true, message: 'POP claimed successfully' } : null
      );

      toast.success('POP claimed successfully!');
    } catch (err) {
      console.error('Error claiming POP:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to claim POP');
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return <ClaimPageSkeleton viewportHeight={viewportHeight} />;
  }

  if (error || !claimStatus) {
    return (
      <div
        className="flex flex-col sm:items-center sm:justify-center"
        style={{ height: viewportHeight }}
      >
        <div className="flex-1 sm:flex-initial flex flex-col items-center justify-center p-6 sm:max-w-md sm:border sm:rounded-lg sm:shadow-sm sm:bg-white sm:p-8">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <CardTitle className="text-xl mb-2">Invalid Claim Link</CardTitle>
          <CardDescription className="text-center mb-4">
            This claim link is invalid or has been revoked.
          </CardDescription>
          <p className="text-center text-neutral-600 mb-8">
            {error || 'Unable to verify this claim link. It may have expired or been used already.'}
          </p>
          <Link href="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (claimStatus.claimed) {
    return (
      <div
        className="flex flex-col sm:items-center sm:justify-center"
        style={{ height: viewportHeight }}
      >
        <div className="flex-1 sm:flex-initial flex flex-col items-center justify-center p-6 sm:max-w-md sm:border sm:rounded-lg sm:shadow-sm sm:bg-white sm:p-8">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <CardTitle className="text-xl mb-2">POP Already Claimed</CardTitle>
          <CardDescription className="text-center mb-6">
            This POP has already been claimed.
          </CardDescription>

          {claimStatus.pop && (
            <div className="flex flex-col items-center space-y-6 mb-8">
              {/* Image at the top */}
              <PopImage pop={claimStatus.pop} size={160} className="mx-auto shadow-sm rounded-xl" />

              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">{claimStatus.pop.title}</h3>
                <p className="text-sm text-neutral-600 mb-4">{claimStatus.pop.description}</p>

                {/* QR code removed for claimed POPs */}
              </div>
            </div>
          )}

          {claimStatus.claimTxId && (
            <div className="w-full text-center mb-4">
              <a
                href={`https://explorer.solana.com/tx/${claimStatus.claimTxId}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View transaction on Solana Explorer
              </a>
            </div>
          )}

          <div className="w-full space-y-4">
            <Link href="/wallet" className="w-full block">
              <Button variant="outline" className="w-full">
                View in Wallet
              </Button>
            </Link>
            <p className="text-xs text-center text-neutral-500">
              Redirecting to wallet in 10 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (claimStatus.expired) {
    return (
      <div
        className="flex flex-col sm:items-center sm:justify-center"
        style={{ height: viewportHeight }}
      >
        <div className="flex-1 sm:flex-initial flex flex-col items-center justify-center p-6 sm:max-w-md sm:border sm:rounded-lg sm:shadow-sm sm:bg-white sm:p-8">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <CardTitle className="text-xl mb-2">Claim Link Expired</CardTitle>
          <CardDescription className="text-center mb-6">
            This claim link has expired and can no longer be used.
          </CardDescription>

          {claimStatus.pop && (
            <div className="flex flex-col items-center space-y-6 mb-8">
              {/* Image at the top */}
              <PopImage pop={claimStatus.pop} size={160} className="mx-auto shadow-sm rounded-xl" />

              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">{claimStatus.pop.title}</h3>
                <p className="text-sm text-neutral-600 mb-4">{claimStatus.pop.description}</p>

                {/* QR code below description - hidden on mobile */}
                <PopDisplay pop={claimStatus.pop} size={32} token={token} />
              </div>
            </div>
          )}

          <Link href="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Main claim flow
  return (
    <div
      className="flex flex-col sm:justify-center sm:items-center"
      style={{ height: viewportHeight }}
    >
      <div className="flex-1 overflow-y-auto w-full sm:flex-initial sm:max-w-md sm:border sm:rounded-lg sm:shadow-sm sm:bg-white sm:overflow-hidden">
        <div className="p-6 pb-32 sm:pb-6">
          <div className="text-center mb-6">
            <h1 className="hidden text-2xl font-bold">Claim Your POP</h1>
          </div>

          {claimStatus?.pop && (
            <div className="flex flex-col items-center">
              {/* Display the POP image at the top */}
              <div className="flex justify-center mb-6">
                <PopImage pop={claimStatus.pop} size={180} className="shadow-sm rounded-xl" />
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-xl mb-2">{claimStatus.pop.title}</h3>
                <p className="text-neutral-600">{claimStatus.pop.description}</p>

                {/* QR code now below the description */}
                <div className="mt-6 mb-6">
                  {claimStatus.pop && (
                    <PopDisplay pop={claimStatus.pop} size={220} token={token} className="mb-4" />
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="border-t mt-2 pt-6">
            <div className="space-y-6">
              {!isConnected ? (
                <div className="flex flex-col space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wallet" className="text-base">
                      Your Solana Wallet Address
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        id="wallet"
                        type="text"
                        placeholder="Enter your wallet address"
                        value={walletAddress}
                        onChange={e => setWalletAddress(e.target.value)}
                        className="font-mono text-sm flex-1"
                        required
                      />
                      <WalletConnectButton className="w-full sm:w-auto" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connect your wallet or enter an address manually
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center p-4 bg-neutral-50 rounded-md border border-neutral-200">
                    <div className="flex items-center gap-3 w-full">
                      <Wallet className="h-6 w-6 flex-shrink-0 text-neutral-500" />
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium">Connected Wallet</p>
                        <p className="text-sm font-mono text-neutral-500">
                          {formatWalletAddress(connectedWalletAddress)}
                          <span className="sr-only">{connectedWalletAddress}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {!useManualAddress ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setUseManualAddress(true)}
                    >
                      Use a different wallet address
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Label htmlFor="manual-wallet">Alternative Wallet Address</Label>
                      <Input
                        id="manual-wallet"
                        type="text"
                        placeholder="Enter a different wallet address"
                        value={walletAddress}
                        onChange={e => setWalletAddress(e.target.value)}
                        className="font-mono text-sm"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setUseManualAddress(false);
                          setWalletAddress(connectedWalletAddress || '');
                        }}
                      >
                        Use connected wallet
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-neutral-500">
                Make sure this is a valid Solana wallet address. The POP will be minted directly to
                this address.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom claim button - only fixed on mobile */}
      <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 sm:mt-4 sm:max-w-md sm:w-full bg-white border-t sm:border-t-0 border-neutral-200 z-10 shadow-md sm:shadow-none">
        <form onSubmit={handleClaim}>
          <Button
            type="submit"
            className="w-full py-6 sm:py-4 text-base font-medium"
            disabled={isClaiming}
          >
            {isClaiming ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Claiming...
              </>
            ) : (
              'Claim POP'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
