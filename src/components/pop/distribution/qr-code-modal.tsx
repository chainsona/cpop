import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface QrCodeModalProps {
  selectedQRCode: { token: string; url: string } | null;
  setSelectedQRCode: (qrCode: { token: string; url: string } | null) => void;
}

export const QRCodeModal = ({ selectedQRCode, setSelectedQRCode }: QrCodeModalProps) => {
  // State to track if QR code is revealed
  const [isQRCodeRevealed, setIsQRCodeRevealed] = useState(false);
  const qrCodeContainerRef = useRef<HTMLDivElement>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  // Toggle QR code visibility
  const toggleQRCodeVisibility = () => {
    setIsQRCodeRevealed(prev => !prev);
  };

  // Function to copy claim link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };

  // Function to copy QR code as image to clipboard
  const copyQRCodeAsImage = async () => {
    if (!qrCodeContainerRef.current || !selectedQRCode) {
      toast.error('QR code not available');
      return;
    }

    try {
      // Temporarily reveal the QR code if it's not already revealed
      const wasHidden = !isQRCodeRevealed;
      if (wasHidden) {
        // Remove blur without changing state to avoid re-render
        const qrElement = qrCodeContainerRef.current;
        qrElement.classList.remove('blur-md');
      }

      // Find the SVG element inside the container
      const svgElement = qrCodeContainerRef.current.querySelector('svg');
      if (!svgElement) {
        throw new Error('QR code element not found');
      }

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set canvas dimensions - make it slightly larger to accommodate padding
      const canvasSize = 300; // Larger canvas for padding
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      
      // Create SVG image
      const img = new Image();
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      img.onload = async () => {
        // Draw white background for entire canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate padding and position for centered QR code
        const qrSize = 256; // Original QR code size
        const padding = (canvasSize - qrSize) / 2; // Equal padding on all sides
        
        // Draw QR code in the center with padding
        ctx.drawImage(img, padding, padding, qrSize, qrSize);
        
        try {
          // Convert to blob and copy to clipboard
          const canvasBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else throw new Error('Could not create blob from canvas');
            }, 'image/png');
          });
          
          // Copy to clipboard (using Clipboard API)
          await navigator.clipboard.write([
            new ClipboardItem({
              [canvasBlob.type]: canvasBlob
            })
          ]);
          
          toast.success('QR code copied to clipboard');
        } catch (err) {
          console.error('Error copying image to clipboard:', err);
          toast.error('Failed to copy QR code');
        } finally {
          URL.revokeObjectURL(url);
          
          // Restore the blur if it was hidden temporarily
          if (wasHidden) {
            qrCodeContainerRef.current?.classList.add('blur-md');
          }
        }
      };
      
      img.src = url;
    } catch (err) {
      console.error('Error creating QR code image:', err);
      toast.error('Failed to copy QR code');
    }
  };

  return (
    <Dialog open={!!selectedQRCode} onOpenChange={open => !open && setSelectedQRCode(null)}>
      <DialogContent className="sm:max-w-md max-w-[95vw] w-full p-0 overflow-hidden">
        <div className="overflow-y-auto max-h-[85vh]">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle className="text-xl">Claim QR Code</DialogTitle>
            <DialogDescription className="text-sm">
              Scan this QR code to claim your POP
            </DialogDescription>
          </DialogHeader>

          {selectedQRCode && (
            <div className="flex flex-col items-center justify-center px-4 py-3 sm:px-6 sm:py-5">
              <div
                className="bg-white p-2 sm:p-4 rounded-xl shadow-sm mb-3 sm:mb-4 relative cursor-pointer w-full max-w-[280px] hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={toggleQRCodeVisibility}
                tabIndex={0}
                role="button"
                aria-label="Toggle QR code visibility"
              >
                <div 
                  ref={qrCodeContainerRef}
                  className={`transition-all duration-300 ${isQRCodeRevealed ? '' : 'blur-md'}`}
                >
                  <QRCode
                    value={selectedQRCode.url}
                    size={256}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    viewBox={`0 0 256 256`}
                  />
                </div>

                {!isQRCodeRevealed && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/40 rounded-full p-2 sm:p-4">
                      <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <span className="sr-only">Click to reveal QR code</span>
                  </div>
                )}
              </div>

              <div className="text-center mb-2 w-full">
                <div className="flex items-center justify-center gap-2">
                  <p
                    className="text-xs sm:text-sm text-neutral-500 cursor-pointer hover:text-neutral-700 transition-colors focus:outline-none"
                    onClick={toggleQRCodeVisibility}
                    tabIndex={0}
                    role="button"
                  >
                    {isQRCodeRevealed ? (
                      <span className="flex items-center justify-center gap-1">
                        <EyeOff className="h-3.5 w-3.5" /> Hide QR code
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Click to reveal
                      </span>
                    )}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-6 gap-1"
                    onClick={copyQRCodeAsImage}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="text-center mb-3 w-full">
                <p className="text-xs sm:text-sm text-neutral-500 mb-1">Token</p>
                <div className="flex items-center bg-neutral-100 rounded p-2">
                  <div className="font-mono text-xs truncate w-full pr-2">
                    {isQRCodeRevealed ? selectedQRCode.token : '********************************'}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0 cursor-pointer hover:bg-neutral-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                    onClick={() => copyToClipboard(selectedQRCode.token)}
                    aria-label="Copy to clipboard"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="text-center w-full">
                <p className="text-xs sm:text-sm text-neutral-500 mb-1">Claim URL</p>
                <div className="flex items-center bg-neutral-100 rounded p-2">
                  <div className="font-mono text-xs truncate w-full pr-2">
                    {isQRCodeRevealed
                      ? selectedQRCode.url
                      : `${appUrl}/claim/********`}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0 cursor-pointer hover:bg-neutral-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                    onClick={() => copyToClipboard(selectedQRCode.url)}
                    aria-label="Copy to clipboard"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-4 py-4 border-t border-neutral-200 sm:px-6">
          <Button
            variant="secondary"
            onClick={() => setSelectedQRCode(null)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
