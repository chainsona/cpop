'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MetadataRedirect() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect from the metadata page to the token page
    router.replace(`/poaps/${id}/token`);
  }, [id, router]);

  // Return null as this component will never actually render
  return null;
} 