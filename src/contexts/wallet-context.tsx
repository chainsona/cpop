'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError, WalletName } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { toast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { createSignatureMessage } from '@/lib/solana-auth';

// Import the required CSS for the wallet adapter UI
import '@solana/wallet-adapter-react-ui/styles.css';

// Create a type for our wallet context
type WalletContextType = {
  isConnected: boolean;
  connecting: boolean;
  walletAddress: string | null;
  signMessage: (message: Uint8Array) => Promise<Uint8Array | null>;
  connect: (walletName?: WalletName) => Promise<void>;
  disconnect: () => Promise<void>;
  isProtectedPage: (path: string) => boolean;
  isAuthenticated: boolean;
  authenticate: () => Promise<boolean>;
};

// Public routes that don't require authentication (must match middleware.ts)
const PUBLIC_ROUTES = [
  '/', // Home page is accessible to everyone
  '/auth', // Auth pages need to be public
  '/api', // API routes have their own auth
];

// Create the context with default values
const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  connecting: false,
  walletAddress: null,
  signMessage: async () => null,
  connect: async () => {},
  disconnect: async () => {},
  isProtectedPage: () => false,
  isAuthenticated: false,
  authenticate: async () => false,
});

// Custom hook to use the wallet context
export const useWalletContext = () => useContext(WalletContext);

