'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Copy, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileProps {
  user: {
    name: string;
    email: string;
    walletAddress: string;
    avatarUrl: string;
  };
}

export function UserProfile({ user }: UserProfileProps) {
  const handleCopyWalletAddress = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard
      .writeText(user.walletAddress)
      .then(() => toast.success('Wallet address copied to clipboard'))
      .catch(() => toast.error('Failed to copy address'));
  };

  return (
    <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
          {user.walletAddress && user.walletAddress !== '11111111111111111111111111111111' ? (
            <div className="h-full w-full flex items-center justify-center bg-blue-100">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
          ) : (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">
            {user.walletAddress && user.walletAddress !== '11111111111111111111111111111111'
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
              onClick={handleCopyWalletAddress}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
