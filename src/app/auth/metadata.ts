import { Metadata, Viewport } from 'next';
import { generateMetadata, generateViewport } from '@/lib/utils/metadata';

export const metadata: Metadata = generateMetadata(
  'Authentication',
  'Authenticate with your Solana wallet to access protected areas'
);

export const viewport: Viewport = generateViewport(); 