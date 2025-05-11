'use client';

import { Container } from "@/components/ui/container";
import { usePageTitle } from '@/contexts/page-title-context';
import { useEffect } from 'react';
import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setPageTitle } = usePageTitle();

  // Reset page title when unmounting
  useEffect(() => {
    return () => {
      setPageTitle('');
    };
  }, [setPageTitle]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex space-x-4 text-sm">
            <Link
              href="/legal/terms"
              className="text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
            >
              Terms of Service
            </Link>
            <Link
              href="/legal/privacy"
              className="text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal/cookies"
              className="text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
            >
              Cookie Policy
            </Link>
          </div>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
      </Container>
    </div>
  );
} 