import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TokenData } from '../types';

interface ExternalLinksProps {
  token: TokenData | null;
}

export const ExternalLinks = ({ token }: ExternalLinksProps) => {
  if (!token) {
    return null;
  }

  const mintAddress = token.mintAddress;
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet';

  return (
    <Card>
      <CardHeader>
        <CardTitle>External Resources</CardTitle>
        <CardDescription>View your token on blockchain explorers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
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