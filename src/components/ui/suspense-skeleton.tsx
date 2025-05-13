import React, { Suspense, ReactNode } from 'react';
import { 
  TableSkeleton, 
  CardSkeleton, 
  FormSkeleton, 
  ProfileSkeleton, 
  DashboardSkeleton 
} from './skeletons';
import { Skeleton } from './skeleton';

type SkeletonType = 'table' | 'card' | 'form' | 'profile' | 'dashboard' | 'default';

interface SuspenseSkeletonProps {
  children: ReactNode;
  type?: SkeletonType;
  fallback?: ReactNode;
  skeletonProps?: Record<string, any>;
}

export function SuspenseSkeleton({
  children,
  type = 'default',
  fallback,
  skeletonProps = {},
}: SuspenseSkeletonProps) {
  const getFallback = () => {
    if (fallback) return fallback;
    
    switch (type) {
      case 'table':
        return <TableSkeleton {...skeletonProps} />;
      case 'card':
        return <CardSkeleton {...skeletonProps} />;
      case 'form':
        return <FormSkeleton {...skeletonProps} />;
      case 'profile':
        return <ProfileSkeleton {...skeletonProps} />;
      case 'dashboard':
        return <DashboardSkeleton />;
      default:
        return <Skeleton className="w-full h-24" />;
    }
  };

  return (
    <Suspense fallback={getFallback()}>
      {children}
    </Suspense>
  );
}

// Usage example:
// <SuspenseSkeleton type="table">
//   <DataTable />
// </SuspenseSkeleton> 