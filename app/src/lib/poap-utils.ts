import type { StatusDisplay, ColorPalette } from '@/types/poap';

// Determine image type (external URL or base64)
export function isBase64Image(url: string): boolean {
  return url.startsWith('data:image/');
}

// Get a truncated version of the base64 image for display purposes
export function getTruncatedImageInfo(imageUrl: string): string {
  if (!isBase64Image(imageUrl)) return 'External URL';

  const size = (imageUrl.length * 3) / 4 / 1024; // Size in KB
  return `Base64 Image (${size.toFixed(0)}KB)`;
}

// Color palettes - mapped to Tailwind config custom gradients
export const COLOR_PALETTES: ColorPalette[] = [
  {
    background: 'bg-blue-50',
    gradient: 'bg-blue-radial',
  },
  {
    background: 'bg-purple-50',
    gradient: 'bg-purple-radial',
  },
  {
    background: 'bg-green-50',
    gradient: 'bg-green-radial',
  },
  {
    background: 'bg-orange-50',
    gradient: 'bg-orange-radial',
  },
  {
    background: 'bg-pink-50',
    gradient: 'bg-pink-radial',
  },
];

// Get a color palette based on the ID to ensure consistency
export function getColorPaletteForId(id: string): ColorPalette {
  // Use the last character of the ID as a simple hash
  const lastChar = id.slice(-1);
  const index = parseInt(lastChar, 16) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index >= 0 ? index : 0];
}

// Get status display information without JSX
export function getStatusDisplay(status: 'Draft' | 'Published' | 'Distributed'): Omit<StatusDisplay, 'icon'> & { iconName: string } {
  switch (status) {
    case 'Draft':
      return {
        label: 'Draft',
        color: 'text-neutral-600',
        bgColor: 'bg-neutral-100',
        borderColor: 'border-neutral-200',
        iconName: 'FilePenLine',
      };
    case 'Published':
      return {
        label: 'Published',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        iconName: 'BookOpen',
      };
    case 'Distributed':
      return {
        label: 'Distributed',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        iconName: 'Award',
      };
  }
} 