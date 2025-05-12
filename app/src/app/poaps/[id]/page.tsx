import { Suspense } from 'react';
import POAPDetailClientPage from './client-page';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function POAPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Perform a server-side data check to make sure the POAP exists
  // This helps with immediate error handling for missing POAPs
  try {
    const poap = await prisma.poap.findUnique({
      where: { id: (await params).id },
      select: { id: true, title: true },
    });

    if (!poap) {
      notFound();
    }

    return (
      <Suspense
        fallback={
          <div className="container mx-auto py-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading POAP details...</p>
            </div>
          </div>
        }
      >
        <POAPDetailClientPage id={(await params).id} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error loading POAP details:', error);
    notFound();
  }
}
