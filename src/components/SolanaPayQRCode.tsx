'use client';

import React, { useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { createSolanaPayClaimUrl } from '@/lib/solana-pay-utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Copy, Download } from 'lucide-react';

interface SolanaPayQRCodeProps {
  claimToken: string;
  size?: number;
  className?: string;
}

export function SolanaPayQRCode({ claimToken, size = 256, className }: SolanaPayQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const solanaPayUrl = useMemo(() => {
    // Use the current origin as base URL or fallback to environment variable
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'https://pop.community';

    return createSolanaPayClaimUrl(claimToken, baseUrl);
  }, [claimToken]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(solanaPayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('solana-pay-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      // Download the PNG file
      const downloadLink = document.createElement('a');
      downloadLink.download = `pop-claim-${claimToken}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Calculate QR code size - adjust to ensure the QR code itself fits within container
  const qrSize = Math.min(size, 180); // Cap at 180px for the QR code itself

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="bg-white p-3 rounded-lg mb-1">
        <QRCode
          id="solana-pay-qr-code"
          value={solanaPayUrl}
          size={qrSize}
          level="M" // Use "M" level for better scanning reliability
          fgColor="#000000"
          bgColor="#FFFFFF"
        />
      </div>

      <p className="text-xs text-center text-muted-foreground mt-2">
        Scan with a Solana Pay compatible wallet
        <br />
        to instantly claim your token
      </p>
    </div>
  );
}
