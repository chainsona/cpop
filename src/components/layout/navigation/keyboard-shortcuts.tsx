'use client';

import { getShortcutDisplayText } from '@/lib/utils/keyboard-shortcuts';

interface KeyboardShortcutsProps {
  os: string;
}

export function KeyboardShortcuts({ os }: KeyboardShortcutsProps) {
  return (
    <div className="hidden md:flex items-center gap-3 text-xs text-neutral-500">
      <span className="flex items-center gap-1">
        <kbd className="px-2 py-1 bg-neutral-100 rounded-md">
          {getShortcutDisplayText('c', os)}
        </kbd>
        Create
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-2 py-1 bg-neutral-100 rounded-md">
          {getShortcutDisplayText('e', os)}
        </kbd>
        Explorer
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-2 py-1 bg-neutral-100 rounded-md">
          {getShortcutDisplayText('p', os)}
        </kbd>
        POPs
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-2 py-1 bg-neutral-100 rounded-md">
          {getShortcutDisplayText('l', os)}
        </kbd>
        Wallet
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-2 py-1 bg-neutral-100 rounded-md">Esc</kbd>
        Close
      </span>
    </div>
  );
} 