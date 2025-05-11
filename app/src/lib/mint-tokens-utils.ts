'use client';

import { toast } from 'sonner';

/**
 * Unified utility function to mint POAP tokens
 * This centralized function can be called from any component that needs to mint tokens
 */
export async function mintPOAPTokens({
  poapId,
  authenticate,
  isAuthenticated,
  onSuccess,
  onError,
  onMintStart,
}: {
  poapId: string;
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
    const response = await fetch(`/api/poaps/${poapId}/mint`, {
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
  poapId,
  maxAttempts = 10,
  intervalMs = 3000,
  onMinted,
  onTimeout,
  onProgress,
}: {
  poapId: string;
  maxAttempts?: number;
  intervalMs?: number;
  onMinted?: () => void;
  onTimeout?: () => void;
  onProgress?: (message: string) => void;
}) {
  let attempts = 0;

  // Check if token is minted
  const checkTokenMinted = async () => {
    try {
      const attemptMessage = `Checking token status for POAP ${poapId} (attempt ${attempts + 1}/${maxAttempts})`;
      console.log(attemptMessage);
      if (onProgress) {
        onProgress(attemptMessage);
      }

      const response = await fetch(`/api/poaps/${poapId}/token/status`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      // Handle specific status codes
      if (response.status === 404) {
        console.warn(
          `Token status endpoint not found for POAP ${poapId}. This might be expected if the endpoint is still being deployed.`
        );
        return { minted: false, error: 'endpoint-not-found' };
      }

      if (!response.ok) {
        console.error(
          `Error response from token status check: ${response.status} ${response.statusText}`
        );
        return { minted: false, error: 'server-error' };
      }

      const data = await response.json();
      console.log(`Token status response for POAP ${poapId}:`, data);

      // If we get successful response but no minted status, consider it as not minted
      if (data && typeof data.minted === 'boolean') {
        return { minted: data.minted, mintAddress: data.mintAddress };
      } else {
        console.warn(`Unexpected token status response format for POAP ${poapId}:`, data);
        return { minted: false, error: 'invalid-response' };
      }
    } catch (error) {
      console.error('Error checking token mint status:', error);
      return { minted: false, error: 'network-error' };
    }
  };

  // Initial check
  const initialStatus = await checkTokenMinted();
  if (initialStatus.minted) {
    console.log(`Token already minted for POAP ${poapId}`);
    if (onMinted) onMinted();
    return { minted: true, mintAddress: initialStatus.mintAddress };
  }

  // Set up polling
  return new Promise<{ minted: boolean; mintAddress?: string }>(resolve => {
    const interval = setInterval(async () => {
      attempts++;
      const status = await checkTokenMinted();

      if (status.minted) {
        clearInterval(interval);
        console.log(`Token minted for POAP ${poapId} after ${attempts} attempts`);
        if (onMinted) onMinted();
        resolve({ minted: true, mintAddress: status.mintAddress });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.log(`Max attempts (${maxAttempts}) reached for POAP ${poapId}. Token not minted.`);
        if (onTimeout) onTimeout();
        resolve({ minted: false });
      }
    }, intervalMs);
  });
}
