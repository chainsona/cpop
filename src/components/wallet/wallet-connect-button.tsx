'use client';

import { useWalletContext } from '@/contexts/wallet-context';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, Check, LogIn, Copy, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import { toast } from 'sonner';

export function WalletConnectButton() {
  const { connecting, isAuthenticated, authenticate } = useWalletContext();
  const { publicKey, disconnect } = useWallet();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // We can use the built-in wallet modal provided by @solana/wallet-adapter-react-ui
  const { setVisible } = useWalletModal();

  // Truncate the wallet address for display
  const truncatedAddress = publicKey 
    ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
    : null;

  // Handle manual authentication
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
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toString());
        setIsCopied(true);
        toast.success('Wallet address copied to clipboard');
        
        // Reset the copied state after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy wallet address');
      }
    }
  };

  if (!publicKey) {
    return (
      <Button
        variant="outline"
        onClick={() => setVisible(true)}
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={isAuthenticated 
            ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-2" 
            : "flex items-center gap-2"
          }
        >
          <Wallet className="h-4 w-4" />
          {isAuthenticated && <Check className="h-3 w-3" />}
          {truncatedAddress}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Solana Wallet</DropdownMenuLabel>
        <DropdownMenuItem disabled className="opacity-100 cursor-default">
          {truncatedAddress} {isAuthenticated && <Check className="h-3 w-3 ml-2 text-green-600" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyToClipboard}>
          <Copy className="h-4 w-4 mr-2" />
          {isCopied ? 'Copied!' : 'Copy Address'}
        </DropdownMenuItem>
        {!isAuthenticated && (
          <DropdownMenuItem onClick={handleAuthenticate} disabled={isAuthenticating}>
            <LogIn className="h-4 w-4 mr-2" />
            {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="text-red-500 focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 