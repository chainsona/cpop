'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showPasswordByDefault?: boolean;
  iconSize?: number;
}

export function PasswordInput({
  className,
  showPasswordByDefault = false,
  iconSize = 16,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(showPasswordByDefault);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        className={cn("pr-10", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
        onClick={togglePasswordVisibility}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-neutral-500" style={{ height: iconSize, width: iconSize }} />
        ) : (
          <Eye className="h-4 w-4 text-neutral-500" style={{ height: iconSize, width: iconSize }} />
        )}
      </Button>
    </div>
  );
} 