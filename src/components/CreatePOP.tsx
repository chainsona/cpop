'use client';

import { useEffect } from 'react';
import { POPForm } from './POPForm';
import { usePageTitle } from '@/contexts/page-title-context';

export function CreatePOP() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Create POP');
    
    return () => {
      setPageTitle('');
    };
  }, [setPageTitle]);

  return (
    <POPForm
      mode="create"
      onSuccess={data => {
        // You can customize success behavior here
        window.location.href = '/pops';
      }}
    />
  );
}
