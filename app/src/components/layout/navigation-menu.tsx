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
  Ticket,
  Lock,
  MapPin,
  PlusCircle,
  ChevronRight,
  X,
  Clock,
  Star,
  Sparkles,
  User,
  Wallet,
  Bell,
  LogOut,
  Bookmark,
  HelpCircle,
  FileText,
  Heart,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

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
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [poaps, setPoaps] = useState<POAP[]>([]);
  const [recentPoaps, setRecentPoaps] = useState<POAP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(DEFAULT_USER);
  const [currentPoapTitle, setCurrentPoapTitle] = useState<string | null>(null);

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

    if (isOpen) {
      fetchPoaps();
      loadRecentPoapsFromStorage();
    }
  }, [isOpen]);

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
      onClose();
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
    onClose();
  };

  // Filter POAPs based on search query
  const filteredPoaps =
    searchQuery.trim() === ''
      ? poaps
      : poaps.filter(poap => poap.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Navigation sections
  const mainNavigationItems = [
    { name: 'Home', href: '/', icon: <Home className="h-4 w-4" />, color: 'text-blue-600' },
    {
      name: 'My POAPs',
      href: '/poaps',
      icon: <Award className="h-4 w-4" />,
      color: 'text-emerald-600',
    },
    {
      name: 'Analytics',
      href: '/dashboard',
      icon: <BarChart4 className="h-4 w-4" />,
      color: 'text-violet-600',
    },
    {
      name: 'Favorites',
      href: '/favorites',
      icon: <Heart className="h-4 w-4" />,
      color: 'text-pink-600',
    },
  ];

  const userNavigationItems = [
    {
      name: 'Profile',
      href: '/profile',
      icon: <User className="h-4 w-4" />,
      color: 'text-neutral-600',
    },
    {
      name: 'Wallet',
      href: '/wallet',
      icon: <Wallet className="h-4 w-4" />,
      color: 'text-amber-600',
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: <Bell className="h-4 w-4" />,
      badge: '3',
      color: 'text-red-600',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
      color: 'text-neutral-600',
    },
  ];

  const supportNavigationItems = [
    {
      name: 'Documentation',
      href: '/docs',
      icon: <FileText className="h-4 w-4" />,
      color: 'text-blue-600',
    },
    {
      name: 'Help Center',
      href: '/help',
      icon: <HelpCircle className="h-4 w-4" />,
      color: 'text-green-600',
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
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
  }, [pathname, poaps, recentPoaps, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="sm:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="space-y-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold">
              {currentPoapTitle || 'Navigation'}
            </DialogTitle>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search POAPs..."
              className="pl-9 bg-neutral-50"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 mt-2">
          {/* Left column - Navigation */}
          <div className="md:col-span-2 space-y-4">
            {/* User profile card */}
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {user.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{user.name}</h3>
                  <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="text-xs font-mono bg-neutral-100 text-neutral-700 p-1.5 rounded flex items-center justify-between">
                <span className="truncate">{user.walletAddress}</span>
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

            {/* Main Navigation */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider px-2">
                Main
              </h3>
              <div className="space-y-0.5">
                {mainNavigationItems.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-100 transition-colors text-sm"
                    onClick={onClose}
                  >
                    <div className={cn('p-1 rounded-md bg-neutral-100', item.color)}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* User Navigation */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider px-2">
                Account
              </h3>
              <div className="space-y-0.5">
                {userNavigationItems.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-neutral-100 transition-colors text-sm"
                    onClick={onClose}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1 rounded-md bg-neutral-100', item.color)}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Support Navigation */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider px-2">
                Support
              </h3>
              <div className="space-y-0.5">
                {supportNavigationItems.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-100 transition-colors text-sm"
                    onClick={onClose}
                  >
                    <div className={cn('p-1 rounded-md bg-neutral-100', item.color)}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Create New POAP Button */}
            <div className="pt-4 mt-2 border-t border-neutral-100">
              <Link href="/poaps/create" onClick={onClose}>
                <Button className="w-full gap-2 text-sm bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Create New POAP
                </Button>
              </Link>
            </div>

            {/* Logout Button */}
            <div className="pt-1">
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

          {/* Right column - Content */}
          <div className="md:col-span-5 space-y-6">
            {/* Recent POAPs */}
            {recentPoaps.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-500" />
                  <h3 className="text-sm font-medium text-neutral-500">Recent POAPs</h3>
                </div>
                <div className="space-y-2">
                  {recentPoaps.map(poap => (
                    <button
                      key={poap.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 hover:shadow-sm transition-all w-full text-left border border-neutral-100 group"
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
                          <span className="text-xs text-neutral-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Recently viewed
                          </span>
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
              <div className="flex items-center gap-2">
                {searchQuery ? (
                  <>
                    <Search className="h-4 w-4 text-neutral-500" />
                    <h3 className="text-sm font-medium text-neutral-500">
                      {isLoading ? 'Searching...' : `${filteredPoaps.length} results`}
                    </h3>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-medium text-neutral-500">
                      {recentPoaps.length > 0 ? 'Explore More POAPs' : 'POAPs'}
                    </h3>
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
                <div className="space-y-3">
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

              {/* View all link */}
              {!searchQuery && !isLoading && !error && poaps.length > 6 && (
                <Link
                  href="/poaps"
                  className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-4"
                  onClick={onClose}
                >
                  View all POAPs
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
