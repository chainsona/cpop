'use client';

import { POAPForm } from './POAPForm';

export function CreatePOAP() {
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
