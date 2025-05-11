'use client';

import { useEffect } from 'react';
import { POAPForm } from './POAPForm';
import { usePageTitle } from '@/contexts/page-title-context';

export function CreatePOAP() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Create POAP');
    
    return () => {
      setPageTitle('');
    };
  }, [setPageTitle]);

  return (
    <POAPForm
      mode="create"
      onSuccess={data => {
        // You can customize success behavior here
        window.location.href = '/poaps';
      }}
    />
  );
}
