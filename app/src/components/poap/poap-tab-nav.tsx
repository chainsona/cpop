'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface POAPTabNavProps {
  poapId: string;
}

export function POAPTabNav({ poapId }: POAPTabNavProps) {
  const pathname = usePathname();

  const tabs = [
    { label: 'Overview', href: `/poaps/${poapId}`, exact: true },
    { label: 'Distribution', href: `/poaps/${poapId}/distribution` },
    { label: 'Token', href: `/poaps/${poapId}/token` },
    { label: 'Settings', href: `/poaps/${poapId}/settings` },
  ];

  // Determine if a tab is active based on current path
  const isActive = (tabHref: string, exact: boolean = false) => {
    if (exact) {
      return pathname === tabHref;
    }
    return pathname.startsWith(tabHref);
  };

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
      <nav className="flex border-b border-neutral-200 bg-neutral-50 overflow-x-auto">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              isActive(tab.href, tab.exact)
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-neutral-600 hover:text-neutral-900'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* Content area will be provided by each page */}
    </div>
  );
}
