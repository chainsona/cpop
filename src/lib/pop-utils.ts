import type { StatusDisplay, ColorPalette } from '@/types/pop';
import { prisma } from '@/lib/db';
import { post } from './api-client';

// Determine image type (external URL or base64)
export function isBase64Image(url: string): boolean {
  return url.startsWith('data:image/');
}

// Get a truncated version of the base64 image for display purposes
export function getTruncatedImageInfo(imageUrl: string): string {
  if (!isBase64Image(imageUrl)) return 'External URL';

  const size = (imageUrl.length * 3) / 4 / 1024; // Size in KB
  return `Base64 Image (${size.toFixed(0)}KB)`;
}

/**
 * Safely encode and prepare an image URL for Next.js Image component
 * Handles special characters in URLs that might cause encoding issues
 */
export function getSafeImageUrl(url: string): string {
  if (!url) return '';

  // Return base64 images as-is
  if (isBase64Image(url)) return url;

  try {
    // For URLs with special characters, we need proper encoding
    // Use URL constructor for proper parsing
    const urlObj = new URL(url);

    // Handle the search params separately to ensure proper encoding
    const searchParams = new URLSearchParams();

    // Get existing search params and re-add them with proper encoding
    for (const [key, value] of urlObj.searchParams.entries()) {
      searchParams.append(key, value);
    }

    // Build the final URL with encoded path and search params
    const encodedPath = encodeURI(decodeURI(urlObj.pathname));
    const encodedSearch = searchParams.toString();

    // Reconstruct the URL with properly encoded components
    return `${urlObj.protocol}//${urlObj.host}${encodedPath}${encodedSearch ? `?${encodedSearch}` : ''}`;
  } catch (e) {
    // If URL parsing fails, try a simple encoding approach as fallback
    console.error('Failed to encode image URL:', e);
    try {
      // For simple URLs without complex parameters, encode the whole URL
      return encodeURI(decodeURI(url));
    } catch {
      // If all encoding attempts fail, return the original URL
      return url;
    }
  }
}

// Color palettes - mapped to Tailwind config custom gradients
export const COLOR_PALETTES: ColorPalette[] = [
  {
    background: 'bg-blue-50',
    gradient: 'bg-blue-radial',
  },
  {
    background: 'bg-purple-50',
    gradient: 'bg-purple-radial',
  },
  {
    background: 'bg-green-50',
    gradient: 'bg-green-radial',
  },
  {
    background: 'bg-orange-50',
    gradient: 'bg-orange-radial',
  },
  {
    background: 'bg-pink-50',
    gradient: 'bg-pink-radial',
  },
];

// Get color palette for a POP based on its ID
export function getColorPaletteForId(id: string): ColorPalette {
  // Use the last 6 characters of the ID as the basis for our color
  const seed = id.slice(-6);

  // Simple hash function to generate a number from the seed
  const hashNumber = seed.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  // Use the hash to pick from predefined color schemes
  const colorSchemes = [
    {
      name: 'blue',
      gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      border: 'border-blue-200',
      text: 'text-blue-700',
      lightBg: 'bg-blue-50',
      background: 'bg-blue-50',
    },
    {
      name: 'purple',
      gradient: 'bg-gradient-to-br from-purple-50 to-indigo-100',
      border: 'border-purple-200',
      text: 'text-purple-700',
      lightBg: 'bg-purple-50',
      background: 'bg-purple-50',
    },
    {
      name: 'green',
      gradient: 'bg-gradient-to-br from-green-50 to-emerald-100',
      border: 'border-green-200',
      text: 'text-green-700',
      lightBg: 'bg-green-50',
      background: 'bg-green-50',
    },
    {
      name: 'amber',
      gradient: 'bg-gradient-to-br from-amber-50 to-orange-100',
      border: 'border-amber-200',
      text: 'text-amber-700',
      lightBg: 'bg-amber-50',
      background: 'bg-amber-50',
    },
    {
      name: 'rose',
      gradient: 'bg-gradient-to-br from-rose-50 to-pink-100',
      border: 'border-rose-200',
      text: 'text-rose-700',
      lightBg: 'bg-rose-50',
      background: 'bg-rose-50',
    },
  ];

  return colorSchemes[Math.abs(hashNumber) % colorSchemes.length];
}

