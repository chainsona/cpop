'use client';

import { toast } from 'sonner';
import { checkTokenMinted } from './token-utils';

/**
 * Unified utility function to mint POP tokens
 * This centralized function can be called from any component that needs to mint tokens
 */
export async function mintPOPTokens({
  popId,
  authenticate,
  isAuthenticated,
  onSuccess,
  onError,
  onMintStart,
}: {
  popId: string;
  authenticate: () => Promise<boolean>;
  isAuthenticated: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onMintStart?: () => void;
}) {
  try {
    // Signal that minting has started
    if (onMintStart) {
      onMintStart();
    }

    // Ensure we're authenticated before minting tokens
    if (!isAuthenticated) {
      const success = await authenticate();
      if (!success) {
        const errorMessage = 'Authentication failed. Please log in and try again.';
        if (onError) onError(errorMessage);
        return { success: false, error: errorMessage };
      }
    }

    // Get the Solana auth token exactly as stored by the wallet context
    const solanaToken =
      typeof window !== 'undefined' ? localStorage.getItem('solana_auth_token') : null;

    if (!solanaToken) {
      const errorMessage = 'Authentication token not found. Please log in again.';
      if (onError) onError(errorMessage);
      return { success: false, error: errorMessage };
    }

    // Make API call to mint tokens
    const response = await fetch(`/api/pops/${popId}/mint`, {
      method: 'POST',
      headers: {
        Authorization: `Solana ${solanaToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        const errorMessage = 'Authentication failed. Please log in again.';
        if (onError) onError(errorMessage);
        await authenticate();
        return { success: false, error: errorMessage };
      } else {
        throw new Error(errorData.error || 'Failed to mint tokens');
      }
    }

    const data = await response.json();

    toast.success('Tokens minted successfully!');

    if (onSuccess) {
      onSuccess(data);
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error minting tokens:', err);
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to mint tokens. Please try again.';
    toast.error(errorMessage);

    if (onError) {
      onError(errorMessage);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Utility function to poll for token minting status
 * This can be called after creating a distribution method to check if tokens are minted
 */
export async function pollForTokenMintStatus({
  popId,
  maxAttempts = 30,
  intervalMs = 500,
  onMinted,
  onTimeout,
  onProgress,
}: {
  popId: string;
  maxAttempts?: number;
  intervalMs?: number;
  onMinted?: () => void;
  onTimeout?: () => void;
  onProgress?: (message: string) => void;
}) {
  let attempts = 0;

  // Helper function to check token status with progress updates
  const checkToken = async () => {
    const attemptMessage = `Checking token status for POP ${popId} (attempt ${attempts + 1}/${maxAttempts})`;
    console.log(attemptMessage);
    if (onProgress) {
      onProgress(attemptMessage);
    }

    return await checkTokenMinted(popId, { endpoint: 'token/status' });
  };

  // Initial check
  const initialStatus = await checkToken();
  if (initialStatus.minted) {
    console.log(`Token already minted for POP ${popId}`);
    if (onMinted) onMinted();
    return { minted: true, mintAddress: initialStatus.mintAddress };
  }

  // Set up polling with exponential backoff
  return new Promise<{ minted: boolean; mintAddress?: string }>(resolve => {
    let currentInterval = intervalMs;
    const maxInterval = 1000; // Maximum interval of 3 seconds

    const interval = setInterval(async () => {
      attempts++;
      const status = await checkToken();

      if (status.minted) {
        clearInterval(interval);
        console.log(`Token minted for POP ${popId} after ${attempts} attempts`);
        if (onMinted) onMinted();
        resolve({ minted: true, mintAddress: status.mintAddress });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.log(`Max attempts (${maxAttempts}) reached for POP ${popId}. Token not minted.`);
        if (onTimeout) onTimeout();
        resolve({ minted: false });
      } else {
        // Adjust interval with exponential backoff (but cap at maxInterval)
        currentInterval = Math.min(currentInterval * 1.5, maxInterval);
        clearInterval(interval);

        // Set new interval with updated timing
        setTimeout(() => {
          const newInterval = setInterval(async () => {
            attempts++;
            const status = await checkToken();

            if (status.minted) {
              clearInterval(newInterval);
              console.log(`Token minted for POP ${popId} after ${attempts} attempts`);
              if (onMinted) onMinted();
              resolve({ minted: true, mintAddress: status.mintAddress });
            } else if (attempts >= maxAttempts) {
              clearInterval(newInterval);
              console.log(
                `Max attempts (${maxAttempts}) reached for POP ${popId}. Token not minted.`
              );
              if (onTimeout) onTimeout();
              resolve({ minted: false });
            }
          }, currentInterval);
        }, currentInterval);
      }
    }, currentInterval);
  });
}

/**
 * Unified function to handle the complete token minting flow:
 * 1. Initial check if token is already minted
 * 2. Mint the token if not already minted
 * 3. Poll for confirmation of minting
 * 
 * @param options Configuration options for the minting process
 * @returns Promise with the result of the operation
 */
export async function mintTokensAndPoll({
  popId,
  authenticate,
  isAuthenticated,
  onStart,
  onMinted,
  onError,
  onProgress,
  maxAttempts = 5,
  intervalMs = 250,
}: {
  popId: string;
  authenticate?: () => Promise<boolean>;
  isAuthenticated?: boolean;
  onStart?: () => void;
  onMinted?: (data: { mintAddress?: string }) => void;
  onError?: (error: string) => void;
  onProgress?: (message: string) => void;
  maxAttempts?: number;
  intervalMs?: number;
}): Promise<{ success: boolean; mintAddress?: string; error?: string }> {
  try {
    // Step 1: Signal that the process is starting
    if (onStart) {
      onStart();
    }
    
    if (onProgress) {
      onProgress('Checking if tokens are already minted...');
    }
    
    // Step 2: Initial check if tokens already exist
    const initialStatus = await checkTokenMinted(popId, { endpoint: 'token/status' });
    
    // If already minted, return success immediately
    if (initialStatus.minted) {
      if (onProgress) {
        onProgress('Tokens already minted');
      }
      if (onMinted) {
        onMinted({ mintAddress: initialStatus.mintAddress });
      }
      return { 
        success: true, 
        mintAddress: initialStatus.mintAddress 
      };
    }
    
    // Step 3: Tokens not minted, initiate minting
    if (onProgress) {
      onProgress('Initiating token minting...');
    }
    
    // Only authenticate if needed and the function is provided
    if (authenticate && isAuthenticated === false) {
      const authSuccess = await authenticate();
      if (!authSuccess) {
        const errorMessage = 'Authentication failed. Please log in and try again.';
        if (onError) onError(errorMessage);
        return { success: false, error: errorMessage };
      }
    }
    
    // Mint tokens
    const mintResult = await mintPOPTokens({
      popId,
      authenticate: authenticate || (() => Promise.resolve(true)),
      isAuthenticated: isAuthenticated || false,
      onMintStart: () => {
        if (onProgress) onProgress('Minting tokens...');
      },
      onSuccess: (data) => {
        if (onProgress) onProgress('Tokens minted, awaiting confirmation...');
      },
      onError
    });
    
    if (!mintResult.success) {
      // If direct mint failed but we have no specific error, try polling anyway
      // as the backend might be processing the mint asynchronously
      if (!mintResult.error) {
        if (onProgress) {
          onProgress('Mint status unclear, checking status...');
        }
      } else {
        // If we have a specific error, report it but still try polling
        if (onProgress) {
          onProgress(`Mint reported error: ${mintResult.error}. Checking status anyway...`);
        }
      }
    }
    
    // Step 4: Poll for confirmation of minting
    if (onProgress) {
      onProgress('Polling for token minting confirmation...');
    }
    
    const pollResult = await pollForTokenMintStatus({
      popId,
      maxAttempts,
      intervalMs,
      onProgress,
      onMinted: () => {
        if (onMinted) {
          onMinted({ mintAddress: pollResult.mintAddress });
        }
      },
      onTimeout: () => {
        if (onError) {
          onError('Timeout waiting for token minting confirmation');
        }
      }
    });
    
    return {
      success: pollResult.minted,
      mintAddress: pollResult.mintAddress,
      error: pollResult.minted ? undefined : 'Timeout waiting for token minting confirmation'
    };
    
  } catch (error) {
    console.error('Error in mintTokensAndPoll:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred during token minting';
    
    if (onError) {
      onError(errorMessage);
    }
    
    return { success: false, error: errorMessage };
  }
}
