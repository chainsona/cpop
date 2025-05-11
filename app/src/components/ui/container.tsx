import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'default' | 'small' | 'large';
}

export function Container({ children, size = 'default', className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'container mx-auto px-4 sm:px-6 md:px-8',
        {
          'max-w-5xl': size === 'default',
          'max-w-3xl': size === 'small',
          'max-w-7xl': size === 'large',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
