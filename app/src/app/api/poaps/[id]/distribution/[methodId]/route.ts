import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updatePoapStatusBasedOnDistributionMethods } from '@/lib/poap-utils';

type Params = Promise<{ id: string; methodId: string }>;

// GET a specific distribution method
export async function GET(req: NextRequest, context: { params: Params }) {
  try {
    const { id, methodId } = await context.params;

    // Check if POAP exists
    const poap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Get the specific distribution method with its related data
    const distributionMethod = await prisma.distributionMethod.findUnique({
      where: {
        id: methodId,
        poapId: id, // Ensure it belongs to this POAP
        deleted: false, // Don't return deleted methods
      },
      include: {
        claimLinks: true,
        secretWord: true,
        locationBased: true,
      },
    });

    if (!distributionMethod) {
      return NextResponse.json({ error: 'Distribution method not found' }, { status: 404 });
    }

    return NextResponse.json({ distributionMethod });
  } catch (error) {
    console.error('Error fetching distribution method:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch distribution method',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// PATCH to update a distribution method (e.g., to enable/disable it)
export async function PATCH(req: NextRequest, context: { params: Params }) {
  try {
    const { id, methodId } = await context.params;
    const body = await req.json();

    // Check if POAP exists
    const poap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Check if the distribution method exists and belongs to this POAP
    const distributionMethod = await prisma.distributionMethod.findUnique({
      where: {
        id: methodId,
        poapId: id,
        deleted: false, // Don't update deleted methods
      },
    });

    if (!distributionMethod) {
      return NextResponse.json({ error: 'Distribution method not found' }, { status: 404 });
    }

    // Update the distribution method
    const updatedMethod = await prisma.distributionMethod.update({
      where: { id: methodId },
      data: {
        disabled: body.disabled !== undefined ? body.disabled : distributionMethod.disabled,
        deleted: body.deleted !== undefined ? body.deleted : distributionMethod.deleted,
      },
      include: {
        claimLinks: true,
        secretWord: true,
        locationBased: true,
      },
    });

    // If we're toggling the disabled or deleted status, update the POAP status
    if (body.disabled !== undefined || body.deleted !== undefined) {
      await updatePoapStatusBasedOnDistributionMethods(id);
    }

    // Build a message based on what was updated
    let message = '';

    if (body.deleted !== undefined && body.deleted) {
      message = 'Distribution method marked as deleted successfully';
    } else if (body.disabled !== undefined) {
      message = `Distribution method ${updatedMethod.disabled ? 'disabled' : 'enabled'} successfully`;
    } else {
      message = 'Distribution method updated successfully';
    }

    return NextResponse.json({
      success: true,
      message,
      distributionMethod: updatedMethod,
    });
  } catch (error) {
    console.error('Error updating distribution method:', error);
    return NextResponse.json(
      {
        error: 'Failed to update distribution method',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// DELETE a specific distribution method (now sets deleted flag instead of disabling)
export async function DELETE(req: NextRequest, context: { params: Params }) {
  try {
    const { id, methodId } = await context.params;

    // Check if POAP exists
    const poap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Check if the distribution method exists and belongs to this POAP
    const distributionMethod = await prisma.distributionMethod.findUnique({
      where: {
        id: methodId,
        poapId: id,
        deleted: false, // Don't delete already deleted methods
      },
    });

    if (!distributionMethod) {
      return NextResponse.json({ error: 'Distribution method not found' }, { status: 404 });
    }

    // Instead of deleting, mark it as deleted
    const updatedMethod = await prisma.distributionMethod.update({
      where: { id: methodId },
      data: {
        deleted: true,
        disabled: true, // Also disable it
      },
    });

    // Update the POAP status after deletion
    await updatePoapStatusBasedOnDistributionMethods(id);

    return NextResponse.json({
      success: true,
      message: 'Distribution method deleted successfully',
      distributionMethod: updatedMethod,
    });
  } catch (error) {
    console.error('Error deleting distribution method:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete distribution method',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
