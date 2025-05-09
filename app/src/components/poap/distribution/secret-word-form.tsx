'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { StepIndicator } from './step-indicator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/poaps/${id}/distribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'SecretWord',
          word,
          maxClaims,
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
      router.refresh();

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating secret word:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create secret word');
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
          <p className="text-neutral-600">This word will be required to claim the POAP.</p>

          <div className="max-w-md">
            <Label htmlFor="word">Secret word</Label>
            <Input
              id="word"
              type="text"
              placeholder="Enter a secret word or phrase"
              value={word}
              onChange={e => setWord(e.target.value)}
              className="text-lg"
            />
            <p className="text-sm text-neutral-500 mt-2">
              Make it memorable but not too easy to guess
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={() => setStep(2)} disabled={word.trim().length < 3}>
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
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <DatePicker date={endDate} onChange={setEndDate} />
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-neutral-500">
                  Leave dates blank to allow claims at any time
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
                <dd>{word}</dd>
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
            <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Secret Word'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
