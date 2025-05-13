import { Skeleton } from '@/components/ui/skeleton';

export function POPCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-neutral-200 shadow-sm p-4 md:p-5">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* POP Image skeleton */}
        <div className="w-full md:w-48 lg:w-64 h-40 md:h-48 rounded-lg overflow-hidden shrink-0">
          <Skeleton variant="image" className="w-full h-full" />
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
              <Skeleton variant="text" className="h-7 w-3/4 max-w-[300px]" />
            </div>

            <Skeleton variant="text" className="h-4 w-full mb-1" />
            <Skeleton variant="text" className="h-4 w-full mb-1" />
            <Skeleton variant="text" className="h-4 w-2/3 mb-4" />

            {/* Distribution method badges skeleton */}
            <div className="flex gap-2 flex-wrap mb-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            {/* POP Metadata skeleton */}
            <div className="flex flex-wrap gap-3 mt-auto mb-4">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
          </div>

          {/* POP Actions skeleton */}
          <div className="flex justify-end gap-2 mt-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function POPCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <POPCardSkeleton key={index} />
      ))}
    </div>
  );
} 