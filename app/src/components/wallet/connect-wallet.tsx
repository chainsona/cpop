'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWalletContext } from '@/contexts/wallet-context';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, Check, LogIn } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { createSignatureMessage } from '@/lib/solana-auth';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import { useRouter, usePathname } from 'next/navigation';

interface ConnectWalletProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showAddress?: boolean;
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export function ConnectWallet({
  variant = 'default',
  size = 'default',
  showAddress = true,
  onAuthChange,
}: ConnectWalletProps) {
  const { 
    isConnected, 
    connecting, 
    walletAddress, 
    signMessage, 
    connect, 
    disconnect, 
    isProtectedPage,
    isAuthenticated,
    authenticate 
  } = useWalletContext();
  const [isClipboardCopied, setIsClipboardCopied] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Use ref to track previous auth state to prevent unnecessary callbacks
  const prevAuthStateRef = useRef(isAuthenticated);

  // Notify parent component when authentication state changes
  useEffect(() => {
    if (onAuthChange && isAuthenticated !== prevAuthStateRef.current) {
      onAuthChange(isAuthenticated);
      prevAuthStateRef.current = isAuthenticated;
    }
  }, [isAuthenticated, onAuthChange]);

  // Clear all stored tokens and reset state
  const clearAuthTokens = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('solana_auth_token');
    }
    
    deleteCookie('solana_auth_token');
    
    // Only dispatch storage event if running in browser
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'solana_auth_token',
        newValue: null
      }));
    }
    
    // Notify parent component if callback exists
    if (onAuthChange) {
      onAuthChange(false);
    }
  };

  // Handle wallet connection
  const handleConnect = async () => {
    try {
      await connect();
      // The authentication will be automatically triggered by the context
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await disconnect();
      // clearAuthTokens is no longer needed here as disconnect in the context handles this
    } catch (error) {
      console.error('Disconnection error:', error);
      // Still try to clear tokens even if disconnect fails
      clearAuthTokens();
      
      // If still on a protected page after clearing tokens, redirect to home
      if (isProtectedPage(pathname)) {
        router.push('/');
      }
    }
  };

  // Handle manual authentication (if auto-auth fails)
  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    try {
      await authenticate();
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Failed to authenticate with wallet');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Copy wallet address to clipboard
  const copyToClipboard = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setIsClipboardCopied(true);
        toast.success('Wallet address copied to clipboard');
        
        // Reset the copied state after 2 seconds
        setTimeout(() => setIsClipboardCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy wallet address');
      }
    }
  };

  // Format the wallet address for display
  const formattedAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : '';

  // If not connected, show connect button
  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        variant={variant}
        size={size}
        disabled={connecting}
      >
        {connecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        )}
      </Button>
    );
  }

  // If connected and just want the address display
  if (showAddress && !isConnected) {
    return (
      <div className="text-sm font-medium text-gray-600">
        {formattedAddress}
      </div>
    );
  }

  // If connected, show dropdown with options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} className={isAuthenticated ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" : ""}>
          <Wallet className="mr-2 h-4 w-4" />
          {isAuthenticated && <Check className="h-3 w-3 mr-1" />}
          {showAddress && formattedAddress}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {walletAddress && (
          <DropdownMenuItem onClick={copyToClipboard}>
            {isClipboardCopied ? 'Copied!' : 'Copy Address'}
          </DropdownMenuItem>
        )}
        {!isAuthenticated ? (
          <DropdownMenuItem onClick={handleAuthenticate} disabled={isAuthenticating}>
            <LogIn className="h-4 w-4 mr-2" />
            {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem className="text-green-600">
            <Check className="h-4 w-4 mr-2" />
            Authenticated
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect}>
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 