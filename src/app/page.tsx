'use client';

import { usePageTitle } from '@/contexts/page-title-context';
import { useEffect } from 'react';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { CTASection } from '@/components/landing/cta-section';
import { FAQSection } from '@/components/landing/faq-section';
import { FooterSection } from '@/components/landing/footer-section';
import { useWalletContext } from '@/contexts/wallet-context';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { setPageTitle } = usePageTitle();
  const { isAuthenticated } = useWalletContext();
  const router = useRouter();

  // Set page title
  useEffect(() => {
    setPageTitle('Digital Proof of Participation');

    return () => {
      setPageTitle('');
    };
  }, [setPageTitle]);

  // Redirect to explorer when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/explorer');
    }
  }, [isAuthenticated, router]);

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <HowItWorksSection />
      <CTASection />
      <FAQSection />
      <FooterSection />
    </>
  );
}
