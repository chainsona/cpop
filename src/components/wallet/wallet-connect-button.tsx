'use client';

import { useWalletContext } from '@/contexts/wallet-context';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, Check, LogIn, Copy, Loader2, AlertTriangle } from 'lucide-react';
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
import { truncateWalletAddress } from '@/lib/utils';

export function WalletConnectButton() {
  const { 
    connecting, 
    isAuthenticated, 
    authenticate, 
    hasWalletMismatch, 
    authWalletAddress, 
    activeWalletAddress 
  } = useWalletContext();
  const { publicKey, disconnect } = useWallet();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // We can use the built-in wallet modal provided by @solana/wallet-adapter-react-ui
  const { setVisible } = useWalletModal();

  // Get the address to display - prioritize authenticated address
  const displayAddress = authWalletAddress || 
                         (publicKey ? publicKey.toString() : null);
  
  // Truncate the wallet address for display 
  const truncatedDisplayAddress = displayAddress 
    ? truncateWalletAddress(displayAddress)
    : null;
    
  // Also have the connected wallet address for showing both in case of mismatch
  const truncatedConnectedAddress = publicKey && activeWalletAddress && hasWalletMismatch
    ? truncateWalletAddress(activeWalletAddress)
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

  // Copy wallet address to clipboard - use auth address if available
  const copyToClipboard = async () => {
    const addressToCopy = displayAddress;
    if (addressToCopy) {
      try {
        await navigator.clipboard.writeText(addressToCopy);
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

  // Handle disconnecting
  const handleDisconnect = () => {
    disconnect();
    toast.info('Wallet disconnected');
  };

  if (!publicKey && !authWalletAddress) {
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
          className={`flex items-center gap-2 ${
            hasWalletMismatch 
              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" 
              : isAuthenticated 
                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" 
                : ""
          }`}
        >
          <Wallet className="h-4 w-4" />
          {hasWalletMismatch && <AlertTriangle className="h-3 w-3" />}
          {isAuthenticated && !hasWalletMismatch && <Check className="h-3 w-3" />}
          {truncatedDisplayAddress}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Solana Wallet</DropdownMenuLabel>
        <DropdownMenuItem disabled className="opacity-100 cursor-default">
          {truncatedDisplayAddress} {isAuthenticated && <Check className="h-3 w-3 ml-2 text-green-600" />}
          {hasWalletMismatch && <AlertTriangle className="h-3 w-3 ml-2 text-amber-500" />}
        </DropdownMenuItem>
        
        {hasWalletMismatch && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="opacity-90 cursor-default text-amber-700">
              <AlertTriangle className="h-3 w-3 mr-2 text-amber-500" />
              <span className="text-xs">
                Connected to different wallet:<br/>
                <span className="font-mono">{truncatedConnectedAddress}</span>
              </span>
            </DropdownMenuItem>
          </>
        )}
        
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