import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { apiMiddleware } from '../../../middleware';
import { mintTokensAfterDistributionCreated } from '@/lib/pop-utils';

interface Params {
  id: string;
}

// Helper to check user authorization for a POP
async function checkUserAuthorization(req: NextRequest, popId: string): Promise<boolean> {
  // Get user from session
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // For wallet-based auth, get wallet from request
  const walletAddress = (req as any).wallet?.address;

  // If neither session nor wallet, user is not authorized
  if (!userId && !walletAddress) {
    return false;
  }

  // First, fetch the POP with its creator
  const pop = await prisma.pop.findUnique({
    where: { id: popId },
    select: { creatorId: true },
  });

  if (!pop || !pop.creatorId) {
    return false;
  }

  // If user ID from session matches creator ID, they're authorized
  if (userId && pop.creatorId === userId) {
    return true;
  }

  // If using wallet auth, check if walletAddress matches a user that is the creator
  if (walletAddress) {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (user && pop.creatorId === user.id) {
      return true;
    }
  }

  // No conditions for authorization were met
  return false;
}

// GET handler to retrieve distribution methods
async function getHandler(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id: popId } = await params;

    // Check authorization
    const isAuthorized = await checkUserAuthorization(request as unknown as NextRequest, popId);

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            'Unauthorized: You do not have permission to access distribution methods for this POP',
        },
        { status: 403 }
      );
    }

    // Fetch distribution methods for this POP
    const distributionMethods = await prisma.distributionMethod.findMany({
      where: { popId, deleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        claimLinks: true,
        secretWord: true,
        locationBased: true,
        airdrop: true,
      },
    });

    return NextResponse.json({ distributionMethods });
  } catch (error) {
    console.error('Error fetching distribution methods:', error);
    return NextResponse.json({ error: 'Failed to fetch distribution methods' }, { status: 500 });
  }
}

