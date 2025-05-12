'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AttributesRedirectPage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new metadata page
    router.replace(`/pops/${id}/metadata`);
  }, [id, router]);

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-neutral-600">Redirecting to metadata page...</p>
      </div>
    </div>
  );
}
