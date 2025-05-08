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
  supply: number | null;
  status: 'Draft' | 'Published' | 'Distributed';
}

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