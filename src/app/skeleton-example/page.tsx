import { Suspense } from 'react';
import { DataLoadingExample } from '@/components/data-loading-example';
import { Skeleton } from '@/components/ui/skeleton';
import { SuspenseSkeleton } from '@/components/ui/suspense-skeleton';
import { TableSkeleton, CardSkeleton, FormSkeleton, ProfileSkeleton } from '@/components/ui/skeletons';

export default function SkeletonExamplePage() {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-6">Skeleton Loading Examples</h1>
        <p className="text-muted-foreground mb-8">
          This page demonstrates various skeleton loading patterns for improved user experience.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Predefined Skeleton Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Table Skeleton</h3>
            <TableSkeleton rows={3} columns={3} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Card Skeleton</h3>
            <div className="grid grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Form Skeleton</h3>
            <FormSkeleton />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Profile Skeleton</h3>
            <div className="p-4 border rounded-lg">
              <ProfileSkeleton />
              <div className="mt-4">
                <Skeleton variant="text" count={3} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Custom Hook Example</h2>
        <div className="border rounded-lg p-6">
          <DataLoadingExample />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Suspense Integration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Table with Suspense</h3>
            <SuspenseSkeleton type="table">
              <DataComponentWithDelay />
            </SuspenseSkeleton>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Card with Suspense</h3>
            <SuspenseSkeleton type="card">
              <DataComponentWithDelay delay={1500} />
            </SuspenseSkeleton>
          </div>
        </div>
      </section>
    </div>
  );
}

// Mock component that simulates loading delay
function DataComponentWithDelay({ delay = 2000 }: { delay?: number }) {
  // This will only work on the client side in a real app
  // For demo purposes, we're simulating the delay
  if (typeof window !== 'undefined') {
    let startTime = Date.now();
    while (Date.now() - startTime < delay) {
      // Artificial delay
    }
  }

  return (
    <div className="border p-4 rounded-lg">
      <h3 className="font-medium">Data Loaded!</h3>
      <p>This content was loaded after a {delay}ms delay.</p>
    </div>
  );
} 