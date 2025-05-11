'use client';

import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POAP } from '@/types/poap';
import { POAPCard } from './poap-card';

interface RecentPOAPsProps {
  recentPoaps: POAP[];
  onPoapClick: (poap: POAP) => void;
}

export function RecentPOAPs({ recentPoaps, onPoapClick }: RecentPOAPsProps) {
  if (recentPoaps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-medium">Recent POAPs</h3>
        </div>
        {recentPoaps.length > 3 && (
          <Button variant="ghost" size="sm" className="text-blue-600">
            View all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
      <div className="flex overflow-x-auto pb-2 space-x-3 hide-scrollbar">
        {recentPoaps.map(poap => (
          <POAPCard key={poap.id} poap={poap} onClick={onPoapClick} type="compact" />
        ))}
      </div>
    </div>
  );
} 