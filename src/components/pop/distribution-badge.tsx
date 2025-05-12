'use client';

import {
  Link2,
  LockKeyhole,
  MapPin,
  HelpCircle,
  Plane,
  KeyRound,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DistributionMethod, DistributionType } from '@/types/pop';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DistributionBadgeProps {
  type: DistributionType;
  method?: DistributionMethod; // Full method data for counts
  className?: string;
}

export function DistributionBadge({ type, method, className }: DistributionBadgeProps) {
  // Calculate counts and format display text
  const getCountInfo = () => {
    if (!method) return null;

    switch (type) {
      case 'ClaimLinks':
        if (!method.claimLinks?.length) return null;
        const total = method.claimLinks.length;
        const claimed = method.claimLinks.filter(link => link.claimed).length;
        return `${claimed}/${total}`;

      case 'SecretWord':
        if (!method.secretWord) return null;
        const swClaims = method.secretWord.claimCount;
        const swMax = method.secretWord.maxClaims;
        return swMax ? `${swClaims}/${swMax}` : `${swClaims}`;

      case 'LocationBased':
        if (!method.locationBased) return null;
        const lbClaims = method.locationBased.claimCount;
        const lbMax = method.locationBased.maxClaims;
        return lbMax ? `${lbClaims}/${lbMax}` : `${lbClaims}`;

      default:
        return null;
    }
  };

  const countInfo = getCountInfo();

  const getTypeInfo = (type: DistributionType) => {
    switch (type) {
      case 'ClaimLinks':
        return {
          icon: <Link2 className="h-3.5 w-3.5" />,
          label: 'Claim Links',
          color: 'border-blue-100 text-blue-900 bg-blue-50',
          description: method?.claimLinks?.length
            ? `${method.claimLinks.length} unique claim links${countInfo ? `, ${method.claimLinks.filter(l => l.claimed).length} claimed` : ''}`
            : 'Distributed via unique claim links',
        };
      case 'SecretWord':
        return {
          icon: <KeyRound className="h-3.5 w-3.5" />,
          label: 'Secret Word',
          color: 'border-green-100 text-green-900 bg-green-50',
          description: method?.secretWord
            ? `${method.secretWord.claimCount} claims${method.secretWord.maxClaims ? ` out of max ${method.secretWord.maxClaims}` : ''}`
            : 'Claimed using a secret word',
        };
      case 'LocationBased':
        return {
          icon: <MapPin className="h-3.5 w-3.5" />,
          label: 'Location',
          color: 'border-orange-100 text-orange-900 bg-orange-50',
          description: method?.locationBased
            ? `${method.locationBased.city}: ${method.locationBased.claimCount} claims${method.locationBased.maxClaims ? ` out of max ${method.locationBased.maxClaims}` : ''}`
            : 'Available at a specific location',
        };
      case 'Airdrop':
        return {
          icon: <Plane className="h-3.5 w-3.5" />,
          label: 'Airdrop',
          color: 'border-purple-100 text-purple-900 bg-purple-50',
          description: method?.airdrop
            ? `${method.airdrop.addresses?.length || 0} addresses${method.airdrop.maxClaims ? `, ${method.airdrop.claimCount} of ${method.airdrop.maxClaims} claimed` : ''}`
            : 'Direct distribution to wallet addresses',
        };
      default:
        return {
          icon: <Coins className="h-3.5 w-3.5" />,
          label: 'Unknown',
          color: 'border-neutral-100 text-neutral-900 bg-neutral-50',
          description: 'Other distribution method',
        };
    }
  };

  const typeInfo = getTypeInfo(type);

  // Handle click to prevent it from propagating to parent elements
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 border rounded-full px-2 py-0.5 text-xs font-medium',
              typeInfo.color,
              className
            )}
            onClick={handleClick}
          >
            {typeInfo.icon}
            <span>{typeInfo.label}</span>
            {countInfo && (
              <span className="ml-1 bg-white/40 rounded-full px-1 py-0.25 text-xs font-semibold">
                {countInfo}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{typeInfo.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
