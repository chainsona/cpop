'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { useWalletContext } from '@/contexts/wallet-context';
import { truncateWalletAddress } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function WalletMismatchAlert() {
  const { 
    hasWalletMismatch, 
    authWalletAddress, 
    activeWalletAddress, 
    isAuthenticated,
    authenticate,
    disconnect
  } = useWalletContext();
  
  if (!hasWalletMismatch || !isAuthenticated || !authWalletAddress || !activeWalletAddress) {
    return null;
  }
  
  // Format addresses for display
  const authAddress = truncateWalletAddress(authWalletAddress);
  const connectedAddress = truncateWalletAddress(activeWalletAddress);

  const handleSwitchAuth = async () => {
    // Log out and authenticate with current wallet
    await disconnect();
    setTimeout(() => {
      authenticate();
    }, 500);
  };
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Different wallet connected</AlertTitle>
      <AlertDescription className="text-sm">
        <p className="mt-1">
          You're authenticated with <span className="font-mono font-medium">{authAddress}</span> but connected to <span className="font-mono font-medium">{connectedAddress}</span>.
        </p>
        <div className="mt-2 flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleSwitchAuth}>
            Switch Authentication
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
} 