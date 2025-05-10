import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { poapFormSchema } from '@/lib/validations';
import { startOfDay, endOfDay } from 'date-fns';
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

// Helper to check user authorization for a POAP
async function checkUserAuthorization(
  req: NextRequest,
  poapId: string
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

  // First, fetch the POAP with its creator
  const poap = await prisma.poap.findUnique({
    where: { id: poapId },
    select: { creatorId: true, settings: { select: { visibility: true } } },
  });

  if (!poap) {
    return { authorized: false };
  }

  // If the POAP is public, anyone can view it
  if (poap.settings?.visibility === 'Public') {
    return { authorized: true, creatorId: poap.creatorId || undefined };
  }

  // If user ID from session matches creator ID, they're authorized
  if (userId && poap.creatorId === userId) {
    return { authorized: true, creatorId: userId };
  }

  // If using wallet auth, check if walletAddress matches a user that is the creator
  if (walletAddress) {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (user && poap.creatorId === user.id) {
      return { authorized: true, creatorId: user.id };
    }
  }

  // No conditions for authorization were met
  return { authorized: false };
}

// Get a single POAP by ID
async function getHandler(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id  } = await params;

    // Fetch POAP from database
    const poap = await prisma.poap.findUnique({
      where: { id: id },
      include: {
        settings: true,
        attributes: {
          include: {
            artists: true,
            organization: true,
          },
        },
        tokens: true, // Include token information
      },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Check if user is authorized to view this POAP
    const { authorized } = await checkUserAuthorization(request as unknown as NextRequest, id);

    // If POAP is not public and user is not authorized, deny access
    if (!authorized && poap.settings?.visibility !== 'Public') {
      return NextResponse.json(
        { error: 'You do not have permission to view this POAP' },
        { status: 403 }
      );
    }

    // If the POAP has a creator, fetch the creator data separately
    let creator = null;
    if (poap.creatorId) {
      creator = await prisma.user.findUnique({
        where: { id: poap.creatorId },
        select: {
          id: true,
          name: true,
          walletAddress: true,
        },
      });
    }

    // Find the token if it exists
    const token = poap.tokens.length > 0 ? poap.tokens[0] : null;

    // Create a clean response
    const cleanedPoap = {
      ...poap,
      token: token, // Add the token as a single object instead of an array
      tokens: undefined, // Remove the tokens array
    };

    // Add creator to the response
    const poapWithCreator = {
      ...cleanedPoap,
      creator,
    };

    return NextResponse.json({ poap: poapWithCreator });
  } catch (error) {
    console.error('Error fetching POAP:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch POAP',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Update a POAP by ID
async function putHandler(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id  } = await params;

    // Check authorization
    const { authorized } = await checkUserAuthorization(request as unknown as NextRequest, id);

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to update this POAP' },
        { status: 403 }
      );
    }

    // Find the POAP to make sure it exists
    const existingPoap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!existingPoap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Parse the request body
    const body = await request.json();

    try {
      // Validate against our schema
      const validatedData = poapFormSchema.parse(body);

      // Check if the image URL is valid if it changed
      if (validatedData.imageUrl !== existingPoap.imageUrl) {
        const isImageValid = await validateImageUrl(validatedData.imageUrl);
        if (!isImageValid) {
          return NextResponse.json(
            { error: 'Invalid image URL: Unable to verify image' },
            { status: 400 }
          );
        }
      }

      // Update the POAP
      const updatedPoap = await prisma.poap.update({
        where: { id },
        data: validatedData,
      });

      return NextResponse.json({
        success: true,
        message: 'POAP updated successfully',
        poap: updatedPoap,
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
    console.error('Error updating POAP:', error);

    return NextResponse.json(
      {
        error: 'Failed to update POAP',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Delete a POAP by ID
async function deleteHandler(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id  } = await params;

    // Check authorization
    const { authorized } = await checkUserAuthorization(request as unknown as NextRequest, id);

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to delete this POAP' },
        { status: 403 }
      );
    }

    // Find the POAP to make sure it exists
    const existingPoap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!existingPoap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Delete the POAP from the database
    await prisma.poap.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'POAP deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting POAP:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete POAP',
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
