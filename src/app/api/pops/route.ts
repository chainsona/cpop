import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { popFormSchema } from '@/lib/validations';
import { startOfDay, endOfDay } from 'date-fns';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { apiMiddleware } from '../middleware';
import { PopStatus } from '@/generated/prisma';

async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    // Base64 images are already validated client-side and are accepted as is
    if (imageUrl.startsWith('data:image/')) {
      return true;
    }

    // For http(s) URLs, check that the image actually exists
    const response = await fetch(imageUrl, { method: 'HEAD' });

    if (!response.ok) {
      return false;
    }

    // Verify content type is an image
    const contentType = response.headers.get('content-type');
    return contentType ? contentType.startsWith('image/') : false;
  } catch (error) {
    console.error('Image validation error:', error);
    return false;
  }
}

// Check if the image size is too large
function isBase64ImageTooLarge(base64String: string, maxSizeInMB: number = 2): boolean {
  // Remove the data URL prefix (like "data:image/png;base64,")
  const base64Data = base64String.split(',')[1] || base64String;

  // Calculate size: base64 uses ~4 characters per 3 bytes
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  return sizeInMB > maxSizeInMB;
}

// POST handler to create a new POP
async function postHandler(request: NextRequest) {
  try {
    // Get user from session for creator assignment
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // For wallet-based auth, get wallet from request
    const walletAddress = (request as any).wallet?.address;
    
    // If neither session nor wallet, return unauthorized
    if (!userId && !walletAddress) {
      return NextResponse.json(
        { error: 'Unauthorized: Please connect your wallet or sign in' },
        { status: 401 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();

    // Create a user if not exists - in case of wallet auth only
    let creatorId = userId;
    if (!creatorId && walletAddress) {
      const user = await prisma.user.findUnique({
        where: { walletAddress },
      });

      if (user) {
        creatorId = user.id;
      } else {
        // Create a new user with the wallet address
        const newUser = await prisma.user.create({
          data: {
            walletAddress,
            name: `User ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
          },
        });
        creatorId = newUser.id;
      }
    }

    try {
      // Validate against our schema first
      const validatedData = popFormSchema.parse(body);

      // Check if the image URL is valid
      const isImageValid = await validateImageUrl(validatedData.imageUrl);
      if (!isImageValid && validatedData.imageUrl !== 'https://placehold.co/600x400?text=POP+Image') {
        return NextResponse.json(
          { error: 'Invalid image URL: Unable to verify image' },
          { status: 400 }
        );
      }

      // Extract settings from the request if they exist
      const { settings, ...popData } = body;

      // Create the new POP in the database with creator info and settings
      const pop = await prisma.pop.create({
        data: {
          ...popData,
          creatorId, // Associate POP with the creator
          ...(settings && {
            settings: {
              create: {
                visibility: settings.visibility || 'Public',
                allowSearch: settings.allowSearch ?? true,
                notifyOnClaim: true,
              }
            }
          })
        },
        include: {
          settings: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'POP created successfully',
        pop,
      });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation error',
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Error creating POP:', error);

    return NextResponse.json(
      {
        error: 'Failed to create POP',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// GET handler to fetch POPs
async function getHandler(request: NextRequest) {
  try {
    // Get user from session for filtering
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // For wallet-based auth, get wallet from request
    const walletAddress = (request as any).wallet?.address;
    
    // Require authentication for all POP requests
    if (!userId && !walletAddress) {
      // Always return unauthorized for unauthenticated requests
      return NextResponse.json(
        { error: 'Unauthorized: Please connect your wallet or sign in' },
        { status: 401 }
      );
    }
    
    // Build the query based on authentication
    const where: any = {
      // Filter out POPs with 'Deleted' status
      status: {
        not: PopStatus.Deleted
      }
    };
    
    if (userId) {
      // If authenticated with NextAuth, strictly filter by creator ID
      where.creatorId = userId;
      
      console.log(`Fetching POPs created by user with id: ${userId}`);
    } else if (walletAddress) {
      // If authenticated with wallet, find the user by wallet address
      const user = await prisma.user.findUnique({
        where: { walletAddress },
        select: { id: true } // Only get the id to reduce data transfer
      });
      
      if (user) {
        // Strictly filter by creator ID from the wallet user
        where.creatorId = user.id;
        console.log(`Fetching POPs created by wallet user with id: ${user.id}`);
      } else {
        // If no user found with this wallet, return empty list
        console.log(`No user found for wallet address: ${walletAddress}`);
        return NextResponse.json({ pops: [] });
      }
    }
    
    // Fetch POPs with the constructed filter - only the user's own POPs
    const pops = await prisma.pop.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        settings: true
      }
    });

    console.log(`Found ${pops.length} POPs for the authenticated user`);

    // If we have pops and need creator information, fetch it separately
    if (pops.length > 0) {
      const creatorIds = pops
        .map(pop => pop.creatorId)
        .filter(Boolean) as string[];
      
      if (creatorIds.length > 0) {
        const creators = await prisma.user.findMany({
          where: {
            id: {
              in: creatorIds
            }
          },
          select: {
            id: true,
            name: true,
            walletAddress: true,
          }
        });
        
        // Map creators to pops
        const creatorMap = new Map(creators.map(creator => [creator.id, creator]));
        
        // Attach creator info to each pop
        const popsWithCreators = pops.map(pop => ({
          ...pop,
          creator: pop.creatorId ? creatorMap.get(pop.creatorId) || null : null
        }));
        
        return NextResponse.json({ pops: popsWithCreators });
      }
    }

    return NextResponse.json({ pops });
  } catch (error) {
    console.error('Error fetching POPs:', error);

    return NextResponse.json({ error: 'Failed to fetch POPs' }, { status: 500 });
  }
}

// Export wrapped handlers with auth middleware
export const POST = (request: NextRequest) => apiMiddleware(request, () => postHandler(request));
export const GET = (request: NextRequest) => apiMiddleware(request, () => getHandler(request));
