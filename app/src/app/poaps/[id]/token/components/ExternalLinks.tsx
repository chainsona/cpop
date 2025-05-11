import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TokenData } from '../types';
import { copyToClipboard } from '../utils';
import { toast } from 'sonner';

interface ExternalLinksProps {
  token: TokenData | null;
}

export const ExternalLinks = ({ token }: ExternalLinksProps) => {
  if (!token) {
    return null;
  }

  const mintAddress = token.mintAddress;
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet';

  const handleCopy = () => {
    copyToClipboard(mintAddress);
    toast.success('Address copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>External Resources</CardTitle>
        <CardDescription>View your token on blockchain explorers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-md mb-3">
            <div className="flex flex-col">
              <span className="text-sm text-neutral-500 mb-1">Token Address</span>
              <code className="text-xs bg-neutral-100 p-1 rounded text-neutral-700 overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]">
                {mintAddress}
              </code>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="p-1 h-8" onClick={handleCopy} title="Copy to clipboard">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
            <span className="text-purple-700 font-medium">View on Solana Explorer</span>
            <Link href={`https://explorer.solana.com/address/${mintAddress}?cluster=${cluster}`} target="_blank">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ExternalLink className="h-4 w-4" />
                Open
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 