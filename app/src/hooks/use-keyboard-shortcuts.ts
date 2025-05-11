'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseKeyboardShortcutsProps {
  os: string;
  isOpen: boolean;
  onClose?: () => void;
}

export function useKeyboardShortcuts({ os, isOpen, onClose }: UseKeyboardShortcutsProps) {
  const router = useRouter();

  // Handle escape key to close dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (onClose) onClose();
    }
  };

  // Add keyboard shortcut handler for navigation when menu is open
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return;

    const handleInternalKeyPress = (e: KeyboardEvent) => {
      // Detect the correct modifier key based on OS
      const isModifierPressed =
        os === 'macos' || os === 'ios'
          ? e.metaKey // Command key for macOS/iOS
          : e.altKey; // Alt key for others

      if (isModifierPressed) {
        if (e.key === 'c') {
          // Create new POAP
          e.preventDefault();
          router.push('/poaps/create');
          if (onClose) onClose();
        } else if (e.key === 'h') {
          // Home
          e.preventDefault();
          router.push('/');
          if (onClose) onClose();
        } else if (e.key === 'e') {
          // Explorer
          e.preventDefault();
          router.push('/explorer');
          if (onClose) onClose();
        } else if (e.key === 'l') {
          // Wallet
          e.preventDefault();
          router.push('/wallet');
          if (onClose) onClose();
        } else if (e.key === 'p') {
          // POAPs
          e.preventDefault();
          router.push('/poaps');
          if (onClose) onClose();
        }
      }
    };

    window.addEventListener('keydown', handleInternalKeyPress);
    return () => window.removeEventListener('keydown', handleInternalKeyPress);
  }, [isOpen, onClose, router, os]);

  return {
    handleKeyDown
  };
} 