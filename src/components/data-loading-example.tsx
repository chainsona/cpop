'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLoadingState } from '@/hooks/use-loading-state';

interface DataLoadingExampleProps {
  endpoint?: string;
}

export function DataLoadingExample({ endpoint = '/api/example' }: DataLoadingExampleProps) {
  const [data, setData] = useState<any[]>([]);
  const tableLoading = useLoadingState({ skeletonType: 'table', skeletonProps: { rows: 5, columns: 4 } });
  const cardLoading = useLoadingState({ skeletonType: 'card' });
  
  const fetchData = async () => {
    // Simulate network request
    return tableLoading.withLoading(
      new Promise<any[]>((resolve) => {
        setTimeout(() => {
          resolve([
            { id: 1, name: 'Item 1', status: 'Active', price: '$100' },
            { id: 2, name: 'Item 2', status: 'Inactive', price: '$200' },
            { id: 3, name: 'Item 3', status: 'Active', price: '$150' },
          ]);
        }, 1500);
      })
    );
  };

  const fetchCardData = async () => {
    // Simulate network request
    return cardLoading.withLoading(
      new Promise<any>((resolve) => {
        setTimeout(() => {
          resolve({
            title: 'Summary',
            value: '$450',
            change: '+12%',
          });
        }, 1000);
      })
    );
  };
  
  useEffect(() => {
    fetchData().then(setData);
    fetchCardData();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Data Loading Examples</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchData().then(setData)}
          disabled={tableLoading.isLoading}
        >
          Refresh Table
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <cardLoading.WithLoading>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$450</div>
              <p className="text-muted-foreground text-xs">Total value</p>
              <div className="text-green-600 mt-2">+12% from last month</div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" onClick={fetchCardData}>
                Refresh Card
              </Button>
            </CardFooter>
          </Card>
        </cardLoading.WithLoading>
      </div>
      
      <tableLoading.WithLoading>
        {data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item.id}>
                    {Object.entries(item).map(([key, value]) => (
                      <td key={`${item.id}-${key}`} className="px-4 py-2 text-sm">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </tableLoading.WithLoading>
    </div>
  );
} 