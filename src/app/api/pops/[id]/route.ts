import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { popFormSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { apiMiddleware } from '../../middleware';

interface Params {
  id: string;
}

// Efficient POP cache implementation
class PopCache {
  private cache = new Map<string, { data: any, expiry: number }>();
  private readonly TTL = 60 * 1000; // 1-minute cache TTL
  
  get(id: string) {
    const item = this.cache.get(id);
    if (!item) return null;
    
    // Check if item is expired
    if (item.expiry < Date.now()) {
      this.cache.delete(id);
      return null;
    }
    
    return item.data;
  }
  
  set(id: string, data: any) {
    this.cache.set(id, {
      data,
      expiry: Date.now() + this.TTL
    });
  }
  
  invalidate(id: string) {
    this.cache.delete(id);
  }
}

const popCache = new PopCache();

// Common function to validate image URLs
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

// Helper to check user authorization for a POP
async function checkUserAuthorization(
  req: NextRequest,
  pop: any
): Promise<{ authorized: boolean; creatorId?: string }> {
  // Get user from session
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // For wallet-based auth, get wallet from request
  const walletAddress = (req as any).wallet?.address;

  // If neither session nor wallet, user is not authorized
  if (!userId && !walletAddress) {
    return { authorized: false };
  }

  // If the POP is public, anyone can view it
  if (pop.settings?.visibility === 'Public') {
    return { authorized: true, creatorId: pop.creatorId || undefined };
  }

  // If user ID from session matches creator ID, they're authorized
  if (userId && pop.creatorId === userId) {
    return { authorized: true, creatorId: userId };
  }

  // If using wallet auth, check if walletAddress matches a user that is the creator
  if (walletAddress) {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { id: true }
    });

    if (user && pop.creatorId === user.id) {
      return { authorized: true, creatorId: user.id };
    }
  }

  // No conditions for authorization were met
  return { authorized: false };
}

// Get a single POP by ID
async function getHandler(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id } = await params;
    
    // Check cache first
    const cachedData = popCache.get(id);
    if (cachedData) {
      return NextResponse.json({ pop: cachedData });
    }

    // Use a single optimized query to fetch all needed data at once
    const popWithRelations = await prisma.pop.findUnique({
      where: { id },
      include: {
        settings: true,
        tokens: {
          select: {
            id: true,
            mintAddress: true,
            metadataUri: true,
            metadataUpdatedAt: true,
            updatedAt: true,
          },
          take: 1, // We only need the first token
        },
        creator: {
          select: {
            id: true,
            walletAddress: true,
            name: true,
            image: true,
          }
        }
      },
    });

    if (!popWithRelations) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Check if user is authorized to view this POP
    const { authorized } = await checkUserAuthorization(request as unknown as NextRequest, popWithRelations);

    // If POP is not public and user is not authorized, deny access
    if (!authorized && popWithRelations.settings?.visibility !== 'Public') {
      return NextResponse.json(
        { error: 'You do not have permission to view this POP' },
        { status: 403 }
      );
    }

    // Find the token if it exists (we already limited to 1 token in the query)
    const token = popWithRelations.tokens.length > 0 ? popWithRelations.tokens[0] : null;

    // Create a clean response
    const cleanedPop = {
      ...popWithRelations,
      token,
      tokens: undefined, // Remove the tokens array
    };

    // Store in cache
    popCache.set(id, cleanedPop);

    return NextResponse.json({ pop: cleanedPop });
  } catch (error) {
    console.error('Error fetching POP:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch POP',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Update a POP by ID
async function putHandler(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id  } = await params;

    // Find the POP to make sure it exists
    const existingPop = await prisma.pop.findUnique({
      where: { id },
      include: {
        settings: true
      }
    });

    if (!existingPop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Check authorization
    const { authorized } = await checkUserAuthorization(request as unknown as NextRequest, existingPop);

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to update this POP' },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();

    try {
      // Validate against our schema
      const validatedData = popFormSchema.parse(body);

      // Check if the image URL is valid if it changed
      if (validatedData.imageUrl !== existingPop.imageUrl) {
        const isImageValid = await validateImageUrl(validatedData.imageUrl);
        if (!isImageValid && validatedData.imageUrl !== 'https://placehold.co/600x400?text=POP+Image') {
          return NextResponse.json(
            { error: 'Invalid image URL: Unable to verify image' },
            { status: 400 }
          );
        }
      }

      // Extract settings from the request if they exist
      const { settings, ...popData } = body;

      // Update the POP - handle the settings separately
      const updatedPop = await prisma.pop.update({
        where: { id },
        data: {
          ...popData,
          ...(settings && {
            settings: {
              upsert: {
                create: {
                  visibility: settings.visibility || 'Public',
                  allowSearch: settings.allowSearch ?? true,
                  notifyOnClaim: true
                },
                update: {
                  visibility: settings.visibility || 'Public',
                  allowSearch: settings.allowSearch ?? true
                }
              }
            }
          })
        },
        include: {
          settings: true
        }
      });

      // Invalidate cache for this POP
      popCache.invalidate(id);

      return NextResponse.json({
        success: true,
        message: 'POP updated successfully',
        pop: updatedPop,
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
    console.error('Error updating POP:', error);

    return NextResponse.json(
      {
        error: 'Failed to update POP',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Delete a POP by ID
async function deleteHandler(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id  } = await params;

    // Find the POP to make sure it exists
    const existingPop = await prisma.pop.findUnique({
      where: { id },
    });

    if (!existingPop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Check authorization
    const { authorized } = await checkUserAuthorization(request as unknown as NextRequest, existingPop);

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to delete this POP' },
        { status: 403 }
      );
    }

    // Instead of deleting, update the POP status to "Deleted"
    const updatedPop = await prisma.pop.update({
      where: { id },
      data: {
        status: 'Deleted',
      },
    });

    // Invalidate cache for this POP
    popCache.invalidate(id);

    return NextResponse.json({
      success: true,
      message: 'POP deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting POP:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete POP',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Export wrapped handlers with auth middleware
export const GET = (request: NextRequest, ctx: { params: Promise<Params> }) =>
  apiMiddleware(request, async () => getHandler(request as Request, ctx));

export const PUT = (request: NextRequest, ctx: { params: Promise<Params> }) =>
  apiMiddleware(request, async () => putHandler(request as Request, ctx));

export const DELETE = (request: NextRequest, ctx: { params: Promise<Params> }) =>
  apiMiddleware(request, async () => deleteHandler(request as Request, ctx));
