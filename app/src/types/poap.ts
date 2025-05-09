// Define POAP types and interfaces
import { ReactNode } from 'react';

export interface PoapItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  website: string | null;
  startDate: Date;
  endDate: Date;
  attendees: number | null;
  status: 'Draft' | 'Published' | 'Distributed' | 'Unclaimable';
  distributionMethods?: DistributionMethod[];
}

// Distribution methods for badges
export interface DistributionMethod {
  id: string;
  type: DistributionType;
  disabled: boolean;
  deleted: boolean;
  // Include additional relationship data
  claimLinks?: ClaimLink[];
  secretWord?: SecretWord;
  locationBased?: LocationBased;
}

// ClaimLink type
export interface ClaimLink {
  id: string;
  claimed: boolean;
}

// SecretWord type
export interface SecretWord {
  claimCount: number;
  maxClaims: number | null;
}

// LocationBased type
export interface LocationBased {
  claimCount: number;
  maxClaims: number | null;
  city: string;
}

export type DistributionType = 'ClaimLinks' | 'SecretWord' | 'LocationBased';

// Status display information
export interface StatusDisplay {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
}

// Color palette for POAP cards
export interface ColorPalette {
  background: string;
  gradient: string;
}
