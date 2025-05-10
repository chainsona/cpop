import type { StatusDisplay, ColorPalette } from '@/types/poap';
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

// Get color palette for a POAP based on its ID
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
  status: 'Draft' | 'Published' | 'Distributed' | 'Unclaimable'
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
  }
}

/**
 * Updates the POAP status based on its distribution methods
 * - If at least one distribution method is active (not disabled and not deleted), set status to "Published"
 * - If there are distribution methods but all are disabled or deleted, set status to "Unclaimable"
 * - Otherwise, keep the existing status
 */
export async function updatePoapStatusBasedOnDistributionMethods(poapId: string): Promise<void> {
  try {
    // Get all distribution methods for this POAP
    const distributionMethods = await prisma.distributionMethod.findMany({
      where: {
        poapId: poapId,
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
      await prisma.poap.update({
        where: { id: poapId },
        data: { status: 'Published' },
      });
    } else {
      // There are distribution methods but none are active - now we can use 'Unclaimable'
      await prisma.poap.update({
        where: { id: poapId },
        data: { status: 'Unclaimable' },
      });
    }
  } catch (error) {
    console.error('Error updating POAP status:', error);
    // Let the caller handle the error
    throw error;
  }
}

/**
 * Mints tokens for a POAP if not already minted
 * This function can be called from the server
 * @param poapId The ID of the POAP to mint tokens for
 * @returns The result of the mint operation or null if it fails
 */
export async function mintTokensAfterDistributionCreated(poapId: string): Promise<any> {
  try {
    // Import module dynamically
    const mintModule = await import('../app/api/poaps/[id]/mint/route');
    const { mintCompressedTokens } = mintModule;

    // Check if tokens are already minted
    const existingToken = await prisma.poapToken.findFirst({
      where: { poapId },
    });

    if (existingToken) {
      console.log(`Tokens already minted for POAP ${poapId}`);
      return {
        success: true,
        message: 'Tokens already minted',
        tokenSupply: existingToken.supply,
        mintAddress: existingToken.mintAddress,
      };
    }

    // Get the POAP data
    const poap = await prisma.poap.findUnique({
      where: { id: poapId },
    });

    if (!poap) {
      throw new Error(`POAP ${poapId} not found`);
    }

    // Calculate total token supply from all active distribution methods
    const distributionMethods = await prisma.distributionMethod.findMany({
      where: {
        poapId,
        disabled: false,
      },
    });

    let totalSupply = 0;

    for (const method of distributionMethods) {
      if (method.type === 'ClaimLinks') {
        const claimLinks = await prisma.claimLink.findMany({
          where: { distributionMethodId: method.id },
        });
        totalSupply += claimLinks.length;
      } else if (method.type === 'SecretWord') {
        const secretWord = await prisma.secretWord.findUnique({
          where: { distributionMethodId: method.id },
        });
        totalSupply += secretWord?.maxClaims || 0;
      } else if (method.type === 'LocationBased') {
        const locationBased = await prisma.locationBased.findUnique({
          where: { distributionMethodId: method.id },
        });
        totalSupply += locationBased?.maxClaims || 0;
      }
    }

    // If no supply is specified, mint with 0 supply
    if (totalSupply <= 0) {
      console.log('No supply specified in distribution methods, minting with 0 supply');
      totalSupply = 0;
    }

    // Mint tokens directly
    const mintAddress = await mintCompressedTokens(
      {
        ...poap,
        createdAt: poap.createdAt, // Ensure this is passed
      },
      totalSupply
    );

    return {
      success: true,
      message: 'Tokens minted successfully',
      tokenSupply: totalSupply,
      mintAddress,
    };
  } catch (error) {
    console.error('Error minting tokens after distribution creation:', error);
    return null;
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
    }

    return additionalSupply;
  } catch (error) {
    console.error('Error calculating additional supply:', error);
    return 0;
  }
}

/**
 * Mints additional tokens for an existing POAP token
 * @param poapId The ID of the POAP
 * @param additionalSupply The additional supply to mint
 * @returns The result of the mint operation or null if it fails
 */
export async function mintAdditionalTokenSupply(
  poapId: string,
  additionalSupply: number
): Promise<any> {
  try {
    if (additionalSupply <= 0) {
      console.log(`No additional supply needed for POAP ${poapId}`);
      return null;
    }

    // Check if token exists
    const token = await prisma.poapToken.findFirst({
      where: { poapId },
    });

    if (!token) {
      console.error(`No token found for POAP ${poapId}`);
      return null;
    }

    // Import module dynamically
    const additionalModule = await import('../app/api/poaps/[id]/mint/additional/route');
    const { mintAdditionalTokens } = additionalModule;

    // Mint additional tokens directly
    const result = await mintAdditionalTokens(poapId, additionalSupply);

    return {
      success: true,
      message: 'Additional tokens minted successfully',
      additionalSupply,
      mintAddress: token.mintAddress,
      newTotalSupply: token.supply + additionalSupply,
    };
  } catch (error) {
    console.error('Error minting additional token supply:', error);
    return null;
  }
}
