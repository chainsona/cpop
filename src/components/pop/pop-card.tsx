import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PopItem } from '@/types/pop';
import { StatusBadge } from '@/components/ui/status-badge';
import { POPImage } from './pop-image';
import { POPMetadata } from './pop-metadata';
import { POPActions } from './pop-actions';
import { getStatusDisplay } from '@/lib/pop-utils';
import { StatusIcon } from './status-icon';
import { DistributionBadge } from './distribution-badge';
import { useWalletContext } from '@/contexts/wallet-context';
import { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';
import { StatusDisplay } from '@/types/pop';

interface POPCardProps {
  pop: PopItem;
}

export function POPCard({ pop }: POPCardProps) {
  // Handle 'Disabled' status which isn't supported by the util function
  let statusDisplay;
  if (pop.status === 'Disabled') {
    statusDisplay = {
      label: 'Disabled',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      iconName: 'XCircle',
    };
  } else {
    statusDisplay = getStatusDisplay(pop.status as 'Draft' | 'Published' | 'Distributed' | 'Active');
  }

  const { isAuthenticated, walletAddress } = useWalletContext();
  const [isCreator, setIsCreator] = useState(false);

  // Filter to only show active (not disabled or deleted) distribution methods
  const activeDistributionMethods =
    pop.distributionMethods?.filter(method => !method.disabled && !method.deleted) || [];

  // Check if the current authenticated user is the creator
  useEffect(() => {
    if (pop.creator && isAuthenticated && walletAddress) {
      // Compare current wallet address with creator's wallet address
      setIsCreator(pop.creator.walletAddress === walletAddress);
    } else {
      setIsCreator(false);
    }
  }, [pop.creator, isAuthenticated, walletAddress]);

  return (
    <div
      key={pop.id}
      className="group relative bg-white rounded-xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-neutral-300 p-4 md:p-5 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2"
    >
      {/* Main clickable area */}
      <Link
        href={`/pops/${pop.id}`}
        className="absolute inset-0 z-10"
        aria-label={`View details for ${pop.title}`}
      >
        <span className="sr-only">View POP details</span>
      </Link>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 relative">
        {/* POP Image component */}
        <POPImage
          id={pop.id}
          imageUrl={pop.imageUrl}
          title={pop.title}
          statusDisplay={statusDisplay}
          isCreator={isCreator}
        />

        {/* Content Container */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
              <h2 className="text-xl font-semibold text-neutral-800 group-hover:text-neutral-900 transition-colors">
                {pop.title}
              </h2>
            </div>

            <p className="text-neutral-600 mb-3 line-clamp-3">{pop.description}</p>

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

            {/* POP Metadata component */}
            <POPMetadata
              startDate={pop.startDate}
              endDate={pop.endDate}
              attendees={pop.attendees}
            />
          </div>

          {/* POP Actions component */}
          <POPActions id={pop.id} title={pop.title} website={pop.website} creator={pop.creator} />
        </div>
      </div>
    </div>
  );
}
