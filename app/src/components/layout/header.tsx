'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  Award,
  ShieldCheck,
  Wallet,
  LayoutDashboard,
  Copy,
} from 'lucide-react';
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
import { WalletConnectButton } from '@/components/wallet/wallet-connect-button';
import { useWalletContext } from '@/contexts/wallet-context';
import { toast } from 'sonner';
import { useNavigation } from './navigation-context';

// User storage key
const USER_STORAGE_KEY = 'userProfile';

// Default user as fallback
const DEFAULT_USER = {
  name: 'Guest User',
  email: 'guest@example.com',
  walletAddress: '11111111111111111111111111111111',
  avatarUrl: '',
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { pageTitle } = usePageTitle();
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(DEFAULT_USER);
  const [currentPoapTitle, setCurrentPoapTitle] = useState<string | null>(null);
  const { walletAddress, isConnected, disconnect, isProtectedPage, isAuthenticated } =
    useWalletContext();
  const { isNavigationOpen, openNavigation, closeNavigation } = useNavigation();

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
  const displayTitle = currentPoapTitle || pageTitle || 'Proof of Participation';

  // Function to truncate title on mobile
  const getTruncatedTitle = (title: string) => {
    return title.length > 15 ? `${title.substring(0, 15)}...` : title;
  };

  // Load user data from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        // Update wallet address if it changed
        if (walletAddress && walletAddress !== parsedUser.walletAddress) {
          const updatedUser = { ...parsedUser, walletAddress };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          setUser(updatedUser);
        } else {
          setUser(parsedUser);
        }
      } else {
        // If no user exists in storage, set the default user
        const defaultUser = { ...DEFAULT_USER };
        if (walletAddress) {
          defaultUser.walletAddress = walletAddress;
        }
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultUser));
        setUser(defaultUser);
      }
    } catch (err) {
      console.error('Error loading user data from localStorage:', err);
    }
  }, [walletAddress]);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle user logout with wallet disconnect
  const handleLogout = async () => {
    try {
      // Check if we're on a protected page before clearing tokens
      const needsRedirect = isProtectedPage(pathname);

      // Clear the Solana auth token
      localStorage.removeItem('solana_auth_token');
      // Also clear the cookie used by middleware
      import('cookies-next').then(({ deleteCookie }) => {
        deleteCookie('solana_auth_token');
      });

      // Disconnect the wallet if it's connected
      if (isConnected) {
        await disconnect();
      }

      // Clear user storage
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(DEFAULT_USER);

      // If on a protected page, redirect to home page
      if (needsRedirect) {
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out completely');

      // Still try to redirect if we're on a protected page
      if (isProtectedPage(pathname)) {
        router.push('/');
      }
    }
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
        <div className="container max-w-[1440px] mx-auto flex h-16 items-center justify-between px-4">
          {/* Left side: Menu + Logo + Separator + Page Title */}
          <div className="flex items-center">
            {/* Menu Button - For opening navigation */}
            <Button
              variant="ghost"
              size="icon"
              className="mr-1 md:mr-2"
              onClick={openNavigation}
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
            <div className="mx-2 md:mx-3 h-6 w-px bg-neutral-200"></div>

            {/* Page title with click to open navigation */}
            <Button
              variant="ghost"
              className="px-1 h-9 font-medium max-w-[150px] sm:max-w-none overflow-hidden"
              onClick={openNavigation}
            >
              <span className="mr-1 truncate">
                <span className="hidden sm:inline">{displayTitle}</span>
                <span className="inline sm:hidden">{getTruncatedTitle(displayTitle)}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-neutral-500 flex-shrink-0" />
            </Button>
          </div>

          {/* Right side: Wallet + User account */}
          <div className="flex items-center gap-4">
            {/* Show either Wallet Connect Button OR User account */}
            {!isConnected ? (
              /* Wallet Connect Button */
              <WalletConnectButton />
            ) : (
              /* User account */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2 pr-3 h-9">
                    <Avatar className="h-7 w-7">
                      {walletAddress ? (
                        <div className="h-full w-full flex items-center justify-center bg-blue-100">
                          <Wallet className="h-4 w-4 text-blue-600" />
                        </div>
                      ) : (
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                      )}
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline">
                      {walletAddress
                        ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
                        : user.name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {walletAddress ? `Solana Wallet` : user.name}
                      </p>
                      {!walletAddress && (
                        <p className="text-xs leading-none text-neutral-500">{user.email}</p>
                      )}
                      {walletAddress && (
                        <div className="flex items-center mt-1">
                          <div className="flex-1 font-mono text-xs text-neutral-500 truncate bg-neutral-50 p-1 rounded">
                            {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-1 h-4 w-4 inline-flex items-center justify-center hover:bg-neutral-100"
                              onClick={e => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(walletAddress);
                                toast.success('Wallet address copied!');
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {isAuthenticated && (
                            <ShieldCheck className="h-3 w-3 ml-1 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <div className="flex items-center w-full">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          <span>Dashboard</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
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
            )}
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      <NavigationMenu isOpen={isNavigationOpen} onClose={closeNavigation} />
    </>
  );
}
