'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Sparkles, ChevronRight } from 'lucide-react';
import { POP } from '@/types/pop';
import { POPCard } from './pop-card';

interface POPResultsProps {
  pops: POP[];
  filteredPops: POP[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  recentPopsExist: boolean;
  onPopClick: (pop: POP) => void;
  onClose?: () => void;
}

export function POPResults({
  pops,
  filteredPops,
  searchQuery,
  isLoading,
  error,
  recentPopsExist,
  onPopClick,
  onClose,
}: POPResultsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {searchQuery ? (
          <>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-neutral-500" />
              <h3 className="text-base font-medium">
                {isLoading ? 'Searching...' : `${filteredPops.length} results`}
              </h3>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-medium">
                {recentPopsExist ? 'Explore More POPs' : 'POPs'}
              </h3>
            </div>
            {!isLoading && !error && pops.length > 6 && (
              <Link
                href="/pops"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                onClick={onClose}
              >
                View all
                <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            )}
          </>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-neutral-500 mt-2">Loading POPs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      ) : filteredPops.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-neutral-500">No POPs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPops.slice(0, 6).map(pop => (
            <POPCard key={pop.id} pop={pop} onClick={onPopClick} />
          ))}
        </div>
      )}

      {/* View all link - More prominent button on desktop */}
      {!searchQuery && !isLoading && !error && pops.length > 6 && (
        <Link
          href="/pops"
          className="hidden md:flex items-center justify-center gap-1 text-base text-blue-600 hover:text-blue-800 mt-4 bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors"
          onClick={onClose}
        >
          View all POPs
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
} 