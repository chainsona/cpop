import { cn } from '@/lib/utils';
import { isBase64Image, getColorPaletteForId, getSafeImageUrl } from '@/lib/pop-utils';
import { StatusDisplay } from '@/types/pop';
import { StatusIcon } from './status-icon';

interface POPImageProps {
  id: string;
  imageUrl: string;
  title: string;
  statusDisplay?: StatusDisplay;
  isCreator?: boolean;
}

export function POPImage({ id, imageUrl, title, statusDisplay, isCreator = false }: POPImageProps) {
  // Get a unique color palette for this POP based on its ID
  const colorPalette = getColorPaletteForId(id);
  const safeImageUrl = getSafeImageUrl(imageUrl);

  return (
    <div
      className="relative w-full md:w-48 lg:w-56 aspect-square flex-shrink-0 overflow-hidden rounded-lg"
      aria-label={`POP image for ${title}`}
    >
      {/* Status badge - only render if statusDisplay is defined and user is creator */}
      {statusDisplay && isCreator && (
        <div
          className={cn(
            'absolute top-2 left-2 z-20 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5',
            statusDisplay.bgColor,
            statusDisplay.color,
            statusDisplay.borderColor,
            'border'
          )}
        >
          <StatusIcon iconName={statusDisplay.iconName} />
          {statusDisplay.label}
        </div>
      )}

      {/* Color background with custom Tailwind gradients */}
      <div className={cn('absolute inset-0 opacity-30', colorPalette.gradient)}></div>

      {/* Perfect square-fitted image display */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <img
          src={safeImageUrl}
          alt={`POP image: ${title}`}
          className="max-w-full max-h-full w-auto h-auto object-contain"
          loading="lazy"
        />
      </div>

      {/* Add a subtle inner shadow for depth */}
      <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] rounded-lg pointer-events-none"></div>

    </div>
  );
}
