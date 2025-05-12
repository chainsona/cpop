import { Metadata, Viewport } from 'next';
import { generateMetadata, generateViewport } from '@/lib/utils/metadata';

export const metadata: Metadata = generateMetadata(
  'Terms of Service',
  'Terms and conditions for using our platform'
);

export const viewport: Viewport = generateViewport(); 