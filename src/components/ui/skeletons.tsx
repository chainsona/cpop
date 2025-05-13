import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
};

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  className 
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full overflow-hidden", className)}>
      {showHeader && (
        <div className="flex items-center border-b pb-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={`header-${i}`} className="flex-1 pr-4">
              <Skeleton variant="text" className="w-3/4 h-5" />
            </div>
          ))}
          <div className="w-24">
            <Skeleton variant="text" className="w-full h-5" />
          </div>
        </div>
      )}

      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex items-center py-2">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1 pr-4">
                <Skeleton variant="text" className={`h-5 w-${Math.floor(Math.random() * 5) + 5}/12`} />
              </div>
            ))}
            <div className="w-24 flex space-x-2">
              <Skeleton className="w-10 h-8 rounded" />
              <Skeleton className="w-10 h-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-4 space-y-3", className)}>
      <Skeleton variant="text" className="h-6 w-1/3" />
      <Skeleton variant="text" className="h-4 w-full" count={3} />
      <div className="pt-2 flex justify-end space-x-2">
        <Skeleton className="w-20 h-9 rounded" />
      </div>
    </div>
  );
}

export function FormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`field-${index}`} className="space-y-2">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
      ))}
      <div className="pt-2 flex justify-end">
        <Skeleton className="w-24 h-10 rounded" />
      </div>
    </div>
  );
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-4", className)}>
      <Skeleton variant="circle" className="h-12 w-12" />
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-32" />
        <Skeleton variant="text" className="h-3 w-24" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton variant="text" className="h-8 w-48" />
        <Skeleton className="h-9 w-24 rounded" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      
      <TableSkeleton />
    </div>
  );
} 