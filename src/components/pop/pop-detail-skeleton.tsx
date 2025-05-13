import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function POPDetailSkeleton() {
  return (
    <div className="px-4 sm:px-6 py-6 pb-16">
      {/* Back link */}
      <div className="max-w-6xl mx-auto mb-4">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/pops" className="text-neutral-600 hover:text-neutral-900">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to POPs
          </Link>
        </Button>
      </div>

      {/* Main content area */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Left column with POP image and info */}
          <div className="md:col-span-1">
            {/* POP title displayed on mobile only */}
            <Skeleton className="h-8 w-3/4 mb-4 md:hidden" />

            {/* Image skeleton */}
            <Skeleton 
              variant="image" 
              className="w-full aspect-square rounded-lg mb-6" 
            />

            {/* Basic POP information skeleton */}
            <div className="space-y-5 mb-8">
              {/* Status */}
              <div className="flex gap-2 items-center">
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-5 w-40" />
              </div>

              {/* Other metadata */}
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-44" />
              </div>
            </div>
          </div>

          {/* Right column with main content */}
          <div className="md:col-span-2">
            {/* POP title and actions - hidden on mobile, shown on desktop */}
            <div className="mb-6 hidden md:flex flex-wrap justify-between items-start gap-4">
              <Skeleton className="h-10 w-3/4" />

              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded" />
                <Skeleton className="h-9 w-20 rounded" />
              </div>
            </div>

            {/* Edit/Share buttons for mobile */}
            <div className="mb-4 flex md:hidden justify-end gap-2">
              <Skeleton className="h-9 w-16 rounded" />
              <Skeleton className="h-9 w-16 rounded" />
            </div>

            {/* Tabs skeleton */}
            <div className="mb-6">
              <div className="flex gap-4 border-b">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>

            {/* Tab content skeleton */}
            <div className="space-y-6">
              {/* Card skeleton */}
              <div className="border rounded-lg p-6 space-y-4">
                <Skeleton className="h-7 w-1/3 mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex justify-end pt-2">
                  <Skeleton className="h-9 w-28 rounded" />
                </div>
              </div>
              
              {/* Second card skeleton */}
              <div className="border rounded-lg p-6 space-y-4">
                <Skeleton className="h-7 w-1/4 mb-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-20 rounded" />
                  <Skeleton className="h-20 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 