import { Metadata, Viewport } from 'next';
import { generateMetadata, generateViewport } from '@/lib/utils/metadata';

export const metadata: Metadata = generateMetadata(
  'Cookie Policy',
  'Information about how we use cookies on our website'
);

export const viewport: Viewport = generateViewport(); 