import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InteractiveExternalLink, InteractiveEditLink } from '@/components/ui/interactive-link';
import { useWalletContext } from '@/contexts/wallet-context';
import { useEffect, useState } from 'react';

interface POAPActionsProps {
  id: string;
  title: string;
  website: string | null;
  creator?: {
    id: string;
    name: string | null;
    walletAddress: string | null;
  } | null;
}

export function POAPActions({ id, title, website, creator }: POAPActionsProps) {
  const { isAuthenticated, walletAddress } = useWalletContext();
  const [isCreator, setIsCreator] = useState(false);

  // Check if the current authenticated user is the creator
  useEffect(() => {
    if (creator && isAuthenticated && walletAddress) {
      // Compare current wallet address with creator's wallet address
      setIsCreator(creator.walletAddress === walletAddress);
    } else {
      setIsCreator(false);
    }
  }, [creator, isAuthenticated, walletAddress]);

  return (
    <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-100 relative z-20">
      {website ? (
        <InteractiveExternalLink
          href={website}
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 outline-none focus:underline group-focus:underline transition-all relative z-20"
          ariaLabel={`Visit website for ${title}`}
        >
          Visit website
        </InteractiveExternalLink>
      ) : (
        <span className="text-sm text-neutral-400">No website</span>
      )}

      <div className="flex gap-2 relative z-20">
        {isCreator && (
          <InteractiveEditLink
            href={`/poaps/${id}/edit`}
            ariaLabel={`Edit ${title}`}
            className="relative z-20"
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </InteractiveEditLink>
        )}
      </div>
    </div>
  );
}
