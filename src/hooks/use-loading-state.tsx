import { useState, ReactNode } from 'react';
import { 
  TableSkeleton, 
  CardSkeleton, 
  FormSkeleton, 
  ProfileSkeleton,
  DashboardSkeleton 
} from '@/components/ui/skeletons';

export type SkeletonType = 'table' | 'card' | 'form' | 'profile' | 'dashboard' | ReactNode;

interface UseLoadingStateProps {
  initialLoading?: boolean;
  skeletonType?: SkeletonType;
  skeletonProps?: Record<string, any>;
}

export function useLoadingState({
  initialLoading = false,
  skeletonType = 'table',
  skeletonProps = {},
}: UseLoadingStateProps = {}) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  
  // Helper function to wrap async operations
  const withLoading = async <T,>(promise: Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      const result = await promise;
      return result;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get appropriate skeleton component based on type
  const renderSkeleton = () => {
    if (typeof skeletonType === 'object' && skeletonType !== null) {
      return skeletonType;
    }
    
    switch (skeletonType) {
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
        return <TableSkeleton {...skeletonProps} />;
    }
  };
  
  // Higher-order component to handle loading state for components
  const WithLoading = ({ children }: { children: ReactNode }) => {
    return isLoading ? renderSkeleton() : <>{children}</>;
  };
  
  return {
    isLoading,
    setIsLoading,
    withLoading,
    renderSkeleton,
    WithLoading,
  };
} 