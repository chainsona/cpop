'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface SecretWordDisplayProps {
  word: string;
  className?: string;
}

export function SecretWordDisplay({ word, className }: SecretWordDisplayProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <div className="flex items-center gap-2">
      <span className={className}>
        {isVisible ? word : '•'.repeat(Math.min(word.length, 12))}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={toggleVisibility}
        aria-label={isVisible ? 'Hide secret word' : 'Show secret word'}
      >
        {isVisible ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
} 