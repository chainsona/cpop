import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold mb-4">POAP Creation Platform</h1>
          <p className="text-lg mb-8">Create and manage your Proof of Attendance Protocol tokens</p>

          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <Link href="/poaps">
              <Button className="w-full sm:w-auto" size="lg">
                View POAPs
              </Button>
            </Link>
            <Link href="/poaps/create">
              <Button className="w-full sm:w-auto" variant="outline" size="lg">
                Create POAP
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
