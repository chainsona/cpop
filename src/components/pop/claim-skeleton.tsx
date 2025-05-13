import { Skeleton } from '@/components/ui/skeleton';

export function ClaimPageSkeleton({ viewportHeight = '100vh' }: { viewportHeight?: string }) {
  return (
    <div className="flex items-center justify-center" style={{ height: viewportHeight }}>
      <div className="w-full sm:max-w-md sm:border sm:rounded-lg sm:shadow-sm sm:bg-white sm:p-8 flex flex-col items-center justify-center p-6">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        
        <div className="flex flex-col items-center space-y-6 w-full mb-8">
          {/* POP Image skeleton */}
          <Skeleton className="w-40 h-40 rounded-xl" />
          
          <div className="text-center w-full space-y-2">
            <Skeleton className="h-6 w-40 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
            <Skeleton className="h-3 w-32 mx-auto mt-2" />
          </div>
        </div>

        <div className="space-y-6 w-full">
          {/* Wallet connect button skeleton */}
          <Skeleton className="h-10 w-full rounded-md" />
          
          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <Skeleton className="relative w-40 h-4 bg-white px-2" />
          </div>
          
          {/* Wallet address input skeleton */}
          <div className="space-y-2 w-full">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          
          {/* Helper text skeleton */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        
        {/* Button skeleton */}
        <Skeleton className="h-12 w-full rounded-md mt-8" />
      </div>
    </div>
  );
} 