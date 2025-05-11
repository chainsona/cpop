'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Sparkles, ChevronRight } from 'lucide-react';
import { POAP } from '@/types/poap';
import { POAPCard } from './poap-card';

interface POAPResultsProps {
  poaps: POAP[];
  filteredPoaps: POAP[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  recentPoapsExist: boolean;
  onPoapClick: (poap: POAP) => void;
  onClose?: () => void;
}

export function POAPResults({
  poaps,
  filteredPoaps,
  searchQuery,
  isLoading,
  error,
  recentPoapsExist,
  onPoapClick,
  onClose,
}: POAPResultsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {searchQuery ? (
          <>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-neutral-500" />
              <h3 className="text-base font-medium">
                {isLoading ? 'Searching...' : `${filteredPoaps.length} results`}
              </h3>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-medium">
                {recentPoapsExist ? 'Explore More POAPs' : 'POAPs'}
              </h3>
            </div>
            {!isLoading && !error && poaps.length > 6 && (
              <Link
                href="/poaps"
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
          <p className="text-neutral-500 mt-2">Loading POAPs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      ) : filteredPoaps.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-neutral-500">No POAPs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPoaps.slice(0, 6).map(poap => (
            <POAPCard key={poap.id} poap={poap} onClick={onPoapClick} />
          ))}
        </div>
      )}

      {/* View all link - More prominent button on desktop */}
      {!searchQuery && !isLoading && !error && poaps.length > 6 && (
        <Link
          href="/poaps"
          className="hidden md:flex items-center justify-center gap-1 text-base text-blue-600 hover:text-blue-800 mt-4 bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors"
          onClick={onClose}
        >
          View all POAPs
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
} 