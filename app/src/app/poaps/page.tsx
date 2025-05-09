import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { isBase64Image } from '@/lib/poap-utils';
import { POAPCard } from '@/components/poap/poap-card';
import { Base64Warning } from '@/components/poap/base64-warning';
import { EmptyState } from '@/components/poap/empty-state';
import { PoapItem } from '@/types/poap';

export default async function POAPListPage() {
  // Fetch POAPs with their distribution methods
  const poaps = (await prisma.poap.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      distributionMethods: {
        where: {
          // Only include non-deleted methods
          deleted: false,
        },
        select: {
          id: true,
          type: true,
          disabled: true,
          deleted: true,
          // Include relationship data for different method types
          claimLinks: {
            select: {
              id: true,
              claimed: true,
            },
          },
          secretWord: {
            select: {
              claimCount: true,
              maxClaims: true,
            },
          },
          locationBased: {
            select: {
              claimCount: true,
              maxClaims: true,
              city: true,
            },
          },
        },
      },
    },
  })) as PoapItem[];

  // Count how many base64 images are present
  const base64ImageCount = poaps.filter(poap => isBase64Image(poap.imageUrl)).length;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">POAPs</h1>
        <Link href="/poaps/create">
          <Button>Create POAP</Button>
        </Link>
      </div>

      {/* Display base64 warning if needed */}
      <Base64Warning count={base64ImageCount} />

      {poaps.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {poaps.map(poap => (
            <POAPCard key={poap.id} poap={poap} />
          ))}
        </div>
      )}
    </div>
  );
}
