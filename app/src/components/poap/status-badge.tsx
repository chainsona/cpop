import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Simple badge component for displaying status
 */
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
