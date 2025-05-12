'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  autoFocus?: boolean;
}

export function SearchBar({ searchQuery, setSearchQuery, autoFocus = true }: SearchBarProps) {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
      <Input
        placeholder="Search POPs..."
        className="pl-10 py-6 bg-neutral-50 text-base"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        autoFocus={autoFocus}
      />
    </div>
  );
} 