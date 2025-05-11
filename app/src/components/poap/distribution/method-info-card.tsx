import { DistributionMethod } from './types';
import { SecretWordDisplay } from './secret-word-display';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { getMethodTitle } from './utils';

interface MethodInfoCardProps {
  method: DistributionMethod;
  downloadAddresses?: (format: 'json' | 'csv') => void;
}

export const MethodInfoCard = ({ method, downloadAddresses }: MethodInfoCardProps) => {
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Method Information</h3>
          <dl className="space-y-2">
            <div className="grid grid-cols-3 gap-4">
              <dt className="font-medium text-neutral-600">Type:</dt>
              <dd className="col-span-2">{getMethodTitle(method.type)}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <dt className="font-medium text-neutral-600">Status:</dt>
              <dd className="col-span-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    method.disabled
                      ? 'bg-neutral-100 text-neutral-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {method.disabled ? 'Disabled' : 'Active'}
                </span>
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <dt className="font-medium text-neutral-600">Created:</dt>
              <dd className="col-span-2">{new Date(method.createdAt).toLocaleString()}</dd>
            </div>

            {/* Type-specific details */}
            {method.type === 'ClaimLinks' && method.claimLinks && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="font-medium text-neutral-600">Total Links:</dt>
                  <dd className="col-span-2">{method.claimLinks.length}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="font-medium text-neutral-600">Claimed:</dt>
                  <dd className="col-span-2">
                    {method.claimLinks.filter(link => link.claimed).length}
                  </dd>
                </div>
                {method.claimLinks[0]?.expiresAt && (
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="font-medium text-neutral-600">Expiry:</dt>
                    <dd className="col-span-2">
                      {new Date(method.claimLinks[0].expiresAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </>
            )}

            {method.type === 'SecretWord' && method.secretWord && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="font-medium text-neutral-600">Word:</dt>
                  <dd className="col-span-2">
                    <SecretWordDisplay word={method.secretWord.word} />
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="font-medium text-neutral-600">Claims:</dt>
                  <dd className="col-span-2">
                    {method.secretWord.claimCount}
                    {method.secretWord.maxClaims && ` of ${method.secretWord.maxClaims}`}
                  </dd>
                </div>
                {(method.secretWord.startDate || method.secretWord.endDate) && (
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="font-medium text-neutral-600">Valid Period:</dt>
                    <dd className="col-span-2">
                      {method.secretWord.startDate &&
                        new Date(method.secretWord.startDate).toLocaleDateString()}
                      {method.secretWord.startDate && method.secretWord.endDate && ' - '}
                      {method.secretWord.endDate &&
                        new Date(method.secretWord.endDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </>
            )}

            {method.type === 'LocationBased' && method.locationBased && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="font-medium text-neutral-600">Location:</dt>
                  <dd className="col-span-2">
                    {method.locationBased.city}
                    {method.locationBased.country && `, ${method.locationBased.country}`}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="font-medium text-neutral-600">Radius:</dt>
                  <dd className="col-span-2">{method.locationBased.radius}m</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="font-medium text-neutral-600">Claims:</dt>
                  <dd className="col-span-2">
                    {method.locationBased.claimCount}
                    {method.locationBased.maxClaims && ` of ${method.locationBased.maxClaims}`}
                  </dd>
                </div>
                {(method.locationBased.startDate || method.locationBased.endDate) && (
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="font-medium text-neutral-600">Valid Period:</dt>
                    <dd className="col-span-2">
                      {method.locationBased.startDate &&
                        new Date(method.locationBased.startDate).toLocaleDateString()}
                      {method.locationBased.startDate && method.locationBased.endDate && ' - '}
                      {method.locationBased.endDate &&
                        new Date(method.locationBased.endDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </>
            )}

            {method.type === 'Airdrop' && method.airdrop && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="font-medium text-neutral-600">Addresses:</dt>
                  <dd className="col-span-2 flex items-center gap-2">
                    {method.airdrop.addresses.length} wallet addresses
                    {downloadAddresses && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-full ml-2"
                        onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Export</span>
                      </Button>
                    )}
                    {showDownloadOptions && downloadAddresses && (
                      <div className="absolute mt-8 ml-20 bg-white shadow-lg rounded-md border border-neutral-200 p-2 z-10">
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start"
                            onClick={() => {
                              downloadAddresses('csv');
                              setShowDownloadOptions(false);
                            }}
                          >
                            CSV
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start"
                            onClick={() => {
                              downloadAddresses('json');
                              setShowDownloadOptions(false);
                            }}
                          >
                            JSON
                          </Button>
                        </div>
                      </div>
                    )}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="font-medium text-neutral-600">Claims:</dt>
                  <dd className="col-span-2">
                    {method.airdrop.claimCount}
                    {method.airdrop.maxClaims && ` of ${method.airdrop.maxClaims}`}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="font-medium text-neutral-600">Status:</dt>
                  <dd className="col-span-2">
                    {method.airdrop.startDate ? (
                      new Date(method.airdrop.startDate) > new Date() ? (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                          Scheduled
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                          In Progress
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                        In Progress
                      </span>
                    )}
                  </dd>
                </div>
                {(method.airdrop.startDate || method.airdrop.endDate) && (
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="font-medium text-neutral-600">Valid Period:</dt>
                    <dd className="col-span-2">
                      {method.airdrop.startDate &&
                        new Date(method.airdrop.startDate).toLocaleDateString()}
                      {method.airdrop.startDate && method.airdrop.endDate && ' - '}
                      {method.airdrop.endDate &&
                        new Date(method.airdrop.endDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};
