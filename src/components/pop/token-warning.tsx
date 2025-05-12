import Link from 'next/link';
import { AlertTriangle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TokenWarningProps {
  popId: string;
}

/**
 * Warning component for POPs without minted tokens
 */
export function TokenWarning({ popId }: TokenWarningProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start mb-6">
      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-medium text-amber-800 mb-1">No tokens minted yet</h3>
        <p className="text-amber-700 text-sm mb-3">
          This POP doesn't have any compressed tokens minted yet. Start by creating a distribution
          method to automatically mint tokens for your participants.
        </p>
        <Link href={`/pops/${popId}/distribution`}>
          <Button size="sm" variant="outline" className="bg-white gap-1.5">
            <Coins className="h-4 w-4" />
            Create Distribution Method
          </Button>
        </Link>
      </div>
    </div>
  );
}
