'use client';

import { Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  message?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonUrl?: string;
  buttonAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  message = "You haven't created any POPs yet",
  showButton = true,
  buttonText = "Create your first POP",
  buttonUrl = "/pops/create",
  buttonAction,
  icon = <Award className="h-8 w-8 text-neutral-400" />
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-neutral-50 rounded-lg border border-neutral-200">
      <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-2">No POPs found</h3>
      <p className="text-neutral-500 mb-6 max-w-md">
        {message}
      </p>
      
      {showButton && (
        buttonAction ? (
          <Button onClick={buttonAction}>{buttonText}</Button>
        ) : (
          <Link href={buttonUrl}>
            <Button>{buttonText}</Button>
      </Link>
        )
      )}
    </div>
  );
}