// Get status display information without JSX
export function getStatusDisplay(
  status: 'Draft' | 'Published' | 'Distributed' | 'Unclaimable' | 'Disabled' | 'Deleted'
): Omit<StatusDisplay, 'icon'> & { iconName: string } {
  switch (status) {
    case 'Draft':
      return {
        label: 'Draft',
        color: 'text-neutral-600',
        bgColor: 'bg-neutral-100',
        borderColor: 'border-neutral-200',
        iconName: 'FilePenLine',
      };
    case 'Published':
      return {
        label: 'Published',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        iconName: 'BookOpen',
      };
    case 'Distributed':
      return {
        label: 'Distributed',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        iconName: 'Award',
      };
    case 'Unclaimable':
      return {
        label: 'Unclaimable',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        iconName: 'AlertTriangle',
      };
    case 'Disabled':
      return {
        label: 'Disabled',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        iconName: 'XCircle',
      };
    case 'Deleted':
      return {
        label: 'Deleted',
        color: 'text-white',
        bgColor: 'bg-neutral-700',
        borderColor: 'border-neutral-800',
        iconName: 'Trash2',
      };
  }
}

/**
 * Updates the POP status based on its distribution methods
 * - If at least one distribution method is active (not disabled and not deleted), set status to "Published"
 * - If there are distribution methods but all are disabled or deleted, set status to "Unclaimable"
 * - Otherwise, keep the existing status
 */
export async function updatePopStatusBasedOnDistributionMethods(popId: string): Promise<void> {
  try {
    // Get all distribution methods for this POP
    const distributionMethods = await prisma.distributionMethod.findMany({
      where: {
        popId: popId,
      },
    });

    // No distribution methods, don't change the status
    if (distributionMethods.length === 0) {
      return;
    }

    // Check if there are any active distribution methods
    const activeDistributionMethods = distributionMethods.filter(
      (method: { disabled: boolean; deleted: boolean }) => !method.disabled && !method.deleted
    );

    // Determine the new status
    if (activeDistributionMethods.length > 0) {
      // At least one active distribution method - set to Published
      await prisma.pop.update({
        where: { id: popId },
        data: { status: 'Published' },
      });
    } else {
      // There are distribution methods but none are active - now we can use 'Unclaimable'
      await prisma.pop.update({
        where: { id: popId },
        data: { status: 'Unclaimable' },
      });
    }
  } catch (error) {
    console.error('Error updating POP status:', error);
    // Let the caller handle the error
    throw error;
  }
}

/**
 * Mints tokens for a POP if not already minted
 * This function can be called from the server
 * @param popId The ID of the POP to mint tokens for
 * @returns The result of the mint operation or null if it fails
 */
