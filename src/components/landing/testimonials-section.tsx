'use client';

import { Container } from '@/components/ui/container';
import { Star } from 'lucide-react';

// Testimonial data
const testimonials = [
  {
    quote:
      'Our hackathon participants loved collecting their proof tokens. It created a fun, competitive element that boosted engagement and community connections.',
    name: 'MonkeDAO',
    title: 'Community-led Solana Organization',
    image: 'https://wjsfpbeucpkahphewchk.supabase.co/storage/v1/object/public/cpop//monkedao.jpg',
  },
  {
    quote:
      'Proof tokens have become essential for our hackathons with 70,000+ builders. They help us track participation and celebrate achievements across our ecosystem.',
    name: 'Colosseum',
    title: 'Premier Solana Hackathon Platform',
    image: 'https://wjsfpbeucpkahphewchk.supabase.co/storage/v1/object/public/cpop/colosseum.jpg',
  },
  {
    quote:
      'These tokens have become an essential part of our community strategy. They help us recognize contributors and reward our most engaged members.',
    name: 'mntDAO',
    title: 'Solana Developer Collective',
    image: 'https://wjsfpbeucpkahphewchk.supabase.co/storage/v1/object/public/cpop/mtndao.jpg',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-neutral-50 dark:bg-neutral-900">
      <Container>
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Trusted by Solana Ecosystem Organizers
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            Join leading DAOs, communities, and projects across the Solana ecosystem that use our
            platform to reward participation.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-4 sm:p-6 rounded-xl bg-white dark:bg-neutral-800 shadow-sm"
            >
              <div className="flex mb-2 sm:mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 mb-3 sm:mb-4">
                {testimonial.quote}
              </p>
              <div className="flex items-center">
                <img
                  src={testimonial.image}
                  alt={`${testimonial.name} logo`}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover mr-2 sm:mr-3"
                />
                <div>
                  <p className="font-medium text-sm sm:text-base">{testimonial.name}</p>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    {testimonial.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 md:mt-16 p-6 sm:p-8 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                8,742
              </p>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                POPs Created
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                97
              </p>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">Events</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                2,483
              </p>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                Participants
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                28
              </p>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">Countries</p>
            </div>
          </div>
        </div>
      </Container>

      <div className="flex justify-center mt-2 sm:mt-4">
        <p className="text-xs italic text-neutral-500 dark:text-neutral-400 px-4 text-center">
          (Note: These testimonials and metrics are placeholders and do not represent actual
          endorsements or data)
        </p>
      </div>
    </section>
  );
}
