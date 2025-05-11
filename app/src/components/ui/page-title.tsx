'use client';

import { ReactNode, useEffect } from 'react';
import { usePageTitle } from '@/contexts/page-title-context';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  title: string;
  subtitle?: string | ReactNode;
  children?: ReactNode;
  className?: string;
  actions?: ReactNode;
}

/**
 * PageTitle component provides consistent title and subtitle styling
 * across pages while also setting the document title.
 */
export function PageTitle({ title, subtitle, children, className, actions }: PageTitleProps) {
  const { setPageTitle } = usePageTitle();

  // Set document title
  useEffect(() => {
    setPageTitle(title);

    return () => {
      setPageTitle('');
    };
  }, [title, setPageTitle]);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <div className="mt-2 text-neutral-600 text-lg">{subtitle}</div>}
        {children}
      </div>
      {actions && <div className="mt-4 sm:mt-0 flex gap-2 sm:ml-4 w-full sm:w-auto">{actions}</div>}
    </div>
  );
}
