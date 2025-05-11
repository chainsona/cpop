'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { StepIndicator } from './step-indicator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Coins, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { POAPMintModal } from '@/components/poap/poap-mint-modal';
import { usePOAPMintModal } from '@/hooks/use-poap-mint-modal';
import { pollForTokenMintStatus } from '@/lib/mint-tokens-utils';

interface ClaimLinksFormProps {
  id: string;
  onSuccess?: () => void;
}

export function ClaimLinksForm({ id, onSuccess }: ClaimLinksFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [amount, setAmount] = React.useState(0);
  const [expiryDate, setExpiryDate] = React.useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingPoap, setIsLoadingPoap] = React.useState(false);
  const [isMinting, setIsMinting] = React.useState(false);
  const [mintProgress, setMintProgress] = React.useState<string>('');
  const [poapTitle, setPoapTitle] = React.useState<string>('');
  const { modalState, openMintingModal, setMintSuccess, setMintError, onOpenChange } =
    usePOAPMintModal();

  // Fetch POAP details to get end date
  React.useEffect(() => {
    const fetchPoapDetails = async () => {
      try {
        setIsLoadingPoap(true);
        const response = await fetch(`/api/poaps/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch POAP details');
        }

        const data = await response.json();

        // Auto-populate expiry date from POAP end date if available
        if (data.poap && data.poap.endDate && !expiryDate) {
          setExpiryDate(new Date(data.poap.endDate));
        }

        // Save the POAP title for the mint modal
        if (data.poap && data.poap.title) {
          setPoapTitle(data.poap.title);
        }
      } catch (error) {
        console.error('Error fetching POAP details:', error);
      } finally {
        setIsLoadingPoap(false);
      }
    };

    fetchPoapDetails();
  }, [id, expiryDate]);

  // Function to check if token was minted
  const checkTokenMinted = async (): Promise<{ minted: boolean; mintAddress?: string }> => {
    try {
      const response = await fetch(`/api/poaps/${id}`);
      if (!response.ok) {
        throw new Error('Failed to check token status');
      }

      const data = await response.json();
      return {
        minted: !!data.poap.token,
        mintAddress: data.poap.token?.mintAddress,
      };
    } catch (error) {
      console.error('Error checking token status:', error);
      return { minted: false };
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/poaps/${id}/distribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'ClaimLinks',
          amount,
          expiryDate: expiryDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create claim links');
      }

      const data = await response.json();

      toast.success('Claim links created successfully');

      // Always check if this is the first distribution method
      const isFirstDistributionMethod =
        data.isFirstDistributionMethod || data.tokenMint?.shouldShowMintModal;

      // If this is the first distribution method or we should specifically show the mint modal
      if (isFirstDistributionMethod) {
        // Show minting modal immediately for first distribution method
        setIsMinting(true);
        openMintingModal();

        // Check if token is already minted from server-side
        if (data.tokenMint?.success) {
          // Delay to show the minting animation for at least a second
          setTimeout(() => {
            setMintSuccess();
            setIsMinting(false);

            // Show success toast with link to token tab
            toast.success(
              <div className="flex flex-col gap-2">
                <div>POAP tokens minted successfully!</div>
                <Link
                  href={`/poaps/${id}/token`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium underline"
                >
                  <Coins className="h-4 w-4" />
                  View token details
                </Link>
              </div>
            );

            // Only refresh the page after mint is confirmed
            router.refresh();

            // Call the onSuccess callback if provided
            if (onSuccess) {
              onSuccess();
            }
          }, 1500);
        } else {
          // Need to mint token or check status
          pollForTokenMintStatus({
            poapId: id,
            maxAttempts: 15, // Increased attempts
            intervalMs: 2000, // More frequent checks
            onProgress: message => {
              setMintProgress(message);
            },
            onMinted: () => {
              setIsMinting(false);
              setMintSuccess();

              // Show success toast with link to token tab
              toast.success(
                <div className="flex flex-col gap-2">
                  <div>POAP tokens minted successfully!</div>
                  <Link
                    href={`/poaps/${id}/token`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium underline"
                  >
                    <Coins className="h-4 w-4" />
                    View token details
                  </Link>
                </div>
              );

              // Only refresh the page after mint is confirmed
              router.refresh();

              // Call the onSuccess callback if provided
              if (onSuccess) {
                onSuccess();
              }
            },
            onTimeout: async () => {
              // If timeout, attempt a direct mint
              try {
                setMintProgress('Timeout waiting for token minting. Attempting direct mint...');
                const mintResponse = await fetch(`/api/poaps/${id}/mint`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                });

                if (mintResponse.ok) {
                  const mintData = await mintResponse.json();
                  if (mintData.success) {
                    setMintSuccess();
                    toast.success('POAP tokens minted successfully!');

                    // Refresh page after direct mint succeeds
                    router.refresh();

                    // Call the onSuccess callback if provided
                    if (onSuccess) {
                      onSuccess();
                    }
                  } else {
                    setMintError('Failed to mint tokens: ' + (mintData.error || 'Unknown error'));

                    // Still refresh the page if the distribution was created but minting failed
                    router.refresh();

                    if (onSuccess) {
                      onSuccess();
                    }
                  }
                } else {
                  setMintError('Failed to mint tokens: Server error');

                  // Still refresh the page if the distribution was created but minting failed
                  router.refresh();

                  if (onSuccess) {
                    onSuccess();
                  }
                }
              } catch (error) {
                console.error('Error in direct mint attempt:', error);
                setMintError(
                  'Failed to mint tokens: ' +
                    (error instanceof Error ? error.message : 'Unknown error')
                );

                // Still refresh the page if the distribution was created but minting failed
                router.refresh();

                if (onSuccess) {
                  onSuccess();
                }
              } finally {
                setIsMinting(false);
              }
            },
          });
        }
      } else {
        // Regular case for non-first distribution methods
        // Check for token minting status (for non-first methods)
        setIsMinting(true);
        setMintProgress('Checking if tokens need to be minted...');

        // Get initial token status
        const initialStatus = await checkTokenMinted();

        if (!initialStatus.minted) {
          // If no token exists, show minting in progress indicator
          setMintProgress('Minting POAP tokens...');

          // Poll for token creation (every 3 seconds for up to 30 seconds)
          let attempts = 0;
          const maxAttempts = 10;
          const interval = setInterval(async () => {
            attempts++;
            const status = await checkTokenMinted();

            if (status.minted) {
              clearInterval(interval);
              setIsMinting(false);

              // Show success toast with link to token tab
              toast.success(
                <div className="flex flex-col gap-2">
                  <div>POAP tokens minted successfully!</div>
                  <Link
                    href={`/poaps/${id}/token`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium underline"
                  >
                    <Coins className="h-4 w-4" />
                    View token details
                  </Link>
                </div>
              );

              // Refresh the page after token is minted
              router.refresh();

              // Call the onSuccess callback if provided
              if (onSuccess) {
                onSuccess();
              }
            } else if (attempts >= maxAttempts) {
              clearInterval(interval);
              setIsMinting(false);
              console.log('Timeout waiting for token minting');

              // Refresh the page even if minting timed out
              router.refresh();

              if (onSuccess) {
                onSuccess();
              }
            }
          }, 3000);
        } else {
          setIsMinting(false);

          // Refresh immediately if token was already minted
          router.refresh();

          if (onSuccess) {
            onSuccess();
          }
        }
      }
    } catch (error) {
      console.error('Error creating claim links:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create claim links');
      setIsMinting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <StepIndicator steps={['Amount', 'Expiry', 'Review']} currentStep={step} />
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">How many claim links do you need?</h2>
          <p className="text-neutral-600">Each link is unique and can only be used once.</p>

          <div className="max-w-xs">
            <Label htmlFor="amount">
              Number of links <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={amount || ''}
              onChange={e => setAmount(parseInt(e.target.value) || 0)}
              className="text-lg"
            />
          </div>

          <div className="pt-4">
            <Button onClick={() => setStep(2)} disabled={amount <= 0 || isLoadingPoap}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">When should these links expire?</h2>

          <div className="max-w-xs">
            <Label>Expiry Date</Label>
            <DatePicker date={expiryDate} onChange={setExpiryDate} />
            {isLoadingPoap && (
              <p className="text-xs text-neutral-500 mt-1">Loading POAP end date...</p>
            )}
            <p className="text-sm text-neutral-500 mt-2">
              {expiryDate
                ? "This date is pre-filled from the POAP's end date"
                : 'Leave blank for no expiration'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isSubmitting || isMinting}
            >
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={isSubmitting || isMinting}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Review and Generate</h2>

          <div className="bg-neutral-50 p-4 rounded-lg">
            <dl className="space-y-2">
              <div className="flex justify-between py-2">
                <dt className="font-medium">Number of links:</dt>
                <dd>{amount}</dd>
              </div>
              <div className="flex justify-between py-2 border-t border-neutral-200">
                <dt className="font-medium">Expiry date:</dt>
                <dd>{expiryDate ? expiryDate.toLocaleDateString() : 'No expiry'}</dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              disabled={isSubmitting || isMinting}
            >
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || isMinting}>
              {isSubmitting ? 'Generating...' : 'Generate Claim Links'}
            </Button>
          </div>

          {/* Token minting status indicator (only shown for non-modal minting) */}
          {isMinting && (
            <div className="mt-6 bg-blue-50 p-4 rounded-lg flex items-center gap-3 border border-blue-100 animate-pulse">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-blue-700 font-medium">{mintProgress}</p>
                <p className="text-blue-600 text-sm">This may take a few moments...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add POAP Mint Modal */}
      <POAPMintModal
        open={modalState.open}
        onOpenChange={onOpenChange}
        status={modalState.status}
        error={modalState.error}
        poapId={id}
        poapTitle={poapTitle}
      />
    </div>
  );
}
