import { cn } from '@/lib/utils';
import React from 'react';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'circle' | 'text' | 'card' | 'image';
  width?: string | number;
  height?: string | number;
  count?: number;
};

function Skeleton({ 
  className, 
  variant = 'default',
  width,
  height,
  count = 1,
  ...props 
}: SkeletonProps) {
  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  const variantClasses = {
    default: 'rounded-md',
    circle: 'rounded-full',
    text: 'h-4 rounded',
    card: 'h-[200px] rounded-lg',
    image: 'rounded-md aspect-video',
  };

  const renderSkeleton = () => (
    <div 
      className={cn(
        'animate-pulse bg-neutral-100 dark:bg-neutral-800', 
        variantClasses[variant],
        className
      )} 
      style={style} 
      {...props} 
    />
  );

  if (count === 1) return renderSkeleton();

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className={cn(
            'animate-pulse bg-neutral-100 dark:bg-neutral-800', 
            variantClasses[variant],
            className
          )} 
          style={style}
          {...props} 
        />
      ))}
    </div>
  );
}

export { Skeleton };
