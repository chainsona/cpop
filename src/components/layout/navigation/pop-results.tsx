'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Sparkles, ChevronRight, Globe } from 'lucide-react';
import { POP } from '@/types/pop';
import { POPCard } from './pop-card';
import { useAuth } from '@/hooks/use-auth';

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
  const { isAuthenticated } = useAuth();

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
          {!isAuthenticated ? (
            <div>
              <p className="text-neutral-500">No public POPs found</p>
              <p className="text-sm text-neutral-400 mt-2">
                <Link href="/auth" className="text-blue-500 hover:underline" onClick={onClose}>
                  Sign in
                </Link>{' '}
                to see your personal POPs
              </p>
            </div>
          ) : (
            <p className="text-neutral-500">No POPs found</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {filteredPops.slice(0, 6).map(pop => (
            <POPCard key={pop.id} pop={pop} onClick={onPopClick} />
          ))}
        </div>
      )}

      {/* Public POPs explainer */}
      {!isAuthenticated && !isLoading && !error && filteredPops.length > 0 && (
        <div className="mt-1 text-xs text-neutral-500 bg-neutral-50 p-2 rounded">
          Showing public POPs only.
          <Link href="/auth" className="text-blue-500 hover:underline ml-1" onClick={onClose}>
            Sign in
          </Link>{' '}
          to see all your POPs.
        </div>
      )}

      {/* View all link - More prominent button on desktop */}
      {!searchQuery && !isLoading && !error && pops.length > 6 && (
        <Link
          href="/pops"
          className="hidden sm:flex items-center justify-center gap-1 text-base text-blue-600 hover:text-blue-800 mt-4 bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors"
          onClick={onClose}
        >
          View all POPs
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
