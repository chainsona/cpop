import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { calculateAirdropCost } from './utils';

interface AirdropAddressesListProps {
  addresses: string[];
}

export const AirdropAddressesList = ({ addresses }: AirdropAddressesListProps) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };

  return (
    <div className="mt-6 col-span-3">
      <h4 className="text-sm font-semibold uppercase text-neutral-500 mb-3">
        Recipient Addresses
      </h4>
      <div className="bg-white p-4 rounded-lg border border-neutral-200">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Wallet Address
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {addresses
                      .slice((page - 1) * pageSize, page * pageSize)
                      .map((address, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-neutral-600">
                            {(page - 1) * pageSize + index + 1}
                          </td>
                          <td className="px-4 py-2 text-sm font-mono">
                            {address}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 p-0 w-7"
                              onClick={() => copyToClipboard(address)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span className="sr-only">Copy Address</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {addresses.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-t border-neutral-200">
                  <div>
                    <p className="text-sm text-neutral-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(page - 1) * pageSize + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(
                          page * pageSize,
                          addresses.length
                        )}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">
                        {addresses.length}
                      </span>{' '}
                      addresses
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={
                        page * pageSize >= addresses.length
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <h5 className="text-sm text-neutral-600 mb-1">
                    Total Recipients
                  </h5>
                  <p className="text-2xl font-bold">
                    {addresses.length}
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <h5 className="text-sm text-neutral-600 mb-1">
                    Estimated Cost
                  </h5>
                  <p className="text-2xl font-bold">
                    {
                      calculateAirdropCost(addresses.length)
                        .compressedCost
                    }{' '}
                    SOL
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <h5 className="text-sm text-neutral-600 mb-1">
                    Cost Savings
                  </h5>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      calculateAirdropCost(addresses.length)
                        .savings
                    }
                    %
                  </p>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                <h5 className="text-sm font-medium mb-3">
                  Transaction Information
                </h5>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt>Number of Transactions:</dt>
                    <dd className="font-medium">
                      ~
                      {
                        calculateAirdropCost(addresses.length)
                          .txCount
                      }
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Addresses per Transaction:</dt>
                    <dd className="font-medium">Up to 22</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Default Compute Unit Limit:</dt>
                    <dd className="font-medium">1,400,000</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Default Priority Fee:</dt>
                    <dd className="font-medium">1 μLamport</dd>
                  </div>
                </dl>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 