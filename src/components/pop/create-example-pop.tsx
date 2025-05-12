'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { fetchWithAuth } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Solana event titles
const EVENT_TITLES = [
  'Solana Breakpoint Hackathon',
  'Solana Summer Camp',
  'SOL DEX Conference',
  'Solana NFT Summit',
  'Solana DeFi Workshop',
  'SOL Developer Meetup',
  'Solana Ecosystem Expo',
  'Solana Governance Forum',
  'Solana Builders Happy Hour',
  'SOL Staking Masterclass',
  'Solana Mobile Conference',
  'Solana GameFi Tournament',
];

// Cities for events
const CITIES = [
  'San Francisco',
  'Miami',
  'New York',
  'London',
  'Singapore',
  'Berlin',
  'Tokyo',
  'Seoul',
  'Paris',
  'Lisbon',
  'Austin',
  'Dubai',
];

// Descriptions for events
const EVENT_DESCRIPTIONS = [
  'Join us for an intensive coding challenge building the future of Solana. Network with top builders and learn from industry experts.',
  'A workshop for developers and enthusiasts to explore the latest advancements in the Solana ecosystem and blockchain technology.',
  'Connect with fellow Solana developers, investors, and ecosystem partners in this exclusive networking event.',
  "A hands-on technical workshop exploring the performance and scalability advantages of Solana's blockchain architecture.",
  'Dive deep into the world of Solana NFTs, exploring marketplaces, token standards, and creator economy innovations.',
  "A comprehensive overview of Solana's DeFi landscape, featuring top protocols, yield opportunities, and market analysis.",
  "Bringing together Solana's brightest minds to discuss governance, tokenomics, and ecosystem development.",
  'Explore Solana Mobile Stack and learn how to build the next generation of mobile dApps in this technical workshop.',
  'A gathering of Solana gaming enthusiasts to showcase new blockchain games, play-to-earn mechanics, and GameFi innovations.',
  'Uniting the Solana community to celebrate recent milestones and chart the path forward for the ecosystem.',
];

// Solana-themed placeholder images
const PLACEHOLDER_IMAGES = [
  'https://placehold.co/600x400/5f57ff/ffffff/png?text=Solana+Event',
  'https://placehold.co/600x400/03e1ff/000000/png?text=SOL+Conference',
  'https://placehold.co/600x400/000000/00ffbd/png?text=Solana+Ecosystem',
  'https://placehold.co/600x400/14f195/000000/png?text=Breakpoint',
  'https://placehold.co/600x400/dc1fff/ffffff/png?text=Solana+Hackathon',
];

// Potential website URLs for events
const WEBSITE_URLS = [
  'https://solana.com/events',
  'https://solana.org/hackathon',
  'https://breakpoint.solana.com',
  'https://solanabuilders.dev',
  'https://solanafoundation.org/events',
  'https://solanamobile.org',
  'https://solanacommunity.org',
  '', // Empty URL for cases where no website is provided
  '',
  '', // Multiple empty entries to increase probability of no website
];

// Visibility options
const VISIBILITY_OPTIONS = ['Public', 'Unlisted', 'Private'] as const;

export const CreateExamplePOP = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we're in development environment
    // We need to check in useEffect because Next.js environments are not
    // available during server-side rendering for client components
    setShowButton(process.env.NODE_ENV === 'development');
  }, []);

  // Don't render anything if not in development mode
  if (!showButton) {
    return null;
  }

  // Get a random item from an array
  const getRandomItem = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  // Generate random integer between min and max (inclusive)
  const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Random boolean with specified probability of being true
  const randomChance = (probabilityOfTrue: number = 0.5): boolean => {
    return Math.random() < probabilityOfTrue;
  };

  const createExamplePOP = async () => {
    try {
      setIsLoading(true);

      // Generate yesterday's date for start date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // End date is randomly 1-3 days after start date
      const endDate = new Date(yesterday);
      endDate.setDate(endDate.getDate() + getRandomInt(1, 3));

      // Random city
      const city = getRandomItem(CITIES);

      // Random title with city
      const title = `${getRandomItem(EVENT_TITLES)} - ${city}`;

      // Random description
      const description = getRandomItem(EVENT_DESCRIPTIONS);

      // Random Solana-themed placeholder image
      const imageUrl = getRandomItem(PLACEHOLDER_IMAGES);

      // Create base POP object with required fields
      const examplePOP: Record<string, any> = {
        title,
        description,
        imageUrl,
        startDate: yesterday.toISOString(),
        endDate: endDate.toISOString(),
      };

      // Randomly decide whether to include optional fields

      // Website - 60% chance of including
      if (randomChance(0.6)) {
        examplePOP.website = getRandomItem(WEBSITE_URLS);
      }

      // Attendees - 70% chance of including
      if (randomChance(0.7)) {
        examplePOP.attendees = getRandomInt(50, 500);
      }

      // Settings - create with varied visibility and search options
      examplePOP.settings = {};

      // Randomly select visibility - weighted towards Public
      const visibilityRandom = Math.random();
      if (visibilityRandom < 0.9) {
        examplePOP.settings.visibility = 'Public';
      } else if (visibilityRandom < 0.95) {
        examplePOP.settings.visibility = 'Unlisted';
      } else {
        examplePOP.settings.visibility = 'Private';
      }

      // Allow search - 80% chance if not Private
      if (examplePOP.settings.visibility !== 'Private') {
        examplePOP.settings.allowSearch = randomChance(0.8);
      } else {
        examplePOP.settings.allowSearch = false;
      }

      // Random notifyOnClaim setting
      if (randomChance(0.5)) {
        examplePOP.settings.notifyOnClaim = randomChance(0.7);
      }

      const response = await fetchWithAuth('/api/pops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(examplePOP),
      });

      if (!response.ok) {
        throw new Error('Failed to create example POP');
      }

      const data = await response.json();
      router.refresh();
      router.push(`/pops/${data.pop.id}`);
    } catch (error) {
      console.error('Error creating example POP:', error);
      alert('Failed to create example POP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={createExamplePOP}
      variant="outline"
      className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-800"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Creating...
        </>
      ) : (
        'Create Example POP'
      )}
    </Button>
  );
};
