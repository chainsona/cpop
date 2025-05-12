'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getOperatingSystem } from '@/lib/utils/os-detection';
import { getShortcutDisplayText } from '@/lib/utils/keyboard-shortcuts';
import { UserProfile } from './navigation/user-profile';
import { SearchBar } from './navigation/search-bar';
import { NavItems } from './navigation/nav-items';
import { KeyboardShortcuts } from './navigation/keyboard-shortcuts';
import { RecentPOAPs } from './navigation/recent-poaps';
import { POAPResults } from './navigation/poap-results';
import {
  mainNavigationItems,
  supportNavigationItems,
} from './navigation/navigation-data';
import { usePoapData } from '@/hooks/use-poap-data';
import { useAuth } from '@/hooks/use-auth';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

interface NavigationMenuProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

export function NavigationMenu({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  onOpen: externalOnOpen,
}: NavigationMenuProps = {}) {
  const router = useRouter();
  const [os, setOS] = useState<string>('unknown');

  // Use custom hooks
  const { isAuthenticated, user, handleLogout } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    poaps,
    recentPoaps,
    filteredPoaps,
    isLoading,
    error,
    currentPoapTitle,
    navigateToPOAP,
  } = usePoapData({ isOpen: externalIsOpen, onClose: externalOnClose });
  const { handleKeyDown } = useKeyboardShortcuts({
    os,
    isOpen: !!externalIsOpen,
    onClose: externalOnClose,
  });

  // Detect OS on client-side
  useEffect(() => {
    setOS(getOperatingSystem());
  }, []);

  const handleCreatePOAP = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use the state variable instead of directly accessing localStorage
    if (!isAuthenticated) {
      // Store the intended destination for redirect after auth
      try {
        localStorage.setItem('auth_redirect', '/poaps/create');
      } catch (err) {
        console.error('Error accessing localStorage:', err);
      }
      router.push('/auth');
      if (externalOnClose) externalOnClose();
      return;
    }

    // If authenticated, navigate to create page
    router.push('/poaps/create');
    if (externalOnClose) externalOnClose();
  };

  return (
    <Dialog open={!!externalIsOpen} onOpenChange={open => !open && externalOnClose?.()}>
      <DialogContent
        className="h-[100dvh] flex flex-col sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl sm:max-h-[90vh] overflow-hidden p-0"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="space-y-3 mb-4 p-6 pb-0">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold">
              {currentPoapTitle || 'Navigation'}
            </DialogTitle>

            {/* Keyboard shortcut legend */}
            <KeyboardShortcuts os={os} />
          </div>
        </DialogHeader>

        {/* Desktop-optimized layout */}
        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:gap-6 overflow-y-auto flex-1 p-6 pt-2">
          {/* Left sidebar - Navigation for desktop */}
          <div className="md:w-60 lg:w-72 space-y-4 order-2 md:order-1">
            {/* User profile card */}
            {isAuthenticated ? <UserProfile user={user} /> : null}

            {/* Create New POAP Button */}
            <div>
              <Button
                className="w-full gap-2 text-sm bg-blue-600 hover:bg-blue-700 py-5"
                onClick={handleCreatePOAP}
              >
                <PlusCircle className="h-4 w-4" />
                Create New POAP
                <span className="ml-auto text-xs opacity-70">
                  {getShortcutDisplayText('c', os)}
                </span>
              </Button>
            </div>

            {/* Main Navigation */}
            <div className="bg-neutral-50 rounded-lg border border-neutral-100 p-2">
              <NavItems
                items={mainNavigationItems}
                isAuthenticated={isAuthenticated}
                os={os}
                onClose={externalOnClose}
                showShortcuts={true}
              />
            </div>

            {/* More - Collapsible section */}
            <details className="group">
              <summary className="flex items-center justify-between p-2 rounded-md bg-neutral-50 border border-neutral-100 cursor-pointer">
                <span className="font-medium text-sm">More</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-neutral-500 group-open:rotate-90 transition-transform"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </summary>
              <div className="pt-2 pb-1 px-1 space-y-1 mt-1 bg-white srounded-md border border-neutral-100">
                {/* Support Navigation */}
                <NavItems
                  items={supportNavigationItems}
                  isAuthenticated={isAuthenticated}
                  os={os}
                  onClose={externalOnClose}
                />
              </div>
            </details>

            {/* Logout Button */}
            <div>
              <Button
                variant="outline"
                className="w-full gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => handleLogout(externalOnClose)}
              >
                <LogOut className="h-3.5 w-3.5" />
                Log Out
              </Button>
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 order-1 md:order-2">
            {/* Search bar */}
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            {/* Desktop-optimized content section */}
            <div className="space-y-6">
              {/* Recent POAPs section */}
              <RecentPOAPs recentPoaps={recentPoaps} onPoapClick={navigateToPOAP} />

              {/* Search Results / Featured POAPs section */}
              <POAPResults
                poaps={poaps}
                filteredPoaps={filteredPoaps}
                searchQuery={searchQuery}
                isLoading={isLoading}
                error={error}
                recentPoapsExist={recentPoaps.length > 0}
                onPoapClick={navigateToPOAP}
                onClose={externalOnClose}
              />
            </div>
          </div>
        </div>

        <style jsx global>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
