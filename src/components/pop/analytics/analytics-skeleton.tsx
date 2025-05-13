import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AnalyticsSkeletonProps {
  popId: string;
}

export function AnalyticsSkeleton({ popId }: AnalyticsSkeletonProps) {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/pops/${popId}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to POP
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          {/* Tab Navigation Skeleton */}
          <div className="flex gap-4 border-b">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded" />
            <Skeleton className="h-9 w-28 rounded" />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-9 w-16 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Bar Chart Skeleton */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
          <div className="flex items-center mb-4">
            <Skeleton className="h-5 w-5 mr-2 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>

          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-4 w-full max-w-md mt-4" />
        </div>

        {/* Claims by method container */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          {/* Pie Chart Skeleton */}
          <div className="md:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center mb-4">
              <Skeleton className="h-5 w-5 mr-2 rounded" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>

          {/* Claims by method table skeleton */}
          <div className="md:col-span-3 bg-white rounded-xl border border-neutral-200 p-6">
            <Skeleton className="h-6 w-40 mb-4" />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-4 py-2 text-left">
                      <Skeleton className="h-5 w-20" />
                    </th>
                    <th className="px-4 py-2 text-right">
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </th>
                    <th className="px-4 py-2 text-right">
                      <Skeleton className="h-5 w-20 ml-auto" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <tr key={index} className="border-b border-neutral-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Skeleton className="w-3 h-3 mr-2 rounded-full" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Skeleton className="h-5 w-12 ml-auto" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Skeleton className="h-5 w-8 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 