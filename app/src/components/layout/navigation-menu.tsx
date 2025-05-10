'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Home,
  Award,
  BarChart4,
  Settings,
  Search,
  PlusCircle,
  ChevronRight,
  Clock,
  Sparkles,
  User,
  Wallet,
  Bell,
  LogOut,
  FileText,
  Heart,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// OS detection utility
export function getOperatingSystem() {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;

  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K', 'darwin'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];

  if (macosPlatforms.indexOf(platform) !== -1) {
    return 'macos';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'windows';
  } else if (/Linux/.test(platform)) {
    return 'linux';
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    return 'ios';
  } else if (/Android/.test(userAgent)) {
    return 'android';
  }

  return 'unknown';
}

// Types for our POAP data
interface POAP {
  id: string;
  title: string;
  imageUrl: string;
  status: 'Draft' | 'Published' | 'Distributed';
}

// User storage key
const USER_STORAGE_KEY = 'userProfile';

// Default user as fallback
const DEFAULT_USER = {
  name: 'Guest User',
  email: 'guest@example.com',
  walletAddress: '0x000...000',
  avatarUrl: '',
};

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
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [poaps, setPoaps] = useState<POAP[]>([]);
  const [recentPoaps, setRecentPoaps] = useState<POAP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(DEFAULT_USER);
  const [currentPoapTitle, setCurrentPoapTitle] = useState<string | null>(null);
  const [os, setOS] = useState<string>('unknown');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Detect OS on client-side
  useEffect(() => {
    setOS(getOperatingSystem());

    // Check authentication status on client-side only
    try {
      const authToken = localStorage.getItem('solana_auth_token');
      setIsAuthenticated(!!authToken);
    } catch (err) {
      console.error('Error accessing localStorage:', err);
      setIsAuthenticated(false);
    }
  }, []);

  // Get modifier key based on OS
  const getModifierKey = () => {
    if (os === 'macos' || os === 'ios') {
      return '⌘';
    } else {
      return 'Alt';
    }
  };

  // Get keyboard shortcut display text
  const getShortcutDisplayText = (key: string) => {
    return `${getModifierKey()}+${key.toUpperCase()}`;
  };

  // Load user data from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // If no user exists in storage, set the default user
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
      }
    } catch (err) {
      console.error('Error loading user data from localStorage:', err);
    }
  }, []);

  // Fetch POAPs from the API
  useEffect(() => {
    const fetchPoaps = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/poaps');

        if (!response.ok) {
          throw new Error('Failed to fetch POAPs');
        }

        const data = await response.json();
        setPoaps(data.poaps || []);
      } catch (err) {
        console.error('Error fetching POAPs:', err);
        setError('Failed to load POAPs');
      } finally {
        setIsLoading(false);
      }
    };

    if (externalIsOpen) {
      fetchPoaps();
      loadRecentPoapsFromStorage();
    }
  }, [externalIsOpen]);

  // Load recent POAPs from localStorage
  const loadRecentPoapsFromStorage = () => {
    try {
      const storedRecentPoaps = localStorage.getItem('recentPoaps');
      if (storedRecentPoaps) {
        setRecentPoaps(JSON.parse(storedRecentPoaps));
      }
    } catch (err) {
      console.error('Error loading recent POAPs from localStorage:', err);
      // If there's an error, initialize with empty array
      setRecentPoaps([]);
    }
  };

  // Save to recent POAPs when navigating to a POAP
  const navigateToPOAP = (poap: POAP) => {
    try {
      // Add to recent POAPs and deduplicate
      const updatedRecentPoaps = [poap, ...recentPoaps.filter(p => p.id !== poap.id)].slice(0, 5);
      localStorage.setItem('recentPoaps', JSON.stringify(updatedRecentPoaps));
      setRecentPoaps(updatedRecentPoaps);

      // Navigate to the POAP
      router.push(`/poaps/${poap.id}`);
      if (externalOnClose) externalOnClose();
    } catch (err) {
      console.error('Error saving recent POAPs to localStorage:', err);
    }
  };

  // Mock logout function - would be replaced with actual auth logic
  const handleLogout = () => {
    // Clear any auth state and localStorage
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(DEFAULT_USER);

    // In a real app, would redirect to login page or perform other auth cleanup
    console.log('User logged out');
    if (externalOnClose) externalOnClose();
  };

  // Filter POAPs based on search query
  const filteredPoaps =
    searchQuery.trim() === ''
      ? poaps
      : poaps.filter(poap => poap.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Navigation sections
  const mainNavigationItems = [
    {
      name: 'Home',
      href: '/',
      icon: <Home className="h-4 w-4" />,
      color: 'text-blue-600',
      protected: false, // Not protected
    },
    {
      name: 'Explore',
      href: '/explorer',
      icon: <Sparkles className="h-4 w-4" />,
      color: 'text-pink-600',
      protected: true, // Protected route
    },
    {
      name: 'POAPs',
      href: '/poaps',
      icon: <Award className="h-4 w-4" />,
      color: 'text-emerald-600',
      protected: true, // Protected route
    },
    {
      name: 'Analytics',
      href: '/dashboard',
      icon: <BarChart4 className="h-4 w-4" />,
      color: 'text-violet-600',
      protected: true, // Protected route
    },
  ];

  const userNavigationItems = [
    {
      name: 'Profile',
      href: '/profile',
      icon: <User className="h-4 w-4" />,
      color: 'text-neutral-600',
      protected: true, // Protected route
    },
    {
      name: 'Wallet',
      href: '/wallet',
      icon: <Wallet className="h-4 w-4" />,
      color: 'text-amber-600',
      protected: true, // Protected route
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: <Bell className="h-4 w-4" />,
      badge: '3',
      color: 'text-red-600',
      protected: true, // Protected route
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
      color: 'text-neutral-600',
      protected: true, // Protected route
    },
  ];

  const supportNavigationItems = [
    {
      name: 'Documentation',
      href: 'https://github.com/chainsona/cpop',
      icon: <FileText className="h-4 w-4" />,
      color: 'text-blue-600',
    },
    {
      name: 'Get updates',
      href: 'https://x.com/chainsona',
      icon: <Bell className="h-4 w-4" />,
      color: 'text-green-600',
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (externalOnClose) externalOnClose();
    }
  };

  // Check if we're on a POAP detail page
  useEffect(() => {
    // Reset the current POAP title
    setCurrentPoapTitle(null);

    // Check if we're on a POAP detail page
    const poapMatch = pathname.match(/\/poaps\/([^\/]+)/);
    if (poapMatch && poapMatch[1]) {
      const poapId = poapMatch[1];

      // First check recent POAPs
      const recentPoap = recentPoaps.find(p => p.id === poapId);
      if (recentPoap) {
        setCurrentPoapTitle(recentPoap.title);
        return;
      }

      // Then check all POAPs
      const foundPoap = poaps.find(p => p.id === poapId);
      if (foundPoap) {
        setCurrentPoapTitle(foundPoap.title);
        return;
      }

      // If not found locally but we're on a POAP page, fetch the specific POAP
      const fetchSinglePoap = async () => {
        try {
          const response = await fetch(`/api/poaps/${poapId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.poap?.title) {
              setCurrentPoapTitle(data.poap.title);
            }
          }
        } catch (err) {
          console.error('Error fetching POAP details:', err);
        }
      };

      fetchSinglePoap();
    }
  }, [pathname, poaps, recentPoaps, externalIsOpen]);

  // Add internal keyboard shortcut handler for navigation when menu is open
  useEffect(() => {
    if (typeof window === 'undefined' || !externalIsOpen) return;

    const handleInternalKeyPress = (e: KeyboardEvent) => {
      // Detect the correct modifier key based on OS
      const isModifierPressed =
        os === 'macos' || os === 'ios'
          ? e.metaKey // Command key for macOS/iOS
          : e.altKey; // Alt key for others

      if (isModifierPressed) {
        if (e.key === 'c') {
          // Create new POAP
          e.preventDefault();
          router.push('/poaps/create');
          if (externalOnClose) externalOnClose();
        } else if (e.key === 'h') {
          // Home
          e.preventDefault();
          router.push('/');
          if (externalOnClose) externalOnClose();
        } else if (e.key === 'e') {
          // Explorer
          e.preventDefault();
          router.push('/explorer');
          if (externalOnClose) externalOnClose();
        } else if (e.key === 'p') {
          // POAPs
          e.preventDefault();
          router.push('/poaps');
          if (externalOnClose) externalOnClose();
        }
      }
    };

    window.addEventListener('keydown', handleInternalKeyPress);
    return () => window.removeEventListener('keydown', handleInternalKeyPress);
  }, [externalIsOpen, externalOnClose, router, os]);

  // Helper function for handling close
  const handleClose = () => {
    if (externalOnClose) externalOnClose();
  };

  return (
    <Dialog open={!!externalIsOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] overflow-y-auto p-6"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold">
              {currentPoapTitle || 'Navigation'}
            </DialogTitle>

            {/* Keyboard shortcut legend - Only visible on desktop */}
            <div className="hidden md:flex items-center gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-neutral-100 rounded-md">
                  {getShortcutDisplayText('c')}
                </kbd>
                Create
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-neutral-100 rounded-md">
                  {getShortcutDisplayText('e')}
                </kbd>
                Explorer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-neutral-100 rounded-md">
                  {getShortcutDisplayText('p')}
                </kbd>
                POAPs
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-neutral-100 rounded-md">Esc</kbd>
                Close
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Desktop-optimized layout */}
        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:gap-6">
          {/* Left sidebar - Navigation for desktop */}
          <div className="md:w-60 lg:w-72 space-y-4 order-2 md:order-1">
            {/* User profile card - More compact */}
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  {user.walletAddress && user.walletAddress !== '0x000...000' ? (
                    <div className="h-full w-full flex items-center justify-center bg-blue-100">
                      <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                  ) : (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {user.walletAddress && user.walletAddress !== '0x000...000'
                      ? 'Solana Wallet'
                      : user.name}
                  </h3>
                  <div className="text-xs font-mono bg-neutral-100 text-neutral-700 mt-1 p-1 rounded flex items-center justify-between">
                    <span className="truncate">
                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-6)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 text-neutral-500 hover:text-neutral-700"
                      onClick={e => {
                        e.preventDefault();
                        navigator.clipboard
                          .writeText(user.walletAddress)
                          .then(() => toast.success('Wallet address copied to clipboard'))
                          .catch(() => toast.error('Failed to copy address'));
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Create New POAP Button - Desktop position */}
            <div>
              <Button
                className="w-full gap-2 text-sm bg-blue-600 hover:bg-blue-700 py-5"
                onClick={e => {
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
                }}
              >
                <PlusCircle className="h-4 w-4" />
                Create New POAP
                <span className="ml-auto text-xs opacity-70">{getShortcutDisplayText('c')}</span>
              </Button>
            </div>

            {/* Tabbed Navigation - Compact all navigation sections */}
            <div className="bg-neutral-50 rounded-lg border border-neutral-100 p-2">
              <div className="space-y-1">
                {/* Main Navigation */}
                {mainNavigationItems.map(item => {
                  // Use the state variable instead of directly accessing localStorage
                  const handleItemClick = (e: React.MouseEvent) => {
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
                      if (externalOnClose) externalOnClose();
                      return;
                    }

                    // Otherwise normal navigation
                    if (externalOnClose) externalOnClose();
                  };

                  const isActive = pathname === item.href;

                  // Generate keyboard shortcut hint
                  let shortcutHint = '';
                  if (item.href === '/') shortcutHint = getShortcutDisplayText('h');
                  if (item.href === '/explorer') shortcutHint = getShortcutDisplayText('e');
                  if (item.href === '/poaps') shortcutHint = getShortcutDisplayText('p');

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between gap-2 p-2 rounded-md transition-colors text-sm',
                        isActive ? 'bg-blue-100 text-blue-800' : 'hover:bg-neutral-100'
                      )}
                      onClick={handleItemClick}
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

                      {shortcutHint && (
                        <span className="text-xs text-neutral-400">{shortcutHint}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* More - Collapsible section */}
            <details className="group">
              <summary className="flex items-center justify-between p-2 rounded-md bg-neutral-50 border border-neutral-100 cursor-pointer">
                <span className="font-medium text-sm">More</span>
                <ChevronRight className="h-4 w-4 text-neutral-500 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="pt-2 pb-1 px-1 space-y-1 mt-1 bg-white srounded-md border border-neutral-100">
                {/* User Navigation */}
                {userNavigationItems.map(item => {
                  const handleItemClick = (e: React.MouseEvent) => {
                    if (item.protected && !isAuthenticated) {
                      e.preventDefault();
                      try {
                        localStorage.setItem('auth_redirect', item.href);
                      } catch (err) {
                        console.error('Error accessing localStorage:', err);
                      }
                      router.push('/auth');
                      if (externalOnClose) externalOnClose();
                      return;
                    }
                    if (externalOnClose) externalOnClose();
                  };

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-neutral-100 transition-colors text-sm"
                      onClick={handleItemClick}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn('p-1 rounded-md bg-neutral-100', item.color)}>
                          {item.icon}
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>

                      <div className="flex items-center">
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}

                {/* Support Navigation */}
                {supportNavigationItems.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-100 transition-colors text-sm"
                    onClick={externalOnClose}
                  >
                    <div className={cn('p-1 rounded-md bg-neutral-100', item.color)}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </details>

            {/* Logout Button */}
            <div>
              <Button
                variant="outline"
                className="w-full gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
                Log Out
              </Button>
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 order-1 md:order-2">
            {/* Search bar - Made more prominent and full-width */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
              <Input
                placeholder="Search POAPs..."
                className="pl-10 py-6 bg-neutral-50 text-base"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Desktop-optimized content section */}
            <div className="space-y-6">
              {/* Recent POAPs - Horizontal scrolling on desktop */}
              {recentPoaps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <h3 className="text-base font-medium">Recent POAPs</h3>
                    </div>
                    {recentPoaps.length > 3 && (
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        View all <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                  <div className="flex overflow-x-auto pb-2 space-x-3 hide-scrollbar">
                    {recentPoaps.map(poap => (
                      <button
                        key={poap.id}
                        className="flex-shrink-0 w-64 flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 hover:shadow-sm transition-all text-left border border-neutral-100 group"
                        onClick={() => navigateToPOAP(poap)}
                      >
                        <div className="h-16 w-16 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow transition-shadow">
                          <img
                            src={poap.imageUrl}
                            alt={poap.title}
                            className="h-full w-full object-cover"
                            onError={e => {
                              (e.target as HTMLImageElement).src =
                                'https://via.placeholder.com/64?text=POAP';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-lg truncate group-hover:text-blue-600 transition-colors">
                            {poap.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full ${
                                poap.status === 'Published'
                                  ? 'bg-blue-100 text-blue-800'
                                  : poap.status === 'Distributed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-neutral-100 text-neutral-800'
                              }`}
                            >
                              {poap.status}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured or Search Results */}
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
                          {recentPoaps.length > 0 ? 'Explore More POAPs' : 'POAPs'}
                        </h3>
                      </div>
                      {!isLoading && !error && poaps.length > 6 && (
                        <Link
                          href="/poaps"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          onClick={externalOnClose}
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
                      <button
                        key={poap.id}
                        className="flex items-center gap-4 p-4 rounded-lg hover:bg-neutral-50 hover:shadow-sm transition-all w-full text-left border border-neutral-100 group"
                        onClick={() => navigateToPOAP(poap)}
                      >
                        <div className="h-20 w-20 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow group-hover:ring-1 group-hover:ring-blue-200 transition-all">
                          <img
                            src={poap.imageUrl}
                            alt={poap.title}
                            className="h-full w-full object-cover"
                            onError={e => {
                              (e.target as HTMLImageElement).src =
                                'https://via.placeholder.com/80?text=POAP';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-lg truncate group-hover:text-blue-600 transition-colors">
                            {poap.title}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                poap.status === 'Published'
                                  ? 'bg-blue-100 text-blue-800'
                                  : poap.status === 'Distributed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-neutral-100 text-neutral-800'
                              }`}
                            >
                              {poap.status}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {/* View all link - Now a more prominent button on desktop */}
                {!searchQuery && !isLoading && !error && poaps.length > 6 && (
                  <Link
                    href="/poaps"
                    className="hidden md:flex items-center justify-center gap-1 text-base text-blue-600 hover:text-blue-800 mt-4 bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors"
                    onClick={externalOnClose}
                  >
                    View all POAPs
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
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
