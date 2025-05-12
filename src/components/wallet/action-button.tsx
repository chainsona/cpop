'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ReactNode } from 'react';
import { ArrowRight, Wallet } from 'lucide-react';

type ActionButtonProps = {
  connectedText: string;
  connectedPath: string;
  disconnectedText?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
  showArrow?: boolean;
  children?: ReactNode;
};

export function ActionButton({
  connectedText,
  connectedPath,
  disconnectedText = 'Connect Wallet',
  size = 'default',
  variant = 'default',
  className = '',
  showArrow = true,
  children,
}: ActionButtonProps) {
  const { publicKey, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const walletConnected = !!publicKey;

  // If wallet is connected, show action button with link
  if (walletConnected) {
    return (
      <Link href={connectedPath}>
        <Button className={className} size={size} variant={variant}>
          {connectedText}
          {showArrow && <ArrowRight className="ml-2 h-4 w-4" />}
          {children}
        </Button>
      </Link>
    );
  }

  // If wallet is not connected, show connect button
  return (
    <Button
      className={className}
      size={size}
      variant={variant}
      onClick={() => setVisible(true)}
      disabled={connecting}
    >
      {connecting ? 'Connecting...' : disconnectedText}
      {!connecting && <Wallet className="ml-2 h-4 w-4" />}
      {children}
    </Button>
  );
}
