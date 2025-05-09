import { cn } from '@/lib/utils';
import { isBase64Image, getColorPaletteForId } from '@/lib/poap-utils';
import { StatusDisplay } from '@/types/poap';
import { StatusIcon } from './status-icon';

interface POAPImageProps {
  id: string;
  imageUrl: string;
  title: string;
  statusDisplay: StatusDisplay;
}

export function POAPImage({ id, imageUrl, title, statusDisplay }: POAPImageProps) {
  // Get a unique color palette for this POAP based on its ID
  const colorPalette = getColorPaletteForId(id);

  return (
    <div
      className="relative w-full md:w-48 lg:w-56 aspect-square flex-shrink-0 overflow-hidden rounded-lg"
      aria-label={`POAP image for ${title}`}
    >
      {/* Status badge */}
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

      {/* Color background with custom Tailwind gradients */}
      <div className={cn('absolute inset-0 opacity-30', colorPalette.gradient)}></div>

      {/* Perfect square-fitted image display */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <img
          src={imageUrl}
          alt={`POAP image: ${title}`}
          className="max-w-full max-h-full w-auto h-auto object-contain"
          loading="lazy"
        />
      </div>

      {/* Add a subtle inner shadow for depth */}
      <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] rounded-lg pointer-events-none"></div>

      {isBase64Image(imageUrl) && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md z-10">
          Base64
        </div>
      )}
    </div>
  );
}
