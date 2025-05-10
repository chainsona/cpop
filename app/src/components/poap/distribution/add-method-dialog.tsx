import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Coins,
  Link2 as Link2Icon,
  LockKeyhole,
  MapPin,
  Plane,
  X
} from 'lucide-react';
import Link from 'next/link';

export interface AddMethodDialogProps {
  poapId: string;
  onClose: () => void;
  onMethodAdded: (method: any) => void;
}

/**
 * Dialog for adding a new distribution method
 */
export function AddMethodDialog({ poapId, onClose, onMethodAdded }: AddMethodDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Distribution Method</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-neutral-600 mb-6">
            Choose a method to distribute your POAP tokens. This will automatically mint compressed 
            tokens for your participants.
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="border border-neutral-200 hover:border-blue-300 rounded-lg p-4 cursor-pointer transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-50 p-2 rounded-full">
                  <Link2Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-medium">Claim Links</h3>
              </div>
              <p className="text-sm text-neutral-600">
                Generate unique links that can be shared with participants
              </p>
              <div className="mt-3">
                <Link href={`/poaps/${poapId}/distribution/new?type=links`} passHref>
                  <Button size="sm" variant="outline" className="w-full">
                    Select
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="border border-neutral-200 hover:border-emerald-300 rounded-lg p-4 cursor-pointer transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-emerald-50 p-2 rounded-full">
                  <LockKeyhole className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-medium">Secret Word</h3>
              </div>
              <p className="text-sm text-neutral-600">
                Set a password that participants need to know to claim
              </p>
              <div className="mt-3">
                <Link href={`/poaps/${poapId}/distribution/new?type=secret`} passHref>
                  <Button size="sm" variant="outline" className="w-full">
                    Select
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="border border-neutral-200 hover:border-orange-300 rounded-lg p-4 cursor-pointer transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-50 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="font-medium">Location Based</h3>
              </div>
              <p className="text-sm text-neutral-600">
                Restrict claiming to people in a specific geographic location
              </p>
              <div className="mt-3">
                <Link href={`/poaps/${poapId}/distribution/new?type=location`} passHref>
                  <Button size="sm" variant="outline" className="w-full">
                    Select
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="border border-neutral-200 hover:border-purple-300 rounded-lg p-4 cursor-pointer transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-50 p-2 rounded-full">
                  <Plane className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-medium">Airdrop</h3>
              </div>
              <p className="text-sm text-neutral-600">
                Mint tokens directly to a list of Solana wallet addresses
              </p>
              <div className="mt-3">
                <Link href={`/poaps/${poapId}/distribution/new?type=airdrop`} passHref>
                  <Button size="sm" variant="outline" className="w-full">
                    Select
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 