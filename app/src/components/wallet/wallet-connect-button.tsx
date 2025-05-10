'use client';

import { useWalletContext } from '@/contexts/wallet-context';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
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

export function WalletConnectButton() {
  const { connecting } = useWalletContext();
  const { publicKey, disconnect } = useWallet();
  
  // We can use the built-in wallet modal provided by @solana/wallet-adapter-react-ui
  const { setVisible } = useWalletModal();

  // Truncate the wallet address for display
  const truncatedAddress = publicKey 
    ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
    : null;

  if (!publicKey) {
    return (
      <Button
        variant="outline"
        onClick={() => setVisible(true)}
        disabled={connecting}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          {truncatedAddress}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Connected Wallet</p>
            <p className="text-xs text-muted-foreground font-mono">
              {publicKey.toString()}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(publicKey.toString());
          }}
        >
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="text-red-500 focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 