// POST handler to create a new distribution method
async function postHandler(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id: popId } = await params;

    // Check authorization
    const isAuthorized = await checkUserAuthorization(request as unknown as NextRequest, popId);

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            'Unauthorized: You do not have permission to create distribution methods for this POP',
        },
        { status: 403 }
      );
    }
    console.log('POST request received for POP:', popId);

    // Parse request body
    const body = await request.json();

    // Validate distribution method type
    if (
      !body.type ||
      !['ClaimLinks', 'SecretWord', 'LocationBased', 'Airdrop'].includes(body.type)
    ) {
      return NextResponse.json({ error: 'Invalid distribution method type' }, { status: 400 });
    }

    // Check if this is the first distribution method being created
    const existingMethodsCount = await prisma.distributionMethod.count({
      where: {
        popId,
        deleted: false,
      },
    });

    const isFirstDistributionMethod = existingMethodsCount === 0;

    // Create a new distribution method
    let distributionMethod = await prisma.distributionMethod.create({
      data: {
        popId,
        type: body.type,
      },
    });

    // For specific distribution types, create their related data
    switch (body.type) {
      case 'SecretWord':
        if (!body.word) {
          return NextResponse.json({ error: 'Secret word is required' }, { status: 400 });
        }

        await prisma.secretWord.create({
          data: {
            distributionMethodId: distributionMethod.id,
            word: body.word,
            maxClaims: body.maxClaims || null,
            startDate: body.startDate ? new Date(body.startDate) : null,
            endDate: body.endDate ? new Date(body.endDate) : null,
          },
        });
        break;

      case 'LocationBased':
        if (!body.city) {
          return NextResponse.json(
            { error: 'City is required for location-based distribution' },
            { status: 400 }
          );
        }

        await prisma.locationBased.create({
          data: {
            distributionMethodId: distributionMethod.id,
            city: body.city,
            country: body.country || null,
            latitude: body.latitude || null,
            longitude: body.longitude || null,
            radius: body.radius || 500,
            maxClaims: body.maxClaims || null,
            startDate: body.startDate ? new Date(body.startDate) : null,
            endDate: body.endDate ? new Date(body.endDate) : null,
          },
        });
        break;

      case 'ClaimLinks':
        // Create the claim links
        if (!body.amount || typeof body.amount !== 'number' || body.amount < 1) {
          return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
        }

        // Function to generate a random token
        const generateToken = () => {
          const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          const length = 32;
          let token = '';
          for (let i = 0; i < length; i++) {
            token += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          return token;
        };

        // Create claim links with unique tokens and handle potential duplicates
        try {
          // Track already generated tokens to ensure uniqueness
          const generatedTokens = new Set();
          const claimLinks = [];

          for (let i = 0; i < body.amount; i++) {
            let token;
            // Generate a token that's not already in our set
            do {
              token = generateToken();
            } while (generatedTokens.has(token));

            // Add to our set to track uniqueness
            generatedTokens.add(token);

            claimLinks.push({
              distributionMethodId: distributionMethod.id,
              token,
              expiresAt: body.expiryDate ? new Date(body.expiryDate) : null,
            });
          }

          // Batch create all claim links
          await prisma.claimLink.createMany({
            data: claimLinks,
          });

          // Verify the correct number of links were created
          const createdCount = await prisma.claimLink.count({
            where: { distributionMethodId: distributionMethod.id },
          });

          // If we didn't create all the requested links, something went wrong
          if (createdCount !== body.amount) {
            console.warn(`Requested ${body.amount} claim links but created ${createdCount}`);
          }

          // Update the distributionMethod object with the newly created claim links
          distributionMethod =
            (await prisma.distributionMethod.findUnique({
              where: { id: distributionMethod.id },
              include: {
                claimLinks: true,
              },
            })) || distributionMethod;
        } catch (error) {
          console.error('Error creating claim links:', error);
          return NextResponse.json(
            {
              error: 'Failed to create claim links',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
          );
        }
        break;

      case 'Airdrop':
        // Validate addresses
        if (!Array.isArray(body.addresses) || body.addresses.length === 0) {
          return NextResponse.json({ error: 'Addresses array is required' }, { status: 400 });
        }

        // Create the Airdrop distribution method
        await prisma.airdrop.create({
          data: {
            distributionMethodId: distributionMethod.id,
            addresses: body.addresses,
            maxClaims: body.maxClaims || null,
            startDate: body.startDate ? new Date(body.startDate) : null,
            endDate: body.endDate ? new Date(body.endDate) : null,
          },
        });
        break;
    }

    // Check if tokens are already minted for this POP
    const existingToken = await prisma.popToken.findFirst({
      where: { popId },
    });

    // Track if we should show the mint modal
    let shouldShowMintModal = false;
    let mintResult = null;

    // If this is the first distribution method and no token exists, force token minting
    if (isFirstDistributionMethod || !existingToken) {
      try {
        // Create token record with 0 supply
        console.log(
          `Minting token for POP ${popId} as part of first distribution method creation.`
        );
        mintResult = await mintTokensAfterDistributionCreated(popId);

        if (mintResult?.success) {
          console.log(`Token created successfully: ${mintResult.mintAddress}`);
          shouldShowMintModal = isFirstDistributionMethod;
        } else {
          console.error('Failed to create token for POP');

          // Even if mintTokensAfterDistributionCreated fails, try direct API call as fallback
          if (isFirstDistributionMethod) {
            console.log('Attempting direct mint API call as fallback...');
            try {
              const directMintResponse = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pops/${popId}/mint`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({}),
                }
              );

              if (directMintResponse.ok) {
                const directMintResult = await directMintResponse.json();
                if (directMintResult.success) {
                  mintResult = {
                    success: true,
                    mintAddress: directMintResult.mintAddress,
                    message: 'Tokens minted successfully via fallback',
                  };
                  shouldShowMintModal = true;
                  console.log('Fallback mint succeeded');
                }
              }
            } catch (fallbackError) {
              console.error('Fallback mint attempt also failed:', fallbackError);
            }
          }
        }
      } catch (error) {
        // Log error but don't block distribution method creation
        console.error('Error creating token:', error);
      }
    } else {
      // Token already exists, no need to mint additional supply
      console.log(`Existing token found for POP ${popId}. No additional minting needed.`);
    }

    return NextResponse.json({
      success: true,
      distributionMethod,
      tokenMint: mintResult?.success
        ? {
            success: true,
            shouldShowMintModal,
            mintAddress: mintResult.mintAddress,
          }
        : null,
      isFirstDistributionMethod,
    });
  } catch (error) {
    console.error('Error creating distribution method:', error);
    return NextResponse.json({ error: 'Failed to create distribution method' }, { status: 500 });
  }
}

// Replace the current exports at the bottom with these proper exports
export function GET(request: NextRequest, ctx: { params: Promise<Params> }) {
  // Use apiMiddleware to handle authentication
  return apiMiddleware(request, async () => {
    return getHandler(request as Request, ctx);
  });
}

export function POST(request: NextRequest, ctx: { params: Promise<Params> }) {
  // Use apiMiddleware to handle authentication
  return apiMiddleware(request, async () => {
    return postHandler(request as Request, ctx);
  });
}
