'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

interface ActionButtonProps extends React.ComponentProps<typeof Button> {
  href?: string;
  label: string;
  icon?: ReactNode;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  children?: ReactNode;
  className?: string;
  backLink?: string;
  backLabel?: string;
  actions?: ActionButtonProps[];
}

/**
 * PageHeader component provides a consistent header for pages
 * with title, subtitle, back button, and action buttons.
 */
export function PageHeader({
  title,
  subtitle,
  children,
  className,
  backLink,
  backLabel = 'Back',
  actions,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {backLink && (
        <div>
          <Link href={backLink}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-neutral-600 hover:text-neutral-900 -ml-2 mb-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {backLabel}
            </Button>
          </Link>
        </div>
      )}

      <PageTitle
        title={title}
        subtitle={subtitle}
        actions={
          actions && actions.length > 0 ? (
            <>
              {actions.map((action, index) =>
                action.href ? (
                  <Link key={index} href={action.href}>
                    <Button {...action}>
                      {action.icon}
                      {action.label}
                    </Button>
                  </Link>
                ) : (
                  <Button key={index} {...action}>
                    {action.icon}
                    {action.label}
                  </Button>
                )
              )}
            </>
          ) : undefined
        }
      >
        {children}
      </PageTitle>
    </div>
  );
}
