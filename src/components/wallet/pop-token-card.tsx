'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Coins, Database } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSafeImageUrl } from '@/lib/pop-utils';

export interface POPTokenProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  mintAddress?: string;
  amount?: number;
  transactionSignature?: string;
  createdAt?: string;
  source?: 'database';
  isCompressed?: boolean;
}

export function POPTokenCard({
  id,
  title,
  description,
  imageUrl,
  mintAddress,
  amount = 0,
  transactionSignature,
  createdAt,
  isCompressed = false,
}: POPTokenProps) {
  const [imgError, setImgError] = useState(false);
  const safeImageUrl = getSafeImageUrl(imageUrl);

  return (
    <Card
      key={id}
      className="overflow-hidden hover:shadow-md transition-shadow border-blue-200 flex flex-col h-full"
    >
      <div className="aspect-square relative">
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <Coins className="h-16 w-16 text-neutral-300" />
          </div>
        ) : (
          <Image
            src={safeImageUrl}
            alt={title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="flex flex-col flex-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Database className="h-4 w-4 text-blue-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <p className="font-medium">POPToken</p>
                    <p className="text-xs text-neutral-500">
                      {isCompressed ? 'Compressed Token2022 POP' : 'Standard POPToken'}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="pb-2 flex-1">
          <p className="text-sm text-neutral-600 line-clamp-2">{description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
        <CardContent className="pb-2 flex-1">
        <CardContent className="pb-2 flex-1">w
            {amount > 1 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {`${amount}x`}
              </Badge>
            )}
            {amount > 1 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {`${amount}x`}
              </Badge>
            )}
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              cPOP
              </Badge>
            )}
            {amount > 1 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {`${amount}x`}
              </Badge>
            )}
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              cPOP
            </Badge>
            {isCompressed && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Compressed
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center border-t pt-3 text-xs text-neutral-500 mt-auto">
          <span>{createdAt ? new Date(createdAt).toLocaleDateString() : 'In Wallet'}</span>
          {transactionSignature && (
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <a
                href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet'}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View on Solana Explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          {mintAddress && !transactionSignature && (
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <a
                href={`https://explorer.solana.com/address/${mintAddress}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet'}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View Token on Solana Explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}
