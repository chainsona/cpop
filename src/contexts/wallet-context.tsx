'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError, WalletName } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
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
  activeWalletAddress: string | null;  // New: actual connected wallet address
  authWalletAddress: string | null;    // New: authenticated wallet address from session
  hasWalletMismatch: boolean;          // New: flag for UI to show mismatch warning
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
  activeWalletAddress: null,
  authWalletAddress: null,
  hasWalletMismatch: false,
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

// Helper function to parse wallet address from token
function extractWalletAddressFromToken(token: string): string | null {
  try {
    const parsedToken = JSON.parse(Buffer.from(token, 'base64').toString());
    if (!parsedToken.message) return null;
    
    if (typeof parsedToken.message === 'string') {
      // Extract from human-readable format
      const addressMatch = parsedToken.message.match(/Wallet: (.+)/);
      return addressMatch ? addressMatch[1] : null;
    } else {
      // Extract from JSON format
      return parsedToken.message.address || null;
    }
  } catch (error) {
    console.error('Error extracting wallet address from token:', error);
    return null;
  }
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
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const pathname = usePathname();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeWalletAddress, setActiveWalletAddress] = useState<string | null>(null);
  const [authWalletAddress, setAuthWalletAddress] = useState<string | null>(null);
  const [hasWalletMismatch, setHasWalletMismatch] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [autoAuthInProgress, setAutoAuthInProgress] = useState<boolean>(false);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);
  const [sessionWalletAddress, setSessionWalletAddress] = useState<string | null>(null);
  
  // Attempt to load session wallet info on initial render
  useEffect(() => {
    const loadSessionInfo = async () => {
      try {
        console.log('Checking for existing session on page load');
        
        // Check for token in different storage locations
        const cookieToken = getCookie('solana_auth_token')?.toString();
        const localToken = typeof localStorage !== 'undefined' 
          ? localStorage.getItem('solana_auth_token') 
          : null;
        
        const token = cookieToken || localToken;
        
        if (!token) {
          console.log('No auth token found on page load');
          setIsAuthenticated(false);
          setInitialCheckDone(true);
          return;
        }
        
        // Validate token locally first
        const isTokenValid = await validateTokenLocally(token.toString());
        if (!isTokenValid) {
          console.log('Token failed local validation, clearing invalid token');
          clearAuthTokens();
          setInitialCheckDone(true);
          return;
        }
        
        // Extract wallet address from token
        const extractedAddress = extractWalletAddressFromToken(token.toString());
        if (extractedAddress) {
          console.log('Found valid session with wallet:', extractedAddress);
          setSessionWalletAddress(extractedAddress);
          setAuthWalletAddress(extractedAddress);
          setWalletAddress(extractedAddress);
          setIsConnected(true);
          setIsAuthenticated(true);
          
          // Sync token across storage mechanisms
          syncTokenAcrossStorage(token.toString());
        } else {
          console.log('Could not extract wallet address from token');
          clearAuthTokens();
        }
      } catch (error) {
        console.error('Error loading session info:', error);
      } finally {
        setInitialCheckDone(true);
      }
    };
    
    loadSessionInfo();
  }, []);

  // Function to check if a token is valid (local check only)
  const validateTokenLocally = async (token: string): Promise<boolean> => {
    try {
      const parsedToken = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if the token has the necessary structure
      if (!parsedToken.message || !parsedToken.signature) {
        return false;
      }
      
      // Extract and check expiration time
      if (typeof parsedToken.message === 'string') {
        // Human-readable format
        const expiresMatch = parsedToken.message.match(/Expires: (.+)/);
        if (!expiresMatch) return false;
        
        const expirationTime = new Date(expiresMatch[1] + 'Z');
        return expirationTime > new Date();
      } else {
        // JSON format
        if (!parsedToken.message.expirationTime) return false;
        const expirationTime = new Date(parsedToken.message.expirationTime);
        return expirationTime > new Date();
      }
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };
  
  // Function to validate token with server
  const validateTokenWithServer = async (token: string): Promise<boolean> => {
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

  // Ensure token is stored consistently across storage mechanisms
  const syncTokenAcrossStorage = (token: string) => {
    try {
      // Store in localStorage if it doesn't exist there
      if (typeof localStorage !== 'undefined' && !localStorage.getItem('solana_auth_token')) {
        localStorage.setItem('solana_auth_token', token);
      }
      
      // Store in cookie if it doesn't exist there
      const cookieToken = getCookie('solana_auth_token');
      if (!cookieToken) {
        // Parse token to get expiration
        const parsedToken = JSON.parse(Buffer.from(token, 'base64').toString());
        let expirationDate: Date;
        
        if (typeof parsedToken.message === 'string') {
          const expiresMatch = parsedToken.message.match(/Expires: (.+)/);
          expirationDate = expiresMatch 
            ? new Date(expiresMatch[1] + 'Z') 
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        } else {
          expirationDate = new Date(parsedToken.message.expirationTime || Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        
        setCookie('solana_auth_token', token, {
          expires: expirationDate,
          path: '/',
        });
      }
    } catch (error) {
      console.error('Error syncing token across storage:', error);
    }
  };
  
  // Clear all auth tokens from storage
  const clearAuthTokens = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('solana_auth_token');
    }
    
    deleteCookie('solana_auth_token');
    
    setSessionWalletAddress(null);
    setAuthWalletAddress(null);
    setHasWalletMismatch(false);
    setIsAuthenticated(false);
  };

  // Update the state when the wallet connection changes
  useEffect(() => {
    // Always track the active wallet address separately
    setActiveWalletAddress(connected && publicKey ? publicKey.toBase58() : null);
    
    // If we have a session wallet address and we're authenticated but not connected with hardware wallet,
    // we should still show as connected using the session wallet address
    if (!connected && sessionWalletAddress && isAuthenticated) {
      setIsConnected(true);
      setWalletAddress(sessionWalletAddress);
      setAuthWalletAddress(sessionWalletAddress);
      setHasWalletMismatch(false); // No mismatch when only session wallet is present
    } else if (connected && publicKey) {
      const connectedAddress = publicKey.toBase58();
      setIsConnected(true);
      
      // If we have a session wallet, prioritize it for the displayed wallet address
      if (sessionWalletAddress && isAuthenticated) {
        // Keep using the authenticated wallet address for the primary display
        setWalletAddress(sessionWalletAddress);
        setAuthWalletAddress(sessionWalletAddress);
        
        // Set wallet mismatch flag if wallet addresses differ
        const isMismatch = sessionWalletAddress !== connectedAddress;
        setHasWalletMismatch(isMismatch);
        
        if (isMismatch) {
          console.log(`Wallet mismatch detected: Auth wallet (${sessionWalletAddress}) ≠ Connected wallet (${connectedAddress})`);
        }
      } else {
        // No session, just use the connected wallet
        setWalletAddress(connectedAddress);
        setAuthWalletAddress(null);
        setHasWalletMismatch(false);
      }
      
      // Update user profile with the active wallet address for reference
      try {
        const userInfo = localStorage.getItem('userProfile');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          localStorage.setItem(
            'userProfile',
            JSON.stringify({
              ...user,
              activeWalletAddress: connectedAddress,
              // Keep the auth wallet address in the profile if available
              authWalletAddress: sessionWalletAddress || connectedAddress,
            })
          );
        }
      } catch (error) {
        console.error('Failed to update user wallet info:', error);
      }
    } else if (!connected && !sessionWalletAddress) {
      // No connection at all
      setIsConnected(false);
      setWalletAddress(null);
      setAuthWalletAddress(null);
      setHasWalletMismatch(false);
    }
  }, [connected, publicKey, sessionWalletAddress, isAuthenticated]);

  // Auto-authenticate when wallet connects (but only if not already authenticated)
  useEffect(() => {
    const handleAutoAuth = async () => {
      // Skip auto-auth if:
      // 1. We're already authenticated via session
      // 2. Auto-auth is already in progress
      // 3. Initial session check hasn't completed 
      if (
        (isAuthenticated && sessionWalletAddress) || 
        autoAuthInProgress || 
        !initialCheckDone
      ) {
        return;
      }
      
      // Only auto-authenticate if we have a hardware wallet connection
      if (connected && publicKey) {
        setAutoAuthInProgress(true);

        try {
          console.log('Connected wallet detected, checking authentication status');
          
          // First check if we already have a valid token
          const cookieToken = getCookie('solana_auth_token')?.toString();
          const localToken = typeof localStorage !== 'undefined' 
            ? localStorage.getItem('solana_auth_token') 
            : null;
          
          const token = cookieToken || localToken;
          
          if (token) {
            const isValid = await validateTokenLocally(token) && 
                           await validateTokenWithServer(token);
            
            if (isValid) {
              console.log('Valid token exists, using existing authentication');
              setIsAuthenticated(true);
              
              // Extract and set wallet address from token
              const extractedAddress = extractWalletAddressFromToken(token);
              if (extractedAddress) {
                setSessionWalletAddress(extractedAddress);
              }
              
              return;
            }
          }
          
          // If no valid token exists or validation failed, initiate authentication
          console.log('No valid token found, initiating wallet authentication');
          await authenticate();
        } catch (error) {
          console.error('Auto-authentication error:', error);
        } finally {
          setAutoAuthInProgress(false);
        }
      }
    };

    handleAutoAuth();
  }, [connected, publicKey, isAuthenticated, initialCheckDone, sessionWalletAddress]);

  // Function to check if a page is protected
  const isProtectedPage = (path: string): boolean => {
    return !PUBLIC_ROUTES.some(
      route => path === route || (route !== '/' && path.startsWith(`${route}/`))
    );
  };

  // Connect to a wallet - this will open the wallet selection modal
  const connect = async () => {
    try {
      // If we're already authenticated via session, we're considered connected
      if (isAuthenticated && sessionWalletAddress) {
        console.log('Already connected via session wallet');
        return;
      }
      
      // The wallet modal will handle wallet selection
      console.log('Opening wallet modal from context');
      setVisible(true);
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error('Wallet connection error:', error);
    }
  };

  // Disconnect the wallet and clear session
  const disconnect = async () => {
    try {
      // Disconnect the hardware wallet if connected
      if (connected) {
        await adapterDisconnect();
      }

      // Clear auth tokens from localStorage and cookies
      clearAuthTokens();

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
    // If we're already authenticated via session, return true
    if (isAuthenticated && sessionWalletAddress) {
      console.log('Already authenticated via session wallet');
      
      // Check if there's a mismatch with the current wallet
      if (connected && publicKey) {
        const connectedAddress = publicKey.toBase58();
        setHasWalletMismatch(sessionWalletAddress !== connectedAddress);
      }
      
      return true;
    }
    
    // We need a connected hardware wallet to authenticate
    if (!connected || !publicKey || !adapterSignMessage) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      // Create a human-readable message for the wallet to sign
      const message = createSignatureMessage(publicKey.toBase58());
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
      
      // Extract wallet address from the message
      const extractedAddress = extractWalletAddressFromToken(token);
      if (extractedAddress) {
        setSessionWalletAddress(extractedAddress);
        setAuthWalletAddress(extractedAddress);
        setHasWalletMismatch(false); // No mismatch when we just authenticated
      }

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
    isConnected: isConnected || (!!sessionWalletAddress && isAuthenticated),
    connecting,
    walletAddress: walletAddress || sessionWalletAddress,
    activeWalletAddress, // Provide the actual connected wallet address
    authWalletAddress,   // Provide the authenticated wallet address
    hasWalletMismatch,   // Indicate if there's a mismatch between auth and connected wallets
    signMessage,
    connect,
    disconnect,
    isProtectedPage,
    isAuthenticated,
    authenticate,
  };

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
}