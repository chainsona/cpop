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
import { POPMintModal } from '@/components/pop/pop-mint-modal';
import { usePOPMintModal } from '@/hooks/use-pop-mint-modal';
import { mintTokensAndPoll } from '@/lib/mint-tokens-utils';
import { checkTokenMinted } from '@/lib/token-utils';
import { useWalletContext } from '@/contexts/wallet-context';

interface ClaimLinksFormProps {
  id: string;
  onSuccess?: () => void;
}

export function ClaimLinksForm({ id, onSuccess }: ClaimLinksFormProps) {
  const router = useRouter();
  const { isAuthenticated, authenticate } = useWalletContext();
  const [step, setStep] = React.useState(1);
  const [amount, setAmount] = React.useState(0);
  const [expiryDate, setExpiryDate] = React.useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingPop, setIsLoadingPop] = React.useState(false);
  const [isMinting, setIsMinting] = React.useState(false);
  const [mintProgress, setMintProgress] = React.useState<string>('');
  const [popTitle, setPopTitle] = React.useState<string>('');
  const { modalState, openMintingModal, setMintSuccess, setMintError, onOpenChange } =
    usePOPMintModal();

  // Fetch POP details to get end date
  React.useEffect(() => {
    const fetchPopDetails = async () => {
      try {
        setIsLoadingPop(true);
        const response = await fetch(`/api/pops/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch POP details');
        }

        const data = await response.json();

        // Auto-populate expiry date from POP end date if available
        if (data.pop && data.pop.endDate && !expiryDate) {
          setExpiryDate(new Date(data.pop.endDate));
        }

        // Save the POP title for the mint modal
        if (data.pop && data.pop.title) {
          setPopTitle(data.pop.title);
        }
      } catch (error) {
        console.error('Error fetching POP details:', error);
      } finally {
        setIsLoadingPop(false);
      }
    };

    fetchPopDetails();
  }, [id, expiryDate]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/pops/${id}/distribution`, {
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

        // Use the new unified function to handle token minting flow
        await mintTokensAndPoll({
          popId: id,
          authenticate,
          isAuthenticated,
          onStart: () => {
            // Modal is already open, we just need to ensure the loading state is set
            setIsMinting(true);
          },
          onProgress: (message) => {
            setMintProgress(message);
          },
          onMinted: ({ mintAddress }) => {
            setIsMinting(false);
            setMintSuccess();
            
            // Show success toast with link to token tab
            toast.success(
              <div className="flex flex-col gap-2">
                <div>POP tokens minted successfully!</div>
                <Link
                  href={`/pops/${id}/token`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium underline"
                >
                  <Coins className="h-4 w-4" />
                  View token details
                </Link>
              </div>
            );
            
            // Refresh the page after tokens are minted
            router.refresh();
            
            // Call the onSuccess callback if provided
            if (onSuccess) {
              onSuccess();
            }
          },
          onError: (error) => {
            setIsMinting(false);
            setMintError(error);
            
            // Still refresh the page if the distribution was created but minting failed
            router.refresh();
            
            if (onSuccess) {
              onSuccess();
            }
          }
        });
      } else {
        // Regular case for non-first distribution methods
        // Check token status and refresh page
        setIsMinting(true);
        setMintProgress('Checking token status...');
        
        const tokenStatus = await checkTokenMinted(id);
        setIsMinting(false);
        
        // Refresh page regardless of token status
        router.refresh();
        if (onSuccess) {
          onSuccess();
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
            <Button onClick={() => setStep(2)} disabled={amount <= 0 || isLoadingPop}>
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
            {isLoadingPop && (
              <p className="text-xs text-neutral-500 mt-1">Loading POP end date...</p>
            )}
            <p className="text-sm text-neutral-500 mt-2">
              {expiryDate
                ? "This date is pre-filled from the POP's end date"
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

      {/* Add POP Mint Modal */}
      <POPMintModal
        open={modalState.open}
        onOpenChange={onOpenChange}
        status={modalState.status}
        error={modalState.error}
        popId={id}
        popTitle={popTitle}
      />
    </div>
  );
}
