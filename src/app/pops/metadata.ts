import { Metadata, Viewport } from 'next';
import { generateMetadata, generateViewport } from '@/lib/utils/metadata';

export const metadata: Metadata = generateMetadata(
  'My POPs',
  'Browse and manage your Proof of Participation Protocol tokens'
);

export const viewport: Viewport = generateViewport(); 