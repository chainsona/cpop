'use client';

import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, Users, Coins, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfigStatusCard } from './config-status-card';
import { cn } from '@/lib/utils';

interface ConfigStatus {
  title: string;
  status: 'complete' | 'incomplete' | 'partial' | 'error';
  summary: string;
  href: string;
  icon: React.ReactNode;
}

interface POAPConfigLayoutProps {
  poapId: string;
  distributionStatus: 'complete' | 'incomplete' | 'partial' | 'error';
  distributionSummary: string;
  tokenStatus: 'complete' | 'incomplete' | 'partial' | 'error';
  tokenSummary: string;
  settingsStatus: 'complete' | 'incomplete' | 'partial' | 'error';
  settingsSummary: string;
  className?: string;
}

export function POAPConfigLayout({
  poapId,
  distributionStatus,
  distributionSummary,
  tokenStatus,
  tokenSummary,
  settingsStatus,
  settingsSummary,
  className,
}: POAPConfigLayoutProps) {
  // Create a reference to the scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Function to scroll left
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  // Function to scroll right
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Define all config cards
  const configCards: ConfigStatus[] = [
    {
      title: 'Distribution',
      status: distributionStatus,
      summary: distributionSummary,
      href: `/poaps/${poapId}/distribution`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: 'Token',
      status: tokenStatus,
      summary: tokenSummary,
      href: `/poaps/${poapId}/token`,
      icon: <Coins className="h-4 w-4" />,
    },
    {
      title: 'Settings',
      status: settingsStatus,
      summary: settingsSummary,
      href: `/poaps/${poapId}/settings`,
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">POAP Configuration</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollLeft}
            className="hidden sm:flex h-8 w-8"
            aria-label="Scroll left"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollRight}
            className="hidden sm:flex h-8 w-8"
            aria-label="Scroll right"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent"
      >
        {configCards.map((card, index) => (
          <div
            key={card.title}
            className="snap-start min-w-[280px] sm:min-w-[200px] flex-shrink-0 flex-grow"
            style={{ flexBasis: 'calc(33.333% - 1rem)' }}
          >
            <ConfigStatusCard
              title={card.title}
              status={card.status}
              summary={card.summary}
              icon={card.icon}
              href={card.href}
              className="h-full"
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-center gap-1 sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={scrollLeft}
          className="h-8 w-8 p-0"
          aria-label="Scroll left"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={scrollRight}
          className="h-8 w-8 p-0"
          aria-label="Scroll right"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
