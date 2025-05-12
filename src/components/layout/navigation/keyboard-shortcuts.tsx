'use client';

import { getShortcutDisplayText } from '@/lib/utils/keyboard-shortcuts';

interface KeyboardShortcutsProps {
  os: string;
}

export function KeyboardShortcuts({ os }: KeyboardShortcutsProps) {
  return (
    <div className="hidden sm:flex flex-wrap items-center gap-2 text-xs text-neutral-500">
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded-md">
          {getShortcutDisplayText('c', os)}
        </kbd>
        <span className="hidden md:inline">Create</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded-md">
          {getShortcutDisplayText('e', os)}
        </kbd>
        <span className="hidden md:inline">Explorer</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded-md">
          {getShortcutDisplayText('p', os)}
        </kbd>
        <span className="hidden md:inline">POPs</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded-md">
          {getShortcutDisplayText('l', os)}
        </kbd>
        <span className="hidden md:inline">Wallet</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded-md">Esc</kbd>
        <span className="hidden md:inline">Close</span>
      </span>
    </div>
  );
} 