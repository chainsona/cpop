'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getShortcutDisplayText } from '@/lib/utils/keyboard-shortcuts';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  protected?: boolean;
  badge?: string;
}

interface NavItemsProps {
  items: NavItem[];
  isAuthenticated: boolean;
  os: string;
  onClose?: () => void;
  showShortcuts?: boolean;
}

export function NavItems({
  items,
  isAuthenticated,
  os,
  onClose,
  showShortcuts = false,
}: NavItemsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleItemClick = (e: React.MouseEvent, item: NavItem) => {
    // For protected routes, redirect to auth if not authenticated
    if (item.protected && !isAuthenticated) {
      e.preventDefault();
      // Store the intended destination for redirect after auth
      try {
        localStorage.setItem('auth_redirect', item.href);
      } catch (err) {
        console.error('Error accessing localStorage:', err);
      }
      router.push('/auth');
      if (onClose) onClose();
      return;
    }

    // Otherwise normal navigation
    if (onClose) onClose();
  };

  return (
    <div className="space-y-1">
      {items.map(item => {
        const isActive = pathname === item.href;

        // Generate keyboard shortcut hint if needed
        let shortcutHint = '';
        if (showShortcuts) {
          if (item.href === '/') shortcutHint = getShortcutDisplayText('h', os);
          if (item.href === '/explorer') shortcutHint = getShortcutDisplayText('e', os);
          if (item.href === '/pops') shortcutHint = getShortcutDisplayText('p', os);
          if (item.href === '/wallet') shortcutHint = getShortcutDisplayText('l', os);
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center justify-between gap-2 p-2 rounded-md transition-colors text-sm',
              isActive ? 'bg-blue-100 text-blue-800' : 'hover:bg-neutral-100'
            )}
            onClick={e => handleItemClick(e, item)}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'p-1 rounded-md',
                  isActive ? 'bg-blue-200' : 'bg-neutral-100',
                  item.color
                )}
              >
                {item.icon}
              </div>
              <span className="font-medium">{item.name}</span>
            </div>

            <div className="flex items-center">
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center mr-2">
                  {item.badge}
                </span>
              )}

              {shortcutHint && <span className="text-xs text-neutral-400">{shortcutHint}</span>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
