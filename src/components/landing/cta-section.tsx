'use client';

import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Check, Shield, Wallet } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { WalletCTA } from '@/components/wallet/wallet-cta';

// Simple connect wallet button with customizable text
function ConnectWalletButton({
  className = '',
  text = 'Connect Wallet',
}: {
  className?: string;
  text?: string;
}) {
  const { connecting } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <Button className={className} onClick={() => setVisible(true)} disabled={connecting}>
      {connecting ? 'Connecting...' : text}
      {!connecting && <Wallet className="ml-2 h-4 w-4" />}
    </Button>
  );
}

// Reusable component for wallet-aware content
function WalletAwareContent({
  connectedContent,
  disconnectedContent,
}: {
  connectedContent: React.ReactNode;
  disconnectedContent: React.ReactNode;
}) {
  const { publicKey } = useWallet();
  const walletConnected = !!publicKey;

  return walletConnected ? connectedContent : disconnectedContent;
}

export function CTASection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-blue-600 dark:bg-blue-900">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 items-center">
          <div className="lg:col-span-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white">
              Ready to create your first POP?
            </h2>
            <p className="text-sm sm:text-base text-blue-100 max-w-xl mb-3 sm:mb-4">
              Join our community and start creating memorable digital tokens for your events today.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center text-blue-100 text-xs sm:text-sm">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center text-blue-100 text-xs sm:text-sm">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                <span>No Credit Card Required</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 mt-6 lg:mt-0">
            <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-xl shadow-lg">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Get Started</h3>

              <WalletCTA
                connectedText="Create Your First POP"
                connectedPath="/pops/create"
                connectText="Create POPs"
                secondaryText="Explore Events First"
                secondaryPath="/explorer"
                description="Connect your Solana wallet to start creating and managing your POPs"
              />

              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-4">
                By connecting, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
