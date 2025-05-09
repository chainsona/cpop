'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { StepIndicator } from './step-indicator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/poaps/${id}/distribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Refresh the current page instead of redirecting
      router.refresh();

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating claim links:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create claim links');
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
            <Label htmlFor="amount">Number of links</Label>
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
            <Button onClick={() => setStep(2)} disabled={amount <= 0}>
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
            <p className="text-sm text-neutral-500 mt-2">Leave blank for no expiration</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Continue</Button>
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
            <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Generating...' : 'Generate Claim Links'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
