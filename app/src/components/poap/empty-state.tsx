import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function EmptyState() {
  return (
    <div className="text-center py-10">
      <p className="text-neutral-500">No POAPs created yet.</p>
      <Link href="/poaps/create" className="mt-4 inline-block">
        <Button variant="outline">Create your first POAP</Button>
      </Link>
    </div>
  );
} 