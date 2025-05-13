'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { StepIndicator } from './step-indicator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrength } from '@/components/ui/password-strength';
import { SecretWordDisplay } from './secret-word-display';
import { Coins, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { POPMintModal } from '@/components/pop/pop-mint-modal';
import { usePOPMintModal } from '@/hooks/use-pop-mint-modal';
import { pollForTokenMintStatus, mintTokensAndPoll } from '@/lib/mint-tokens-utils';
import { checkTokenMinted } from '@/lib/token-utils';

interface SecretWordFormProps {
  id: string;
  onSuccess?: () => void;
}

export function SecretWordForm({ id, onSuccess }: SecretWordFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [word, setWord] = React.useState('');
  const [maxClaims, setMaxClaims] = React.useState<number | undefined>(undefined);
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingPop, setIsLoadingPop] = React.useState(false);
  const [isMinting, setIsMinting] = React.useState(false);
  const [mintProgress, setMintProgress] = React.useState<string>('');
  const { modalState, openMintingModal, setMintSuccess, setMintError, onOpenChange } =
    usePOPMintModal();

  // Fetch POP details to get dates
  React.useEffect(() => {
    const fetchPopDetails = async () => {
      try {
        setIsLoadingPop(true);
        const response = await fetch(`/api/pops/${id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch POP details');
        }

        const data = await response.json();

        // Auto-populate dates from POP if available
        if (data.pop) {
          if (data.pop.startDate && !startDate) {
            setStartDate(new Date(data.pop.startDate));
          }

          if (data.pop.endDate && !endDate) {
            setEndDate(new Date(data.pop.endDate));
          }
        }
      } catch (error) {
        console.error('Error fetching POP details:', error);
      } finally {
        setIsLoadingPop(false);
      }
    };

    fetchPopDetails();
  }, [id]);

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
          type: 'SecretWord',
          word,
          maxClaims: maxClaims || null,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create secret word');
      }

      const data = await response.json();

      toast.success('Secret word created successfully');

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
          authenticate: () => Promise.resolve(true),
          isAuthenticated: true,
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
      console.error('Error creating secret word:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create secret word');
      setIsMinting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <StepIndicator steps={['Secret Word', 'Limits', 'Review']} currentStep={step} />
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Enter a Secret Word</h2>
          <p className="text-neutral-600">This word will be required to claim the POP.</p>

          <div className="max-w-md">
            <Label htmlFor="word">
              Secret word <span className="text-red-500">*</span>
            </Label>
            <PasswordInput
              id="word"
              placeholder="Enter a secret word or phrase"
              value={word}
              onChange={e => setWord(e.target.value)}
              className="text-lg"
              showPasswordByDefault={false}
              iconSize={18}
            />
            <PasswordStrength password={word} />
            <p className="text-sm text-neutral-500 mt-2">
              Make it memorable but not too easy to guess
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={() => setStep(2)} disabled={word.trim().length < 3 || isLoadingPop}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Set Claim Limits</h2>
          <p className="text-neutral-600">Optionally limit the number of claims or time period.</p>

          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="maxClaims">Maximum number of claims</Label>
              <Input
                id="maxClaims"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={maxClaims || ''}
                onChange={e => setMaxClaims(e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <p className="text-sm text-neutral-500 mt-2">Leave blank for unlimited claims</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <DatePicker date={startDate} onChange={setStartDate} />
                {isLoadingPop && (
                  <p className="text-xs text-neutral-500 mt-1">Loading POP dates...</p>
                )}
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <DatePicker date={endDate} onChange={setEndDate} />
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-neutral-500">
                  {startDate || endDate
                    ? "These dates are pre-filled from the POP's event dates"
                    : 'Leave dates blank to allow claims at any time'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={isSubmitting}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Review and Create</h2>

          <div className="bg-neutral-50 p-4 rounded-lg">
            <dl className="space-y-2">
              <div className="flex justify-between py-2">
                <dt className="font-medium">Secret word:</dt>
                <dd>
                  <SecretWordDisplay word={word} />
                </dd>
              </div>
              <div className="flex justify-between py-2 border-t border-neutral-200">
                <dt className="font-medium">Max claims:</dt>
                <dd>{maxClaims || 'Unlimited'}</dd>
              </div>
              <div className="flex justify-between py-2 border-t border-neutral-200">
                <dt className="font-medium">Available from:</dt>
                <dd>{startDate ? startDate.toLocaleDateString() : 'Anytime'}</dd>
              </div>
              <div className="flex justify-between py-2 border-t border-neutral-200">
                <dt className="font-medium">Available until:</dt>
                <dd>{endDate ? endDate.toLocaleDateString() : 'No end date'}</dd>
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
              {isSubmitting ? 'Creating...' : 'Create Secret Word'}
            </Button>
          </div>

          {/* Token minting status indicator */}
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

      <POPMintModal
        open={modalState.open}
        onOpenChange={onOpenChange}
        status={modalState.status}
        error={modalState.error}
        popId={id}
      />
    </div>
  );
}
