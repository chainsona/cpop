'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Trophy } from 'lucide-react';
import { usePageTitle } from '@/contexts/page-title-context';
import { useEffect } from 'react';

export default function Home() {
  const { setPageTitle } = usePageTitle();

  // Set page title
  useEffect(() => {
    setPageTitle('Proof of Participation');

    return () => {
      setPageTitle('');
    };
  }, [setPageTitle]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] py-10 sm:py-16 md:py-20">
      <Container>
        <main className="flex flex-col gap-8 items-center">
          <Image
            className="dark:invert w-32 sm:w-48 md:w-52"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <div className="text-center max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                POAP Creation Platform
              </h1>
              <div className="flex items-center justify-center mt-2 text-neutral-600">
                <Trophy className="h-5 w-5 mr-2 text-amber-500" />
                <p className="text-base sm:text-lg">
                  Create and manage your Proof of Attendance Protocol tokens
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link href="/poaps">
                <Button className="w-full sm:w-auto px-8" size="lg">
                  View POAPs
                </Button>
              </Link>
              <Link href="/poaps/create">
                <Button className="w-full sm:w-auto px-8" variant="outline" size="lg">
                  Create POAP
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </Container>
    </div>
  );
}
