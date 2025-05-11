import { Metadata, Viewport } from 'next';
import { generateMetadata, generateViewport } from '@/lib/utils/metadata';

export const metadata: Metadata = generateMetadata(
  'My POAPs',
  'Browse and manage your Proof of Attendance Protocol tokens'
);

export const viewport: Viewport = generateViewport(); 