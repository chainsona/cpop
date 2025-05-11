import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PoapItem } from '@/types/poap';
import { StatusBadge } from '@/components/ui/status-badge';
import { POAPImage } from './poap-image';
import { POAPMetadata } from './poap-metadata';
import { POAPActions } from './poap-actions';
import { getStatusDisplay } from '@/lib/poap-utils';
import { StatusIcon } from './status-icon';
import { DistributionBadge } from './distribution-badge';

interface POAPCardProps {
  poap: PoapItem;
}

export function POAPCard({ poap }: POAPCardProps) {
  const statusDisplay = getStatusDisplay(poap.status);

  // Filter to only show active (not disabled or deleted) distribution methods
  const activeDistributionMethods =
    poap.distributionMethods?.filter(method => !method.disabled && !method.deleted) || [];

  return (
    <div
      key={poap.id}
      className="group relative bg-white rounded-xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-neutral-300 p-4 md:p-5 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2"
    >
      {/* Main clickable area */}
      <Link
        href={`/poaps/${poap.id}`}
        className="absolute inset-0 z-10"
        aria-label={`View details for ${poap.title}`}
      >
        <span className="sr-only">View POAP details</span>
      </Link>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 relative">
        {/* POAP Image component */}
        <POAPImage
          id={poap.id}
          imageUrl={poap.imageUrl}
          title={poap.title}
          statusDisplay={statusDisplay}
        />

        {/* Content Container */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
              <h2 className="text-xl font-semibold text-neutral-800 group-hover:text-neutral-900 transition-colors">
                {poap.title}
              </h2>
            </div>

            <p className="text-neutral-600 mb-3 line-clamp-3">{poap.description}</p>

            {/* Distribution method badges - show for all active methods */}
            {activeDistributionMethods.length > 0 && (
              <div className="flex gap-2 flex-wrap z-20 relative mb-3">
                {activeDistributionMethods.map(method => (
                  <div key={method.id}>
                    <DistributionBadge type={method.type} method={method} />
                  </div>
                ))}
              </div>
            )}

            {/* POAP Metadata component */}
            <POAPMetadata
              startDate={poap.startDate}
              endDate={poap.endDate}
              attendees={poap.attendees}
            />
          </div>

          {/* POAP Actions component */}
          <POAPActions id={poap.id} title={poap.title} website={poap.website} creator={poap.creator} />
        </div>
      </div>
    </div>
  );
}
