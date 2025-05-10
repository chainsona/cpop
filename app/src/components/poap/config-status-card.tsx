'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

interface ConfigStatusCardProps {
  title: string;
  status: 'complete' | 'incomplete' | 'partial' | 'error';
  icon: React.ReactNode;
  href: string;
  summary: string;
  className?: string;
}

export function ConfigStatusCard({ title, status, icon, href, summary, className }: ConfigStatusCardProps) {
  return (
    <Link href={href} className={cn("block", className)}>
      <div
        className={cn(
          'border rounded-lg p-4 transition-all hover:shadow-sm h-full flex flex-col',
          status === 'complete'
            ? 'border-green-200 bg-green-50'
            : status === 'partial'
              ? 'border-amber-200 bg-amber-50'
              : status === 'error'
                ? 'border-red-200 bg-red-50'
                : 'border-neutral-200 bg-neutral-50'
        )}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-2 rounded-full',
                status === 'complete'
                  ? 'bg-green-100 text-green-600'
                  : status === 'partial'
                    ? 'bg-amber-100 text-amber-600'
                    : status === 'error'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-neutral-100 text-neutral-600'
              )}
            >
              {icon}
            </div>
            <h3 className="font-medium">{title}</h3>
          </div>
          <div>
            {status === 'complete' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : status === 'partial' ? (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            ) : status === 'error' ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-neutral-400" />
            )}
          </div>
        </div>
        <p className="mt-2 text-sm text-neutral-600">{summary}</p>
        <div className="flex items-center gap-1 mt-auto pt-2 text-sm font-medium text-blue-600">
          <span>{status === 'complete' ? 'View' : 'Configure'}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
