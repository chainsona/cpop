import { Metadata, Viewport } from 'next';
import { generateMetadata, generateViewport } from '@/lib/utils/metadata';

export const metadata: Metadata = generateMetadata(
  'Explorer',
  'Explore POPs from the community'
);

export const viewport: Viewport = generateViewport(); 