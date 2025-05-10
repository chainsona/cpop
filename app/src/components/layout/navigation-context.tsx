'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getOperatingSystem } from './navigation-menu';

type NavigationContextType = {
  isNavigationOpen: boolean;
  openNavigation: () => void;
  closeNavigation: () => void;
  toggleNavigation: () => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  const openNavigation = () => setIsNavigationOpen(true);
  const closeNavigation = () => setIsNavigationOpen(false);
  const toggleNavigation = () => setIsNavigationOpen(prev => !prev);

  // Register the global keyboard shortcut at the application level
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const os = getOperatingSystem();
      const isModifierPressed =
        os === 'macos' || os === 'ios'
          ? e.metaKey // Command key for macOS/iOS
          : e.altKey; // Alt key for others

      if (isModifierPressed && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openNavigation();
      }
    };

    // Register the event listener at the window level
    window.addEventListener('keydown', handleKeyPress);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        isNavigationOpen,
        openNavigation,
        closeNavigation,
        toggleNavigation,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
