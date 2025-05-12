import { toast } from 'sonner';

/**
 * Format a number with commas for display
 */
export const formatNumber = (num: number | undefined | null): string => {
  return num !== undefined && num !== null ? num.toLocaleString() : '0';
};

/**
 * Copy text to clipboard with toast notification
 */
export const copyToClipboard = (text: string): Promise<void> => {
  return navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success('Address copied to clipboard');
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy to clipboard');
    });
};

/**
 * Reset auth state completely
 */
export const resetAndReauthenticate = async (
  authenticate: () => Promise<boolean>,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  fetchTokenData: () => Promise<void>
): Promise<void> => {
  try {
    setIsLoading(true);

    // Clear all token storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('solana_auth_token');
    }

    // Clear cookies (in a simple way)
    if (typeof document !== 'undefined') {
      document.cookie = 'solana_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie =
        'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'next-auth.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    // Re-authenticate with wallet
    const success = await authenticate();

    if (success) {
      toast.success('Authentication reset successful');
      setError(null);
      fetchTokenData();
    } else {
      toast.error('Failed to re-authenticate after reset');
    }
  } catch (err) {
    console.error('Error during auth reset:', err);
    toast.error('Authentication reset failed');
  } finally {
    setIsLoading(false);
  }
}; 