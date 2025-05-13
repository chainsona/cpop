'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWalletContext } from '@/contexts/wallet-context';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, Check, LogIn, Copy, LogOut } from 'lucide-react';
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
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

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
    disconnect, 
    isProtectedPage,
    isAuthenticated,
    authenticate 
  } = useWalletContext();
  
  // Use direct wallet adapter hooks for better reliability
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  
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

  // Handle wallet connection - directly use the wallet adapter
  const handleConnect = async () => {
    try {
      console.log('Opening wallet connection modal...');
      // Directly open the wallet selection modal
      setVisible(true);
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet');
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Wallet disconnected');
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
      const success = await authenticate();
      if (success) {
        toast.success('Successfully authenticated');
      } else {
        toast.error('Authentication failed');
      }
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
        className="flex items-center gap-2"
      >
        {connecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            <span>Connect Wallet</span>
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
        <Button 
          variant="outline" 
          size={size} 
          className={isAuthenticated 
            ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-2" 
            : "flex items-center gap-2"
          }
        >
          <Wallet className="h-4 w-4" />
          {isAuthenticated && <Check className="h-3 w-3" />}
          {showAddress && formattedAddress}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Solana Wallet</DropdownMenuLabel>
        <DropdownMenuItem disabled className="opacity-100 cursor-default">
          {formattedAddress} {isAuthenticated && <Check className="h-3 w-3 ml-2 text-green-600" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {walletAddress && (
          <DropdownMenuItem onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            {isClipboardCopied ? 'Copied!' : 'Copy Address'}
          </DropdownMenuItem>
        )}
        {!isAuthenticated && (
          <DropdownMenuItem onClick={handleAuthenticate} disabled={isAuthenticating}>
            <LogIn className="h-4 w-4 mr-2" />
            {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleDisconnect}
          className="text-red-500 focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 