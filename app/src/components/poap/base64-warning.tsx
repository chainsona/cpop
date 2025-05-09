import { Info } from 'lucide-react';

interface Base64WarningProps {
  count: number;
}

export function Base64Warning({ count }: Base64WarningProps) {
  if (count <= 0) return null;

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 flex items-start gap-3">
      <Info className="h-5 w-5 flex-shrink-0 mt-1 text-yellow-600" />
      <div>
        <p className="text-sm font-medium">Storage Optimization Notice</p>
        <p className="text-xs mt-1">
          {count} POAP{count > 1 ? 's' : ''} {count > 1 ? 'are' : 'is'} using base64 encoded images,
          which may affect performance. Consider uploading images to a dedicated storage service for
          better performance.
        </p>
      </div>
    </div>
  );
}
