import { Coins, RefreshCcw, Copy, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import { formatNumber, copyToClipboard } from '../utils';
import { TokenData, BlockchainTokenData } from '../types';

interface TokenOverviewProps {
  token: TokenData | null;
  tokenSupply: number;
  blockchainData: BlockchainTokenData | null;
  isBlockchainLoading: boolean;
  blockchainError: string | null;
  fetchBlockchainTokenData: () => Promise<void>;
}

export const TokenOverview = ({
  token,
  tokenSupply,
  blockchainData,
  isBlockchainLoading,
  blockchainError,
  fetchBlockchainTokenData,
}: TokenOverviewProps) => {
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Coins className="h-5 w-5 text-blue-500 mr-2" />
          Token Overview
        </CardTitle>
        <CardDescription>Information about your POP's compressed token</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Supply Status</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                <span className="text-blue-700 font-medium">Total Supply</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-700">
                  {formatNumber(blockchainData?.tokenSupply || tokenSupply)}
                </Badge>
              </div>

              {token && (
                <>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                    <span className="text-green-700 font-medium">Available Tokens</span>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {isBlockchainLoading ? (
                        <RefreshCcw className="h-3 w-3 animate-spin text-neutral-400" />
                      ) : blockchainError ? (
                        <span title={blockchainError}>{formatNumber(token.available || 0)}*</span>
                      ) : (
                        formatNumber(blockchainData?.authorityBalance || token.available || 0)
                      )}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-md">
                    <span className="text-purple-700 font-medium">Distributed Tokens</span>
                    <Badge variant="outline" className="bg-purple-100 text-purple-700">
                      {isBlockchainLoading ? (
                        <RefreshCcw className="h-3 w-3 animate-spin text-neutral-400" />
                      ) : blockchainError ? (
                        <span title={blockchainError}>{formatNumber(token.available || 0)}*</span>
                      ) : (
                        formatNumber(blockchainData?.distributedTokens || 0)
                      )}
                    </Badge>
                  </div>

                  {blockchainError && (
                    <div className="mt-2 text-xs text-amber-600 flex items-center justify-between p-2 bg-amber-50 rounded-md">
                      <span>* Using estimated values from database</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-xs"
                        onClick={fetchBlockchainTokenData}
                        disabled={isBlockchainLoading}
                      >
                        {isBlockchainLoading ? 'Loading...' : 'Retry blockchain fetch'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {token && (
            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-2">Token Information</h3>
              <div className="space-y-2">
                <div className="p-3 bg-neutral-50 rounded-md">
                  <p className="text-sm text-neutral-500 mb-1">Mint Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-neutral-100 p-1 rounded text-neutral-700 overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]">
                      {token.mintAddress}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto"
                      onClick={() => copyToClipboard(token.mintAddress)}
                      title="Copy to clipboard"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto"
                      onClick={() =>
                        window.open(
                          `https://explorer.solana.com/address/${token.mintAddress}?cluster=${cluster}`,
                          '_blank'
                        )
                      }
                      title="View on Solana Explorer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-md">
                  <p className="text-sm text-neutral-500 mb-1">Created</p>
                  <p className="text-sm">{new Date(token.createdAt || '').toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-neutral-500 flex items-center">
          <QrCode className="h-3.5 w-3.5 mr-1" />
          This is a compressed token using ZK Compression on Solana
        </div>
      </CardFooter>
    </Card>
  );
};
