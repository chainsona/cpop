'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// User storage key
const USER_STORAGE_KEY = 'userProfile';

// Default user as fallback
const DEFAULT_USER = {
  name: 'Guest User',
  email: 'guest@example.com',
  walletAddress: '11111111111111111111111111111111',
  avatarUrl: '',
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(DEFAULT_USER);
  const router = useRouter();

  // Check authentication status on client-side
  useEffect(() => {
    try {
      const authToken = localStorage.getItem('solana_auth_token');
      setIsAuthenticated(!!authToken);
    } catch (err) {
      console.error('Error accessing localStorage:', err);
      setIsAuthenticated(false);
    }
  }, []);

  // Load user data from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // If no user exists in storage, set the default user
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
      }
    } catch (err) {
      console.error('Error loading user data from localStorage:', err);
    }
  }, []);

  // Logout function
  const handleLogout = useCallback(async (callback?: () => void) => {
    try {
      // First, clear localStorage items
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem('solana_auth_token');
      
      // Clear the cookie used by middleware
      try {
        const { deleteCookie } = await import('cookies-next');
        deleteCookie('solana_auth_token');
      } catch (cookieError) {
        console.error('Error clearing auth cookie:', cookieError);
      }
      
      // Update local state
      setUser(DEFAULT_USER);
      setIsAuthenticated(false);
      
      toast.success('Successfully logged out');

      // Execute callback if provided (like closing the menu)
      if (callback) {
        callback();
      }
      
      // Redirect to home page after logout
      // Make sure to use window.location for a full page refresh to clear any remaining state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out completely');
    }
  }, []);

  return {
    isAuthenticated,
    user,
    handleLogout
  };
} 