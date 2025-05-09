'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MethodCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  onClick: () => void;
}

export function MethodCard({ title, icon, description, onClick }: MethodCardProps) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left border border-neutral-200 rounded-xl p-6 bg-white hover:border-blue-200 hover:shadow-sm transition-all duration-150 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div
        className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-neutral-50')}
      >
        {icon}
      </div>
      <h3 className="font-medium text-lg mb-2">{title}</h3>
      <p className="text-neutral-600 text-sm">{description}</p>
    </button>
  );
}
