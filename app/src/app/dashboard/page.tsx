'use client';

import { useEffect, useState } from 'react';
import { useWalletContext } from '@/contexts/wallet-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, RefreshCw, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { isConnected, walletAddress } = useWalletContext();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulate fetching wallet balance
  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      // In a real app, you would make an API call to get the balance
      // For demo, we'll simulate a delay and return a random balance
      await new Promise(resolve => setTimeout(resolve, 1000));
      const randomBalance = (Math.random() * 10).toFixed(4);
      setBalance(randomBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch balance on component mount
  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchBalance();
    }
  }, [isConnected, walletAddress]);

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Wallet Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="mr-2 h-5 w-5" /> Wallet Balance
              </CardTitle>
              <CardDescription>Your current Solana balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">
                    {loading ? '...' : balance ? `${balance} SOL` : 'N/A'}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchBalance}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-xs text-neutral-500 mt-1 font-mono">{walletAddress}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Activities Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Your recent wallet activities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-500 italic">No recent activities found</p>
            </CardContent>
          </Card>
          
          {/* POAPs Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your POAPs</CardTitle>
              <CardDescription>Manage your Proof of Attendance tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-neutral-500">Create or manage your existing POAPs</p>
                <Link href="/poaps/create">
                  <Button className="w-full flex justify-between">
                    Create New POAP
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
} 