'use client';

import { ChevronRight } from 'lucide-react';
import { POP } from '@/types/pop';

interface POPCardProps {
  pop: POP;
  onClick: (pop: POP) => void;
  type?: 'compact' | 'full';
}

export function POPCard({ pop, onClick, type = 'full' }: POPCardProps) {
  const statusColors = {
    Published: 'bg-blue-100 text-blue-800',
    Distributed: 'bg-green-100 text-green-800',
    Draft: 'bg-neutral-100 text-neutral-800',
    Unclaimable: 'bg-amber-100 text-amber-800',
    Disabled: 'bg-red-100 text-red-800',
  };

  if (type === 'compact') {
    return (
      <button
        className="flex-shrink-0 w-full min-w-[220px] max-w-[280px] flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 hover:shadow-sm transition-all text-left border border-neutral-100 group"
        onClick={() => onClick(pop)}
      >
        <div className="h-16 w-16 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow transition-shadow">
          <img
            src={pop.imageUrl}
            alt={pop.title}
            className="h-full w-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=POP';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-lg truncate group-hover:text-blue-600 transition-colors">
            {pop.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[pop.status]}`}>
              {pop.status}
            </span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <button
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 hover:shadow-sm transition-all w-full text-left border border-neutral-100 group h-full"
      onClick={() => onClick(pop)}
    >
      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow group-hover:ring-1 group-hover:ring-blue-200 transition-all">
        <img
          src={pop.imageUrl}
          alt={pop.title}
          className="h-full w-full object-cover"
          onError={e => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=POP';
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-base sm:text-lg truncate group-hover:text-blue-600 transition-colors">
          {pop.title}
        </div>
        <div className="flex items-center gap-2 mt-1 sm:mt-2">
          <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${statusColors[pop.status]}`}>
            {pop.status}
          </span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
