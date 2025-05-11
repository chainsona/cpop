'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  // Calculate password strength
  const calculateStrength = (input: string): { score: number; label: string } => {
    if (!input) return { score: 0, label: 'None' };
    
    let score = 0;
    
    // Length check
    if (input.length >= 8) score += 1;
    if (input.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(input)) score += 1; // Has uppercase
    if (/[a-z]/.test(input)) score += 1; // Has lowercase
    if (/[0-9]/.test(input)) score += 1; // Has number
    if (/[^A-Za-z0-9]/.test(input)) score += 1; // Has special char
    
    // Word uniqueness - simple check for common words/patterns
    const commonPatterns = ['password', '123456', 'qwerty', 'admin', 'welcome', 'secret'];
    const lowerInput = input.toLowerCase();
    const hasCommonPattern = commonPatterns.some(pattern => lowerInput.includes(pattern));
    if (!hasCommonPattern) score += 1;
    
    // Map score to label
    let label = 'Weak';
    if (score >= 6) label = 'Strong';
    else if (score >= 4) label = 'Good';
    else if (score >= 2) label = 'Fair';
    
    // Cap score at 5 for the progress bar
    return { score: Math.min(score, 5), label };
  };

  const { score, label } = calculateStrength(password);
  
  // Determine color based on score
  const getColorClass = () => {
    if (score === 0) return 'bg-neutral-200'; // Empty
    if (score <= 2) return 'bg-red-500'; // Weak
    if (score <= 3) return 'bg-yellow-500'; // Fair
    if (score <= 4) return 'bg-emerald-500'; // Good
    return 'bg-green-600'; // Strong
  };

  // Skip rendering if password is empty
  if (!password) return null;

  return (
    <div className={cn("mt-2", className)}>
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs text-neutral-600">Password strength</div>
        <div className="text-xs font-medium" style={{ color: score === 0 ? '#9ca3af' : score <= 2 ? '#ef4444' : score <= 3 ? '#eab308' : score <= 4 ? '#10b981' : '#16a34a' }}>
          {label}
        </div>
      </div>
      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-300", getColorClass())}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
    </div>
  );
} 