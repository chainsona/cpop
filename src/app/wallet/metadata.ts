import { Metadata, Viewport } from 'next';
import { generateMetadata, generateViewport } from '@/lib/utils/metadata';

export const metadata: Metadata = generateMetadata(
  'My Wallet',
  'Manage your wallet and connected assets'
);

export const viewport: Viewport = generateViewport(); 