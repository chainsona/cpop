import { Viewport } from 'next';
import { generateViewport } from '@/lib/utils/metadata';

// The metadata for the root route is already defined in layout.tsx
// We only need to define the viewport here

export const viewport: Viewport = generateViewport(); 