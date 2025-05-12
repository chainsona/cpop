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
  popId: string
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

  // First, fetch the POP with its creator
  const pop = await prisma.pop.findUnique({
    where: { id: popId },
    select: { creatorId: true, settings: { select: { visibility: true } } },
  });

  if (!pop) {
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
    const { id  } = await params;

    // Fetch POP from database with optimized includes
    // Only include minimal required data initially
    const pop = await prisma.pop.findUnique({
      where: { id: id },
      include: {
        settings: {
          select: {
            visibility: true
          }
        },
        tokens: {
          select: {
            id: true,
            mintAddress: true,
            metadataUri: true,
            metadataUpdatedAt: true,
            updatedAt: true,
          }
        },
      },
    });

    if (!pop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Check if user is authorized to view this POP
    const { authorized } = await checkUserAuthorization(request as unknown as NextRequest, id);

    // If POP is not public and user is not authorized, deny access
    if (!authorized && pop.settings?.visibility !== 'Public') {
      return NextResponse.json(
        { error: 'You do not have permission to view this POP' },
        { status: 403 }
      );
    }

    // Fetch creator info separately only if needed
    let creator = null;
    if (pop.creatorId) {
      creator = await prisma.user.findUnique({
        where: { id: pop.creatorId },
        select: {
          id: true,
          walletAddress: true,
        },
      });
    }

    // Find the token if it exists
    const token = pop.tokens.length > 0 ? pop.tokens[0] : null;

    // Create a clean response
    const cleanedPop = {
      ...pop,
      token: token, // Add the token as a single object instead of an array
      tokens: undefined, // Remove the tokens array
    };

    // Add creator to the response
    const popWithCreator = {
      ...cleanedPop,
      creator,
    };

    return NextResponse.json({ pop: popWithCreator });
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

    // Check authorization
    const { authorized } = await checkUserAuthorization(request as unknown as NextRequest, id);

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to update this POP' },
        { status: 403 }
      );
    }

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

    // Check authorization
    const { authorized } = await checkUserAuthorization(request as unknown as NextRequest, id);

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to delete this POP' },
        { status: 403 }
      );
    }

    // Find the POP to make sure it exists
    const existingPop = await prisma.pop.findUnique({
      where: { id },
    });

    if (!existingPop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Delete the POP from the database
    await prisma.pop.delete({
      where: { id },
    });

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
