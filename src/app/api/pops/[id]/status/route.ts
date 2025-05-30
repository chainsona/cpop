import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { apiMiddleware } from '../../../middleware';
import { PopStatus } from '@/generated/prisma';

interface Params {
  id: string;
}

// Schema for status update using Prisma enum
const statusUpdateSchema = z.object({
  status: z.nativeEnum(PopStatus),
});

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
    select: { creatorId: true },
  });

  if (!pop) {
    return { authorized: false };
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

// PATCH handler to update POP status
async function patchHandler(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    // Check authorization
    const { authorized } = await checkUserAuthorization(request, id);

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to update this POP' },
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

    // Parse the request body
    const body = await request.json();

    console.log('Received status update request:', body);

    // Validate status update
    try {
      const { status } = statusUpdateSchema.parse(body);

      console.log('Validated status:', status);

      // Update the POP's status
      const updatedPop = await prisma.pop.update({
        where: { id },
        data: { status },
      });

      return NextResponse.json({
        success: true,
        message: `POP status updated to ${status}`,
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
    console.error('Error updating POP status:', error);

    return NextResponse.json(
      {
        error: 'Failed to update POP status',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Export wrapped handlers with auth middleware
export const PATCH = (request: NextRequest, ctx: { params: Promise<Params> }) =>
  apiMiddleware(request, () => patchHandler(request, ctx)); 