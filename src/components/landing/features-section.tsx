'use client';

import { Container } from '@/components/ui/container';
import { Award, Users, Clock } from 'lucide-react';

export function FeaturesSection() {
  return (
    <section id="features" className="py-12 sm:py-16 md:py-20">
      <Container>
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Everything You Need to Create Amazing POPs
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto px-4">
            Our platform provides all the tools to design, distribute and manage digital
            collectibles for your events and communities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="flex flex-col items-start p-4 sm:p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Award className="h-8 w-8 sm:h-10 sm:w-10 mb-3 sm:mb-4 text-blue-500" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Simple Design Tools</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Create unique tokens with our easy-to-use design tools. No design skills required.
            </p>
          </div>

          <div className="flex flex-col items-start p-4 sm:p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 mb-3 sm:mb-4 text-green-500" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Effortless Distribution</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Share with QR codes, claim links, or email. Multiple options to fit your event needs.
            </p>
          </div>

          <div className="flex flex-col items-start p-4 sm:p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Clock className="h-8 w-8 sm:h-10 sm:w-10 mb-3 sm:mb-4 text-purple-500" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Permanent Blockchain Storage</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              All POPs are securely stored on the blockchain, creating a permanent record of
              participation.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
