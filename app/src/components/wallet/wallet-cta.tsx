'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ArrowRight, Wallet } from 'lucide-react';
import { ReactNode } from 'react';

type WalletCTAProps = {
  // Text shown when wallet is connected
  connectedText: string;
  // Path to navigate to when connected
  connectedPath: string;
  // Text shown when wallet is disconnected (for the connect button)
  connectText: string;
  // Text for secondary action (such as explore)
  secondaryText?: string;
  // Path for secondary action
  secondaryPath?: string;
  // Descriptive text shown above the buttons
  description?: string;
  // Button size
  size?: 'default' | 'sm' | 'lg';
  // Additional classes for the primary button
  className?: string;
  // Children to render after the buttons
  children?: ReactNode;
};

export function WalletCTA({
  connectedText,
  connectedPath,
  connectText,
  secondaryText,
  secondaryPath,
  description,
  size = 'default',
  className = '',
  children,
}: WalletCTAProps) {
  const { publicKey, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const walletConnected = !!publicKey;

  return (
    <div className="space-y-3">
      {description && (
        <p className="text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      )}

      <div className="space-y-3">
        {walletConnected ? (
          <Link href={connectedPath}>
            <Button className={`w-full ${className}`} size={size}>
              {connectedText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button
            className={`w-full ${className}`}
            size={size}
            onClick={() => setVisible(true)}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : connectText}
            {!connecting && <Wallet className="ml-2 h-4 w-4" />}
          </Button>
        )}

        {secondaryText && secondaryPath && (
          <Link href={secondaryPath}>
            <Button variant="outline" className="w-full" size={size}>
              {secondaryText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {children}
    </div>
  );
} 