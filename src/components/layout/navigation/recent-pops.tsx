'use client';

import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POP } from '@/types/pop';
import { POPCard } from './pop-card';

interface RecentPOPsProps {
  recentPops: POP[];
  onPopClick: (pop: POP) => void;
}

export function RecentPOPs({ recentPops, onPopClick }: RecentPOPsProps) {
  if (recentPops.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-medium">Recent POPs</h3>
        </div>
        {recentPops.length > 3 && (
          <Button variant="ghost" size="sm" className="text-blue-600">
            View all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
      <div className="flex overflow-x-auto pb-2 gap-3 -mx-2 px-2 snap-x hide-scrollbar">
        {recentPops.map(pop => (
          <div key={pop.id} className="snap-start flex-shrink-0">
            <POPCard pop={pop} onClick={onPopClick} type="compact" />
          </div>
        ))}
      </div>
    </div>
  );
} 