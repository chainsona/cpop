'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Settings, LogOut, ChevronDown, Menu, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePageTitle } from '@/contexts/page-title-context';
import { NavigationMenu } from './navigation-menu';

// User storage key
const USER_STORAGE_KEY = 'userProfile';

// Default user as fallback
const DEFAULT_USER = {
  name: 'Guest User',
  email: 'guest@example.com',
  walletAddress: '0x000...000',
  avatarUrl: '',
};

export function Header() {
  const pathname = usePathname();
  const { pageTitle } = usePageTitle();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [user, setUser] = useState(DEFAULT_USER);
  const [currentPoapTitle, setCurrentPoapTitle] = useState<string | null>(null);

  // Check if we're on a POAP detail page and get the title directly from URL
  useEffect(() => {
    const poapMatch = pathname.match(/\/poaps\/([^\/]+)/);

    if (poapMatch && poapMatch[1]) {
      // We're on a POAP page (main or subpage), try to get the POAP title
      const fetchPoapTitle = async () => {
        try {
          const poapId = poapMatch[1];
          const response = await fetch(`/api/poaps/${poapId}`);

          if (response.ok) {
            const data = await response.json();
            if (data.poap?.title) {
              setCurrentPoapTitle(data.poap.title);
            }
          }
        } catch (error) {
          console.error('Error fetching POAP title:', error);
        }
      };

      fetchPoapTitle();
    } else {
      // Not on a POAP page, reset the title
      setCurrentPoapTitle(null);
    }
  }, [pathname]);

  // Determine what title to display
  const displayTitle = currentPoapTitle || pageTitle || 'Home';

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

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mock logout function - would be replaced with actual auth logic
  const handleLogout = () => {
    // Clear any auth state and localStorage
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(DEFAULT_USER);

    // In a real app, would redirect to login page or perform other auth cleanup
    console.log('User logged out');
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full border-b ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-sm border-neutral-200 shadow-sm'
            : 'bg-white border-neutral-100'
        } transition-all duration-200`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between">
          {/* Left side: Menu + Logo + Separator + Page Title */}
          <div className="flex items-center">
            {/* Menu Button - Mobile and Desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => setIsNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo */}
            <Link href="/" className="font-semibold text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              <span className="hidden sm:inline">POAP</span>
            </Link>

            {/* Separator */}
            <div className="mx-3 h-6 w-px bg-neutral-200"></div>

            {/* Page title with click to open navigation */}
            <Button
              variant="ghost"
              className="px-1 h-9 font-medium"
              onClick={() => setIsNavOpen(true)}
            >
              <span className="mr-1">{displayTitle}</span>
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            </Button>
          </div>

          {/* Right side: User account */}
          <div className="flex items-center gap-4">
            {/* User account */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2 pr-3 h-9">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-neutral-500">{user.email}</p>
                    <p className="text-xs font-mono text-neutral-500 mt-1 truncate">
                      {user.walletAddress}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Navigation Modal */}
      <NavigationMenu isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
    </>
  );
}
