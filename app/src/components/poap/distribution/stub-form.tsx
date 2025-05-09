'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

// This is a stub component to use temporarily until real implementations are ready
interface StubFormProps {
  id: string;
  title: string;
  description: string;
}

export function StubForm({ id, title, description }: StubFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-neutral-600">{description}</p>
      </div>

      <div className="bg-neutral-50 p-4 rounded-md">
        <p className="text-center text-neutral-600 py-8">Form implementation in progress</p>
      </div>

      <div className="flex justify-end">
        <Button>Save</Button>
      </div>
    </div>
  );
}

// Export stubs for each type of form
export function ClaimLinksForm({ id }: { id: string }) {
  return (
    <StubForm
      id={id}
      title="Create Claim Links"
      description="Generate unique links that can be distributed to recipients to claim the POAP."
    />
  );
}

export function SecretWordForm({ id }: { id: string }) {
  return (
    <StubForm
      id={id}
      title="Set Secret Word"
      description="Create a secret word that recipients must enter to claim the POAP."
    />
  );
}

export function LocationBasedForm({ id }: { id: string }) {
  return (
    <StubForm
      id={id}
      title="Location-based Claim"
      description="Set up location-based claiming for your POAP."
    />
  );
}
