'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Share,
  Copy,
  Check,
  Twitter,
  Facebook,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface POAPShareProps {
  poapId: string;
  title: string;
  className?: string;
  size?: 'default' | 'sm' | 'icon';
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
}

export function POAPShare({
  poapId,
  title,
  className,
  size = 'default',
  variant = 'outline',
}: POAPShareProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/poaps/${poapId}`
    : `/poaps/${poapId}`;
  
  const shareText = `Check out this POAP: ${title}`;
  
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

  const shareViaTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const url = `mailto:?subject=${encodeURIComponent(`POAP: ${title}`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.location.href = url;
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const popoverContent = (
    <div className="w-72 p-1">
      <div className="flex items-center space-x-2 mb-3">
        <Input 
          value={shareUrl} 
          readOnly 
          className="text-xs h-8" 
          onClick={(e) => e.currentTarget.select()}
        />
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 px-2" 
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start" 
          onClick={shareViaTwitter}
        >
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start" 
          onClick={shareViaFacebook}
        >
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start" 
          onClick={shareViaEmail}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start" 
          onClick={shareViaWhatsApp}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
      </div>
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={cn("gap-1.5", className)}
        >
          <Share className="h-4 w-4" />
          {size !== 'icon' && "Share"}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="bottom" 
        align="end" 
        className="w-72 p-3"
        sideOffset={5}
      >
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
} 