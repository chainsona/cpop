'use client';

import { Container } from "@/components/ui/container";
import { WalletCTA } from '@/components/wallet/wallet-cta';

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            Creating and distributing POAPs is simple with our streamlined process.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative">
            <div className="absolute top-0 left-6 bottom-0 w-1 bg-blue-100 dark:bg-blue-900/20"></div>
            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold mb-4">
              1
            </div>
            <div className="pl-16 -mt-12">
              <h3 className="text-xl font-semibold mb-2">Design Your POAP</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Use our easy design tools to create a unique digital token that represents your
                event.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-0 left-6 bottom-0 w-1 bg-blue-100 dark:bg-blue-900/20"></div>
            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold mb-4">
              2
            </div>
            <div className="pl-16 -mt-12">
              <h3 className="text-xl font-semibold mb-2">Set Distribution Method</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Choose how participants will claim their POAPs - QR codes, claim links, or direct
                emails.
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute top-0 left-6 h-1/2 w-1 bg-blue-100 dark:bg-blue-900/20"></div>
            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold mb-4">
              3
            </div>
            <div className="pl-16 -mt-12">
              <h3 className="text-xl font-semibold mb-2">Share & Collect</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Distribute to your event attendees and watch as they collect their digital
                mementos.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <div className="max-w-md mx-auto">
            <WalletCTA
              connectedText="Start Creating Now"
              connectedPath="/poaps/create"
              connectText="Start Creating"
              className="mb-0"
              size="lg"
            />
          </div>
        </div>
      </Container>
    </section>
  );
} 