// The wallet adapter configuration
export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Mainnet;

  // We can also provide a custom RPC endpoint
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || clusterApiUrl(network);

  // @solana/wallet-adapter-wallets imports all the adapters but supports tree shaking
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContextContent>{children}</WalletContextContent>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// The actual context implementation that uses the wallet adapter hooks
function WalletContextContent({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const {
    connected,
    connecting,
    publicKey,
    signMessage: adapterSignMessage,
    select,
    disconnect: adapterDisconnect,
    wallet,
  } = useWallet();
  const router = useRouter();
  const pathname = usePathname();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [autoAuthInProgress, setAutoAuthInProgress] = useState<boolean>(false);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);

  // Check for existing auth token on initial render/page load
  useEffect(() => {
    // Only run this effect once on mount
    const checkExistingToken = async () => {
      try {
        console.log('Checking for existing auth token on page load');
        const isAlreadyAuthenticated = await checkAuthenticationStatus();
        if (isAlreadyAuthenticated) {
          console.log('Found valid existing token on page load');
          setIsAuthenticated(true);
        } else {
          console.log('No valid token found on page load');
        }
      } catch (error) {
        console.error('Error checking auth token on page load:', error);
      } finally {
        setInitialCheckDone(true);
      }
    };

    checkExistingToken();
  }, []);

  // Function to check if a token is valid
  const isTokenValid = (token: string): boolean => {
    try {
      const parsedToken = JSON.parse(Buffer.from(token, 'base64').toString());
      if (!parsedToken.message || !parsedToken.message.expirationTime) {
        return false;
      }
      const expirationTime = new Date(parsedToken.message.expirationTime);
      return expirationTime > new Date();
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };

  // Validate stored auth token against API
  const validateAuthToken = async (token: string): Promise<boolean> => {
    try {
      // Format token correctly for the Authorization header
      let authHeader = token;
      if (!token.startsWith('Solana ')) {
        authHeader = `Solana ${token}`;
      }

      const response = await fetch('/api/auth/validate', {
        headers: {
          Authorization: authHeader,
        },
      });

      const result = await response.json();
      return response.ok && result.valid;
    } catch (error) {
      console.error('Error validating auth token with API:', error);
      return false;
    }
  };

  // Check for stored auth token and validate
  const checkAuthenticationStatus = async (): Promise<boolean> => {
    try {
      // Check for token in cookies and localStorage
      const cookieToken = getCookie('solana_auth_token');
      const localToken =
        typeof localStorage !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;

      const token = cookieToken || localToken;

      if (!token) {
        console.log('No auth token found in cookies or localStorage');
        setIsAuthenticated(false);
        return false;
      }

      console.log('Auth token found, validating...');

      // First do a quick local validation
      if (!isTokenValid(token.toString())) {
        // Token is invalid or expired, clean up
        console.log('Token failed local validation (expired or invalid format)');
        deleteCookie('solana_auth_token');
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('solana_auth_token');
        }
        setIsAuthenticated(false);
        return false;
      }

      // If token passes local validation, verify with API
      try {
        const isValid = await validateAuthToken(token.toString());

        if (!isValid) {
          // Token failed server validation, clean up
          console.log('Token failed server validation');
          deleteCookie('solana_auth_token');
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('solana_auth_token');
          }
          setIsAuthenticated(false);
          return false;
        }
      } catch (apiError) {
        console.error('API validation error:', apiError);
        // On API error, still use local validation result
        console.log('Using local validation result due to API error');
      }

      // Token is valid, ensure it's stored in both places
      if (!cookieToken && localToken) {
        console.log('Syncing token to cookies');
        setCookie('solana_auth_token', localToken);
      } else if (cookieToken && !localToken && typeof localStorage !== 'undefined') {
        console.log('Syncing token to localStorage');
        localStorage.setItem('solana_auth_token', cookieToken.toString());
      }

      console.log('Token validated successfully');
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  };

  // Update the state when the wallet connection changes
  useEffect(() => {
    setIsConnected(connected);
    setWalletAddress(publicKey?.toBase58() || null);

    // Store wallet address in localStorage when connected
    if (connected && publicKey) {
      try {
        const userInfo = localStorage.getItem('userProfile');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          localStorage.setItem(
            'userProfile',
            JSON.stringify({
              ...user,
              walletAddress: publicKey.toBase58(),
            })
          );
        }
      } catch (error) {
        console.error('Failed to update user wallet info:', error);
      }
    }
  }, [connected, publicKey]);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    // Automatically authenticate when wallet connects
    const handleAutoAuth = async () => {
      // Only proceed if we have a connection but no authentication yet
      // AND initial token check has completed
      if (connected && publicKey && !isAuthenticated && !autoAuthInProgress && initialCheckDone) {
        setAutoAuthInProgress(true);

        try {
          // First check if we already have a valid token
          const isAlreadyAuthenticated = await checkAuthenticationStatus();

          if (!isAlreadyAuthenticated) {
            // If no valid token exists, trigger authentication
            console.log('No valid auth token found, initiating auto-authentication');
            await authenticate();
          } else {
            console.log('User already has valid authentication token');
          }
        } catch (error) {
          console.error('Auto-authentication error:', error);
        } finally {
          setAutoAuthInProgress(false);
        }
      }
    };

    handleAutoAuth();
  }, [connected, publicKey, isAuthenticated, initialCheckDone]);

  // Also check authentication status whenever wallet status changes
  useEffect(() => {
    if (connected && initialCheckDone) {
      checkAuthenticationStatus();
    } else if (!connected && !initialCheckDone) {
      // If wallet disconnects but we haven't done initial check yet, 
      // don't clear authentication state since we might have a valid token
      console.log('Wallet disconnected but deferring auth state decision until initial check completes');
    } else if (!connected && initialCheckDone) {
      // Only clear authentication if wallet disconnects and we've already done the initial check
      setIsAuthenticated(false);
    }
  }, [connected, initialCheckDone]);

  // Function to check if a page is protected
  const isProtectedPage = (path: string): boolean => {
    return !PUBLIC_ROUTES.some(
      route => path === route || (route !== '/' && path.startsWith(`${route}/`))
    );
  };

  // Connect to a wallet - this will open the wallet selection modal
  const connect = async () => {
    try {
      // The wallet modal will handle wallet selection
      // No need to explicitly select a wallet here
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error('Wallet connection error:', error);
    }
  };

  // Disconnect the wallet
  const disconnect = async () => {
    try {
      await adapterDisconnect();

      // Clear auth tokens from localStorage and cookies
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('solana_auth_token');
      }
      deleteCookie('solana_auth_token');

      // Reset authentication state
      setIsAuthenticated(false);

      // Check if we're on a protected page that requires authentication
      if (isProtectedPage(pathname)) {
        router.push('/');
      }

      toast.warning('Wallet disconnected');
    } catch (error) {
      toast.error('Failed to disconnect wallet');
      console.error('Wallet disconnect error:', error);
    }
  };

  // Authenticate with the wallet
  const authenticate = async (): Promise<boolean> => {
    if (!connected || !publicKey || !adapterSignMessage) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      // Check if we already have a valid token
      const isAlreadyAuthenticated = await checkAuthenticationStatus();
      if (isAlreadyAuthenticated) {
        console.log('Authentication skipped: Valid token already exists');
        toast.success('Already authenticated');
        return true;
      }

      console.log('No valid token found, requesting wallet signature...');
      
      // Create a human-readable message for the wallet to sign
      const message = createSignatureMessage(publicKey.toBase58());

      // Create a UTF-8 encoded message that the wallet can sign
      const encodedMessage = new TextEncoder().encode(message);

      // Ask the wallet to sign the message
      const signature = await adapterSignMessage(encodedMessage);

      if (!signature) {
        toast.error('Failed to sign message');
        return false;
      }

      // Store in the same format that will be verified on the server
      const signatureBase64 = Buffer.from(signature).toString('base64');

      // Create the auth token with the text format indicator
      const signInMessage = {
        message,
        signature: signatureBase64,
        messageFormat: 'text'
      };

      // Encode the token for storage and auth headers
      const token = Buffer.from(JSON.stringify(signInMessage)).toString('base64');

      // Extract expiration from message
      const expiresMatch = message.match(/Expires: (.+)/);
      const expiresDate = expiresMatch 
        ? new Date(expiresMatch[1] + 'Z') 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Store the token in localStorage and cookies
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('solana_auth_token', token);
      }
      setCookie('solana_auth_token', token, {
        expires: expiresDate,
        path: '/',
      });

      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Failed to authenticate with wallet');
      return false;
    }
  };

  // Sign a message with the wallet
  const signMessage = async (message: Uint8Array): Promise<Uint8Array | null> => {
    if (!connected || !adapterSignMessage) {
      toast.error('Wallet not connected');
      return null;
    }

    try {
      const signature = await adapterSignMessage(message);
      return signature;
    } catch (error) {
      toast.error('Failed to sign message');
      console.error('Signing error:', error);
      return null;
    }
  };

  // The context value we'll provide to consumers
  const contextValue: WalletContextType = {
    isConnected,
    connecting,
    walletAddress,
    signMessage,
    connect,
    disconnect,
    isProtectedPage,
    isAuthenticated,
    authenticate,
  };

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
}
