import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  children: ReactNode;
  className?: string;
}

export function StatusBadge({ children, className }: StatusBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
        className
      )}
    >
      {children}
    </div>
  );
}
