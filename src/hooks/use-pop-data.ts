'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { POP } from '@/types/pop';
import { useAuth } from '@/hooks/use-auth';

export interface UsePopDataProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function usePopData({ isOpen, onClose }: UsePopDataProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [pops, setPops] = useState<POP[]>([]);
  const [recentPops, setRecentPops] = useState<POP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPopTitle, setCurrentPopTitle] = useState<string | null>(null);

  // Fetch POPs from the API
  useEffect(() => {
    const fetchPops = async () => {
      try {
        setIsLoading(true);
        // Use public endpoint when user is not authenticated
        const endpoint = isAuthenticated ? '/api/pops' : '/api/pops/public';
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`Failed to fetch POPs: ${response.status}`);
        }

        const data = await response.json();
        setPops(data.pops || []);
      } catch (err) {
        console.error('Error fetching POPs:', err);
        setError('Failed to load POPs');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchPops();
      loadRecentPopsFromStorage();
    }
  }, [isOpen, isAuthenticated]);

  // Load recent POPs from localStorage
  const loadRecentPopsFromStorage = () => {
    try {
      const storedRecentPops = localStorage.getItem('recentPops');
      if (storedRecentPops) {
        setRecentPops(JSON.parse(storedRecentPops));
      }
    } catch (err) {
      console.error('Error loading recent POPs from localStorage:', err);
      // If there's an error, initialize with empty array
      setRecentPops([]);
    }
  };

  // Save to recent POPs when navigating to a POP
  const navigateToPOP = (pop: POP) => {
    try {
      // Add to recent POPs and deduplicate
      const updatedRecentPops = [pop, ...recentPops.filter(p => p.id !== pop.id)].slice(0, 5);
      localStorage.setItem('recentPops', JSON.stringify(updatedRecentPops));
      setRecentPops(updatedRecentPops);

      // Navigate to the POP
      router.push(`/pops/${pop.id}`);
      if (onClose) onClose();
    } catch (err) {
      console.error('Error saving recent POPs to localStorage:', err);
    }
  };

  // Filter POPs based on search query
  const filteredPops =
    searchQuery.trim() === ''
      ? pops
      : pops.filter(pop => pop.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Check if we're on a POP detail page
  useEffect(() => {
    // Reset the current POP title
    setCurrentPopTitle(null);

    // Check if we're on a POP detail page
    const popMatch = pathname.match(/\/pops\/([^\/]+)/);
    if (popMatch && popMatch[1]) {
      const popId = popMatch[1];

      // First check recent POPs
      const recentPop = recentPops.find(p => p.id === popId);
      if (recentPop) {
        setCurrentPopTitle(recentPop.title);
        return;
      }

      // Then check all POPs
      const foundPop = pops.find(p => p.id === popId);
      if (foundPop) {
        setCurrentPopTitle(foundPop.title);
        return;
      }

      // If not found locally but we're on a POP page, fetch the specific POP
      const fetchSinglePop = async () => {
        try {
          // Use appropriate endpoint based on authentication status
          const endpoint = isAuthenticated 
            ? `/api/pops/${popId}` 
            : `/api/pops/${popId}/public`;
            
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            if (data.pop?.title) {
              setCurrentPopTitle(data.pop.title);
            }
          }
        } catch (err) {
          console.error('Error fetching POP details:', err);
        }
      };

      fetchSinglePop();
    }
  }, [pathname, pops, recentPops, isOpen, isAuthenticated]);

  return {
    searchQuery,
    setSearchQuery,
    pops,
    recentPops,
    filteredPops,
    isLoading,
    error,
    currentPopTitle,
    navigateToPOP
  };
} 