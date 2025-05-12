'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep - 1;
        const isCurrent = index === currentStep - 1;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center relative">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center z-10 border-2',
                  isCompleted
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : isCurrent
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-neutral-300 text-neutral-500'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-2 font-medium',
                  isCurrent
                    ? 'text-blue-600'
                    : isCompleted
                      ? 'text-neutral-900'
                      : 'text-neutral-500'
                )}
              >
                {step}
              </span>
            </div>

            {!isLast && (
              <div
                className={cn('h-0.5 flex-1 mx-2', isCompleted ? 'bg-blue-600' : 'bg-neutral-200')}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
