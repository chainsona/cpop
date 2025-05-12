'use client';

import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
import { ActionButton } from '@/components/wallet/action-button';
import Image from 'next/image';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden bg-gradient-to-b from-white to-neutral-50 dark:from-black dark:to-neutral-900">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-4 sm:space-y-6">
            <div className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium text-xs sm:text-sm">
              The #1 POP Creation Platform
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Turn Events into <br className="hidden sm:block" />
              <span className="text-blue-600 dark:text-blue-400">Digital Memories</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-300 max-w-lg">
              Create, distribute and manage digital proof of participation tokens that your
              community will love to collect and share.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <ActionButton
                connectedText="Create Your First POP"
                connectedPath="/pops/create"
                disconnectedText="Create POPs"
                className="w-full sm:w-auto px-4 sm:px-8"
                size="lg"
              />
              <Link href="/explorer" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto px-4 sm:px-8" variant="outline" size="lg">
                  Explore Events <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-500" />
                <span>No coding required</span>
              </div>
              <div className="flex items-center">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-500" />
                <span>100% secure</span>
              </div>
              <div className="flex items-center">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-500" />
                <span>Free to start</span>
              </div>
            </div>
          </div>

          <div className="relative mt-6 lg:mt-0">
            <div className="relative z-10 bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-2xl shadow-xl mx-auto max-w-md lg:max-w-none">
              <Image
                src="https://wjsfpbeucpkahphewchk.supabase.co/storage/v1/object/public/cpop//GT0oObuW0AA0tRI.jpeg"
                alt="Example POP tokens for events"
                width={500}
                height={400}
                className="rounded-lg w-full h-auto"
                priority
              />
            </div>
            <div className="absolute -top-6 -right-6 w-36 sm:w-48 h-36 sm:h-48 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-6 -left-6 w-48 sm:w-72 h-48 sm:h-72 bg-purple-500/10 rounded-full blur-3xl" />
          </div>
        </div>
      </Container>
    </section>
  );
}
