'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Share as ShareIcon,
  Copy,
  Check,
  Facebook,
  Mail,
  MessageCircle,
  Link as LinkIcon,
  Linkedin,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ShareProps {
  /**
   * The URL to share
   */
  url?: string;
  /**
   * The text title to share
   */
  title?: string;
  /**
   * Optional description text for the share
   */
  description?: string;
  /**
   * Additional CSS class
   */
  className?: string;
  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Button variant
   */
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  /**
   * Custom platforms to display (defaults to all)
   */
  platforms?: ('twitter' | 'facebook' | 'email' | 'whatsapp' | 'linkedin' | 'copy')[];
  /**
   * Display as a split button with Twitter as primary and dropdown for other options
   */
  splitButton?: boolean;
}

export function Share({
  url,
  title = 'Check this out',
  description = '',
  className,
  size = 'default',
  variant = 'outline',
  platforms = ['twitter', 'facebook', 'email', 'whatsapp', 'linkedin', 'copy'],
  splitButton = false,
}: ShareProps) {
  const [copied, setCopied] = useState(false);

  // Check if Web Share API is available
  const isWebShareSupported = typeof navigator !== 'undefined' && 'share' in navigator;

  // Determine the URL to share
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Format share text based on title and description
  const shareText = `Claim your '${title}' POP!\n\nPowered by @LightProtocol ZK Compression`;

  // Function to copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  // Share via native Web Share API (mobile-friendly)
  const shareNative = async () => {
    if (!isWebShareSupported) return false;

    try {
      await navigator.share({
        title,
        text: description || title,
        url: shareUrl,
      });
      toast.success('Shared successfully');
      return true;
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error)?.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
      return false;
    }
  };

  // Platform-specific share functions
  const shareViaTwitter = () => {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.location.href = url;
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const shareViaLinkedin = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  // Content to display inside the popover
  const popoverContent = (
    <div className="w-full p-1">
      <div className="flex items-center space-x-2 mb-3">
        <Input
          value={shareUrl}
          readOnly
          className="text-xs h-8"
          onClick={e => e.currentTarget.select()}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 flex-shrink-0"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {platforms.includes('twitter') && !splitButton && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={shareViaTwitter}
          >
            <ShareIcon className="h-4 w-4 mr-2" />
            Twitter
          </Button>
        )}

        {platforms.includes('facebook') && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={shareViaFacebook}
          >
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </Button>
        )}

        {platforms.includes('email') && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={shareViaEmail}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        )}

        {platforms.includes('whatsapp') && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={shareViaWhatsApp}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        )}

        {platforms.includes('linkedin') && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={shareViaLinkedin}
          >
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </Button>
        )}

        {platforms.includes('copy') && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={copyToClipboard}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        )}
      </div>
    </div>
  );

  // Try to use native share API on click for mobile devices
  const handleShareClick = async (e: React.MouseEvent) => {
    if (isWebShareSupported) {
      e.preventDefault();
      const shared = await shareNative();
      // If sharing failed or was cancelled, let the popover open
      return shared;
    }
    // Otherwise, the popover will open normally
    return false;
  };

  // If using split button design
  if (splitButton) {
    return (
      <div className={cn('flex', className)}>
        <Button
          variant={variant}
          size={size}
          className={cn('rounded-r-none border-r-0', platforms.includes('twitter') ? '' : 'hidden')}
          onClick={shareViaTwitter}
        >
          Share on X
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className="rounded-l-none px-2"
              onClick={handleShareClick}
            >
              <ShareIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-72 p-3" sideOffset={5}>
            {popoverContent}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Standard single button design (original)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('gap-1.5', className)}
          onClick={handleShareClick}
        >
          <ShareIcon className="h-4 w-4" />
          {size !== 'icon' && 'Share'}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-72 p-3" sideOffset={5}>
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
}
