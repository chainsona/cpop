import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updatePopStatusBasedOnDistributionMethods } from '@/lib/pop-utils';

type Params = Promise<{ id: string; methodId: string }>;

// GET a specific distribution method
export async function GET(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id, methodId  } = await params;

    // Check if POP exists
    const pop = await prisma.pop.findUnique({
      where: { id },
    });

    if (!pop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Get the specific distribution method with its related data
    const distributionMethod = await prisma.distributionMethod.findUnique({
      where: {
        id: methodId,
        popId: id, // Ensure it belongs to this POP
        deleted: false, // Don't return deleted methods
      },
      include: {
        claimLinks: true,
        secretWord: true,
        locationBased: true,
        airdrop: true,
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
export async function PATCH(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id, methodId  } = await params;
    const body = await request.json();

    // Check if POP exists
    const pop = await prisma.pop.findUnique({
      where: { id },
    });

    if (!pop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Get the distribution method with airdrop relation
    const distributionMethod = await prisma.distributionMethod.findUnique({
      where: {
        id: methodId,
        popId: id,
        deleted: false, // Don't update deleted methods
      },
      include: {
        airdrop: true
      }
    });

    if (!distributionMethod) {
      return NextResponse.json({ error: 'Distribution method not found' }, { status: 404 });
    }

    // For Airdrop distribution, check if it can be modified based on start date
    if (distributionMethod.type === 'Airdrop' && distributionMethod.airdrop) {
      const startDate = distributionMethod.airdrop.startDate;
      if (startDate && new Date(startDate) <= new Date()) {
        return NextResponse.json({ 
          error: 'Airdrop distribution cannot be modified after its start date' 
        }, { status: 403 });
      }
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
        airdrop: true,
      },
    });

    // If we're toggling the disabled or deleted status, update the POP status
    if (body.disabled !== undefined || body.deleted !== undefined) {
      await updatePopStatusBasedOnDistributionMethods(id);
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
export async function DELETE(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id, methodId  } = await params;

    // Check if POP exists
    const pop = await prisma.pop.findUnique({
      where: { id },
    });

    if (!pop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Get the distribution method with airdrop relation
    const distributionMethod = await prisma.distributionMethod.findUnique({
      where: {
        id: methodId,
        popId: id,
        deleted: false, // Don't delete already deleted methods
      },
      include: {
        airdrop: true
      }
    });

    if (!distributionMethod) {
      return NextResponse.json({ error: 'Distribution method not found' }, { status: 404 });
    }

    // For Airdrop distribution, check if it can be deleted based on start date
    if (distributionMethod.type === 'Airdrop' && distributionMethod.airdrop) {
      const startDate = distributionMethod.airdrop.startDate;
      if (startDate && new Date(startDate) <= new Date()) {
        return NextResponse.json({ 
          error: 'Airdrop distribution cannot be deleted after its start date' 
        }, { status: 403 });
      }
    }

    // Instead of deleting, mark it as deleted
    const updatedMethod = await prisma.distributionMethod.update({
      where: { id: methodId },
      data: {
        deleted: true,
        disabled: true, // Also disable it
      },
    });

    // Update the POP status after deletion
    await updatePopStatusBasedOnDistributionMethods(id);

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
