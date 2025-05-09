import { Calendar, Hash } from 'lucide-react';
import { formatDateRange } from '@/lib/date-utils';

interface POAPMetadataProps {
  startDate: Date;
  endDate: Date;
  attendees: number | null;
}

export function POAPMetadata({ startDate, endDate, attendees }: POAPMetadataProps) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-600 mb-4">
      <span className="flex items-center gap-1.5">
        <Calendar className="h-4 w-4 text-blue-500" />
        <span>{formatDateRange(startDate, endDate)}</span>
      </span>

      {attendees && (
        <span className="flex items-center gap-1.5">
          <Hash className="h-4 w-4 text-emerald-500" />
          <span>Attendees: {attendees.toLocaleString()}</span>
        </span>
      )}
    </div>
  );
}
