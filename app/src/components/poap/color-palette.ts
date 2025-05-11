// Color palettes - mapped to Tailwind config custom gradients
export const COLOR_PALETTES = [
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

/**
 * Get a color palette based on the ID to ensure consistency
 */
export function getColorPaletteForId(id: string): (typeof COLOR_PALETTES)[0] {
  // Use the last character of the ID as a simple hash
  const lastChar = id.slice(-1);
  const index = parseInt(lastChar, 16) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index >= 0 ? index : 0];
}

/**
 * Determine if an image URL is a base64 encoded image
 */
export function isBase64Image(url: string): boolean {
  return url.startsWith('data:image/');
}
