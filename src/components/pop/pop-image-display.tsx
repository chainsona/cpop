import { cn } from '@/lib/utils';
import { getColorPaletteForId, isBase64Image } from './color-palette';
import { getSafeImageUrl } from '@/lib/pop-utils';

interface POPImageDisplayProps {
  id: string;
  imageUrl: string;
  title: string;
  className?: string;
}

/**
 * Component for displaying a POP image with consistent styling
 * based on the POP ID
 */
export function POPImageDisplay({ id, imageUrl, title, className }: POPImageDisplayProps) {
  const palette = getColorPaletteForId(id);
  const safeImageUrl = getSafeImageUrl(imageUrl);

  return (
    <div
      className={cn(
        'relative rounded-xl border shadow-sm overflow-hidden',
        palette.background,
        className
      )}
    >
      <div
        className={cn('absolute inset-0 opacity-90 pointer-events-none', palette.gradient)}
      ></div>

      {isBase64Image(imageUrl) ? (
        <img src={safeImageUrl} alt={title} className="w-full aspect-square object-contain relative" />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center p-8 relative">
          <img src={safeImageUrl} alt={title} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}
