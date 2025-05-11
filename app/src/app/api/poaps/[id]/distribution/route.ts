import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { apiMiddleware } from '../../../middleware';
import {
  mintTokensAfterDistributionCreated,
  calculateAdditionalSupplyNeeded,
  mintAdditionalTokenSupply,
} from '@/lib/poap-utils';

interface Params {
  id: string;
}

// Helper to check user authorization for a POAP
async function checkUserAuthorization(req: NextRequest, poapId: string): Promise<boolean> {
  // Get user from session
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // For wallet-based auth, get wallet from request
  const walletAddress = (req as any).wallet?.address;

  // If neither session nor wallet, user is not authorized
  if (!userId && !walletAddress) {
    return false;
  }

  // First, fetch the POAP with its creator
  const poap = await prisma.poap.findUnique({
    where: { id: poapId },
    select: { creatorId: true },
  });

  if (!poap || !poap.creatorId) {
    return false;
  }

  // If user ID from session matches creator ID, they're authorized
  if (userId && poap.creatorId === userId) {
    return true;
  }

  // If using wallet auth, check if walletAddress matches a user that is the creator
  if (walletAddress) {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (user && poap.creatorId === user.id) {
      return true;
    }
  }

  // No conditions for authorization were met
  return false;
}

// GET handler to retrieve distribution methods
async function getHandler(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id: poapId } = await params;

    // Check authorization
    const isAuthorized = await checkUserAuthorization(request as unknown as NextRequest, poapId);

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            'Unauthorized: You do not have permission to access distribution methods for this POAP',
        },
        { status: 403 }
      );
    }

    // Fetch distribution methods for this POAP
    const distributionMethods = await prisma.distributionMethod.findMany({
      where: { poapId, deleted: false },
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
    const { id: poapId } = await params;

    // Check authorization
    const isAuthorized = await checkUserAuthorization(request as unknown as NextRequest, poapId);

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            'Unauthorized: You do not have permission to create distribution methods for this POAP',
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate distribution method type
    if (
      !body.type ||
      !['ClaimLinks', 'SecretWord', 'LocationBased', 'Airdrop'].includes(body.type)
    ) {
      return NextResponse.json({ error: 'Invalid distribution method type' }, { status: 400 });
    }

    // Create a new distribution method
    let distributionMethod = await prisma.distributionMethod.create({
      data: {
        poapId,
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

    // Check if tokens are already minted for this POAP
    const existingToken = await prisma.poapToken.findFirst({
      where: { poapId },
    });

    // Always ensure token exists, but don't mint more supply
    if (!existingToken) {
      try {
        // Create token record with 0 supply
        console.log(`No existing token found for POAP ${poapId}. Creating token.`);
        const mintResult = await mintTokensAfterDistributionCreated(poapId);

        if (mintResult?.success) {
          console.log(`Token created successfully: ${mintResult.mintAddress}`);
        } else {
          console.error('Failed to create token for POAP');
        }
      } catch (error) {
        // Log error but don't block distribution method creation
        console.error('Error creating token:', error);
      }
    } else {
      // Token already exists, no need to mint additional supply
      console.log(`Existing token found for POAP ${poapId}. No additional minting needed.`);
    }

    return NextResponse.json({
      success: true,
      distributionMethod,
    });
  } catch (error) {
    console.error('Error creating distribution method:', error);
    return NextResponse.json({ error: 'Failed to create distribution method' }, { status: 500 });
  }
}

// Export wrapped handlers with auth middleware
export const GET = (request: NextRequest, ctx: { params: Promise<Params> }) =>
  apiMiddleware(request, async () => getHandler(request as Request, ctx));

export const POST = (request: NextRequest, ctx: { params: Promise<Params> }) =>
  apiMiddleware(request, async () => postHandler(request as Request, ctx));
