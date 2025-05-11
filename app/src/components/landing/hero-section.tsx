'use client';

import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
import { ActionButton } from '@/components/wallet/action-button';
import Image from 'next/image';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-white to-neutral-50 dark:from-black dark:to-neutral-900">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium text-sm">
              The #1 POAP Creation Platform
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Turn Events into <br />
              <span className="text-blue-600 dark:text-blue-400">Digital Memories</span>
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-lg">
              Create, distribute and manage digital proof of participation tokens that your
              community will love to collect and share.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <ActionButton
                connectedText="Create Your First POAP"
                connectedPath="/poaps/create"
                disconnectedText="Create POAPs"
                className="w-full sm:w-auto px-8"
                size="lg"
              />
              <Link href="/explorer">
                <Button className="w-full sm:w-auto px-8" variant="outline" size="lg">
                  Explore Events <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-1 text-green-500" />
                <span>No coding required</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-1 text-green-500" />
                <span>100% secure</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-1 text-green-500" />
                <span>Free to start</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-xl">
              <Image
                src="https://wjsfpbeucpkahphewchk.supabase.co/storage/v1/object/public/cpop//GT0oObuW0AA0tRI.jpeg"
                alt="Example POAP tokens for events"
                width={500}
                height={400}
                className="rounded-lg"
                priority
              />
            </div>
            <div className="absolute -top-6 -right-6 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-6 -left-6 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          </div>
        </div>
      </Container>
    </section>
  );
}
