'use client';

import { useState, useEffect } from 'react';

// User storage key
const USER_STORAGE_KEY = 'userProfile';

// Default user as fallback
const DEFAULT_USER = {
  name: 'Guest User',
  email: 'guest@example.com',
  walletAddress: '0x000...000',
  avatarUrl: '',
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(DEFAULT_USER);

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
  const handleLogout = (callback?: () => void) => {
    // Clear any auth state and localStorage
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('solana_auth_token');
    setUser(DEFAULT_USER);
    setIsAuthenticated(false);

    // Execute callback if provided
    if (callback) callback();
  };

  return {
    isAuthenticated,
    user,
    handleLogout
  };
} 