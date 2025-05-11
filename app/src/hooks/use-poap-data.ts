'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { POAP } from '@/types/poap';

export interface UsePoapDataProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function usePoapData({ isOpen, onClose }: UsePoapDataProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [poaps, setPoaps] = useState<POAP[]>([]);
  const [recentPoaps, setRecentPoaps] = useState<POAP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPoapTitle, setCurrentPoapTitle] = useState<string | null>(null);

  // Fetch POAPs from the API
  useEffect(() => {
    const fetchPoaps = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/poaps');

        if (!response.ok) {
          throw new Error('Failed to fetch POAPs');
        }

        const data = await response.json();
        setPoaps(data.poaps || []);
      } catch (err) {
        console.error('Error fetching POAPs:', err);
        setError('Failed to load POAPs');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchPoaps();
      loadRecentPoapsFromStorage();
    }
  }, [isOpen]);

  // Load recent POAPs from localStorage
  const loadRecentPoapsFromStorage = () => {
    try {
      const storedRecentPoaps = localStorage.getItem('recentPoaps');
      if (storedRecentPoaps) {
        setRecentPoaps(JSON.parse(storedRecentPoaps));
      }
    } catch (err) {
      console.error('Error loading recent POAPs from localStorage:', err);
      // If there's an error, initialize with empty array
      setRecentPoaps([]);
    }
  };

  // Save to recent POAPs when navigating to a POAP
  const navigateToPOAP = (poap: POAP) => {
    try {
      // Add to recent POAPs and deduplicate
      const updatedRecentPoaps = [poap, ...recentPoaps.filter(p => p.id !== poap.id)].slice(0, 5);
      localStorage.setItem('recentPoaps', JSON.stringify(updatedRecentPoaps));
      setRecentPoaps(updatedRecentPoaps);

      // Navigate to the POAP
      router.push(`/poaps/${poap.id}`);
      if (onClose) onClose();
    } catch (err) {
      console.error('Error saving recent POAPs to localStorage:', err);
    }
  };

  // Filter POAPs based on search query
  const filteredPoaps =
    searchQuery.trim() === ''
      ? poaps
      : poaps.filter(poap => poap.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Check if we're on a POAP detail page
  useEffect(() => {
    // Reset the current POAP title
    setCurrentPoapTitle(null);

    // Check if we're on a POAP detail page
    const poapMatch = pathname.match(/\/poaps\/([^\/]+)/);
    if (poapMatch && poapMatch[1]) {
      const poapId = poapMatch[1];

      // First check recent POAPs
      const recentPoap = recentPoaps.find(p => p.id === poapId);
      if (recentPoap) {
        setCurrentPoapTitle(recentPoap.title);
        return;
      }

      // Then check all POAPs
      const foundPoap = poaps.find(p => p.id === poapId);
      if (foundPoap) {
        setCurrentPoapTitle(foundPoap.title);
        return;
      }

      // If not found locally but we're on a POAP page, fetch the specific POAP
      const fetchSinglePoap = async () => {
        try {
          const response = await fetch(`/api/poaps/${poapId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.poap?.title) {
              setCurrentPoapTitle(data.poap.title);
            }
          }
        } catch (err) {
          console.error('Error fetching POAP details:', err);
        }
      };

      fetchSinglePoap();
    }
  }, [pathname, poaps, recentPoaps, isOpen]);

  return {
    searchQuery,
    setSearchQuery,
    poaps,
    recentPoaps,
    filteredPoaps,
    isLoading,
    error,
    currentPoapTitle,
    navigateToPOAP
  };
} 