export async function mintTokensAfterDistributionCreated(popId: string): Promise<any> {
  try {
    console.log(`Checking token status for POP ${popId}`);

    // Check if tokens are already minted
    const existingToken = await prisma.popToken.findFirst({
      where: { popId },
    });

    if (existingToken) {
      console.log(`Tokens already minted for POP ${popId}`, existingToken);
      return {
        success: true,
        message: 'Tokens already minted',
        mintAddress: existingToken.mintAddress,
        tokenId: existingToken.id,
      };
    }

    // Get the POP data
    const pop = await prisma.pop.findUnique({
      where: { id: popId },
    });

    if (!pop) {
      throw new Error(`POP ${popId} not found`);
    }

    // Check if this is the first distribution method
    const distributionMethodCount = await prisma.distributionMethod.count({
      where: {
        popId,
        deleted: false,
      },
    });

    const isFirstDistributionMethod = distributionMethodCount === 1;
    console.log(
      `POP ${popId} has ${distributionMethodCount} distribution methods. First method: ${isFirstDistributionMethod}`
    );

    // Always mint token for the first distribution method
    if (isFirstDistributionMethod) {
      console.log(`Minting first token for POP ${popId}`);
    } else {
      console.log(`Minting token for POP ${popId} (not first distribution method)`);
    }
    
    // Final check to see if a token was created in a parallel process (race condition)
    const confirmedToken = await prisma.popToken.findFirst({
      where: { popId },
    });
    
    if (confirmedToken) {
      console.log(`Token was created in parallel for POP ${popId}`, confirmedToken);
      return {
        success: true,
        message: 'Tokens already minted (parallel process)',
        mintAddress: confirmedToken.mintAddress,
        tokenId: confirmedToken.id,
      };
    }

    // Make a POST request to the API endpoint with a maximum of 3 retries
    let attempt = 0;
    const maxAttempts = 3;
    let lastError = null;

    // Get cookies from server context if running server-side
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Try to get the auth cookie from the request context if running server-side
    if (typeof window === 'undefined' && typeof document === 'undefined' && process.env.NEXT_AUTH_SECRET) {
      const { cookies } = require('next/headers');
      const cookieStore = cookies();
      const authToken = cookieStore.get('next-auth.session-token')?.value;
      
      if (authToken) {
        headers['Cookie'] = `next-auth.session-token=${authToken}`;
      }
    }

    while (attempt < maxAttempts) {
      attempt++;
      try {
        console.log(`Attempt ${attempt}/${maxAttempts} to mint token for POP ${popId}`);
        // Pass in headers with auth context
        const response = (await post(`/api/pops/${popId}/mint`, {}, { headers })) as {
          success: boolean;
          message?: string;
          error?: string;
          mintAddress?: string;
        };

        if (!response.success) {
          lastError = response.error || 'Failed to mint tokens';
          console.error(`Attempt ${attempt} failed: ${lastError}`);

          // If we still have attempts left, wait a bit before retrying
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }

          throw new Error(lastError);
        }

        console.log(`Successfully minted token for POP ${popId} on attempt ${attempt}`);

        return {
          success: true,
          message: 'Tokens minted successfully',
          mintAddress: response.mintAddress,
          isFirstDistributionMethod, // Return flag to indicate if this was the first distribution method
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error on attempt ${attempt}:`, error);

        // If we still have attempts left, wait a bit before retrying
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
    }

    throw new Error(lastError || 'Failed to mint tokens after multiple attempts');
  } catch (error) {
    console.error('Error minting tokens after distribution creation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculates the additional supply needed for a new distribution method
 * @param distributionMethodId The ID of the newly created distribution method
 * @returns The additional supply needed (0 if none)
 */
export async function calculateAdditionalSupplyNeeded(
  distributionMethodId: string
): Promise<number> {
  try {
    const method = await prisma.distributionMethod.findUnique({
      where: { id: distributionMethodId },
      include: {
        claimLinks: true,
        secretWord: true,
        locationBased: true,
      },
    });

    if (!method) {
      console.error(`Distribution method ${distributionMethodId} not found`);
      return 0;
    }

    let additionalSupply = 0;

    // Calculate additional supply based on the distribution method type
    if (method.type === 'ClaimLinks' && method.claimLinks) {
      additionalSupply = method.claimLinks.length;
    } else if (method.type === 'SecretWord' && method.secretWord) {
      additionalSupply = method.secretWord.maxClaims || 0;
    } else if (method.type === 'LocationBased' && method.locationBased) {
      additionalSupply = method.locationBased.maxClaims || 0;
    } else if (method.type === 'Airdrop') {
      // Fetch the airdrop data explicitly since it's not included in the initial query
      const airdrop = await prisma.airdrop.findUnique({
        where: { distributionMethodId: method.id },
      });
      additionalSupply = airdrop?.addresses?.length || 0;
    }

    return additionalSupply;
  } catch (error) {
    console.error('Error calculating additional supply:', error);
    return 0;
  }
}

/**
 * Mints additional tokens for an existing POP token
 * @param popId The ID of the POP
 * @param additionalSupply The additional supply to mint
 * @returns The result of the mint operation or null if it fails
 */
export async function mintAdditionalTokenSupply(
  popId: string,
  additionalSupply: number
): Promise<any> {
  try {
    if (additionalSupply <= 0) {
      console.log(`No additional supply needed for POP ${popId}`);
      return null;
    }

    // Check if token exists
    const token = await prisma.popToken.findFirst({
      where: { popId },
    });

    if (!token) {
      console.error(`No token found for POP ${popId}`);
      return null;
    }

    // Instead of importing from the route, make a POST request to the API endpoint
    const response = (await post(`/api/pops/${popId}/mint/additional`, {
      additionalSupply,
    })) as {
      success: boolean;
      message?: string;
      error?: string;
      mintAddress?: string;
    };

    if (!response.success) {
      throw new Error(response.error || 'Failed to mint additional tokens');
    }

    return {
      success: true,
      message: 'Additional tokens minted successfully',
      additionalSupply,
      mintAddress: token.mintAddress,
    };
  } catch (error) {
    console.error('Error minting additional token supply:', error);
    return null;
  }
}
