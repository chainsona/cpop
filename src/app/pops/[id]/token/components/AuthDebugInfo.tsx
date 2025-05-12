import { toast } from 'sonner';

interface AuthDebugInfoProps {
  showDebug: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
  authenticate: () => Promise<boolean>;
  fetchTokenData: () => Promise<void>;
  id: string;
}

export const AuthDebugInfo = ({
  showDebug,
  isConnected,
  isAuthenticated,
  error,
  authenticate,
  fetchTokenData,
  id,
}: AuthDebugInfoProps) => {
  if (!showDebug) return null;

  // Check for token in localStorage
  const hasLocalToken =
    typeof window !== 'undefined' && !!localStorage.getItem('solana_auth_token');

  // Check for token in cookies
  const hasCookieToken =
    typeof document !== 'undefined' &&
    document.cookie.split('; ').some(row => row.startsWith('solana_auth_token='));

  // Check for next-auth session cookie
  const hasNextAuthSession =
    typeof document !== 'undefined' &&
    document.cookie.split('; ').some(row => row.startsWith('next-auth.session-token='));

  // Function to test mint API directly
  const testMintApiDirectly = async () => {
    try {
      toast.info('Testing token minting...');

      // First ensure we're authenticated
      if (!isAuthenticated) {
        toast.warning('Authenticating first...');
        const success = await authenticate();
        if (!success) {
          toast.error('Authentication failed. Cannot proceed with token mint.');
          return;
        }
      }

      // Get token after authentication
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;

      if (!token) {
        toast.error('No Solana auth token found after authentication');
        return;
      }

      console.log('[Debug] Testing mint with token');

      // Make direct API call to mint tokens
      const response = await fetch(`/api/pops/${id}/mint`, {
        method: 'POST',
        headers: {
          Authorization: `Solana ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('[Debug] Mint API response:', {
        status: response.status,
        data,
      });

      if (response.ok) {
        toast.success('POP tokens minted successfully!');
        // Refresh the page after successful mint
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(`Mint failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('[Debug] Error testing mint API:', err);
      toast.error('Error minting tokens');
    }
  };

  return (
    <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-left">
      <h4 className="font-bold mb-2">Authentication Diagnostics:</h4>
      <ul className="space-y-1">
        <li>Connected: {isConnected ? '✅' : '❌'}</li>
        <li>Authenticated: {isAuthenticated ? '✅' : '❌'}</li>
        <li>Solana Token (localStorage): {hasLocalToken ? '✅' : '❌'}</li>
        <li>Solana Token (cookie): {hasCookieToken ? '✅' : '❌'}</li>
        <li>NextAuth Session: {hasNextAuthSession ? '✅' : '❌'}</li>
        <li>Error State: {error || 'None'}</li>
      </ul>
      <div className="mt-2 pt-2 border-t border-gray-300 flex flex-col gap-2">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              authenticate().then(success => {
                if (success) {
                  toast.success('Re-authenticated successfully');
                  fetchTokenData();
                } else {
                  toast.error('Re-authentication failed');
                }
              });
            }
          }}
          className="text-blue-600 hover:text-blue-800 text-xs underline"
        >
          Force Re-authenticate
        </button>

        <button
          onClick={testMintApiDirectly}
          className="text-green-600 hover:text-green-800 text-xs underline"
        >
          Test Mint API Directly
        </button>
      </div>
    </div>
  );
}; 