'use client';

import { Container } from '@/components/ui/container';
import { WalletCTA } from '@/components/wallet/wallet-cta';

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-12 sm:py-16 md:py-20">
      <Container>
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">How It Works</h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto px-4">
            Creating and distributing POPs is simple with our streamlined process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 px-4 sm:px-0">
          <div className="relative">
            <div className="absolute top-0 left-4 sm:left-6 bottom-0 w-1 bg-blue-100 dark:bg-blue-900/20"></div>
            <div className="relative z-10 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-600 text-white font-bold mb-3 sm:mb-4">
              <span className="text-sm sm:text-base">1</span>
            </div>
            <div className="pl-12 sm:pl-16 -mt-8 sm:-mt-12">
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Design Your POP</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Use our easy design tools to create a unique digital token that represents your
                event.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-0 left-4 sm:left-6 bottom-0 w-1 bg-blue-100 dark:bg-blue-900/20"></div>
            <div className="relative z-10 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-600 text-white font-bold mb-3 sm:mb-4">
              <span className="text-sm sm:text-base">2</span>
            </div>
            <div className="pl-12 sm:pl-16 -mt-8 sm:-mt-12">
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">
                Set Distribution Method
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Choose how participants will claim their POPs - QR codes, claim links, or direct
                emails.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-0 left-4 sm:left-6 h-1/2 w-1 bg-blue-100 dark:bg-blue-900/20"></div>
            <div className="relative z-10 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-600 text-white font-bold mb-3 sm:mb-4">
              <span className="text-sm sm:text-base">3</span>
            </div>
            <div className="pl-12 sm:pl-16 -mt-8 sm:-mt-12">
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Share & Collect</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Distribute to your event attendees and watch as they collect their digital mementos.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <div className="max-w-md mx-auto">
            <WalletCTA
              connectedText="Start Creating Now"
              connectedPath="/pops/create"
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
