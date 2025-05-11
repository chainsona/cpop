import { Metadata, Viewport } from 'next';
import { generateMetadata, generateViewport } from '@/lib/utils/metadata';

export const metadata: Metadata = generateMetadata(
  'Privacy Policy',
  'Our privacy policy and how we protect your data'
);

export const viewport: Viewport = generateViewport(); 