import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { claimLinksSchema, secretWordSchema, locationBasedSchema } from '@/lib/validations';
import { updatePoapStatusBasedOnDistributionMethods } from '@/lib/poap-utils';

type Params = Promise<{ id: string }>;

// GET all distribution methods for a POAP
export async function GET(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;

    // Check if POAP exists
    const poap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Get all distribution methods with their related data
    const distributionMethods = await prisma.distributionMethod.findMany({
      where: {
        poapId: id,
        deleted: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        claimLinks: true,
        secretWord: true,
        locationBased: true,
      },
    });

    return NextResponse.json({ distributionMethods });
  } catch (error) {
    console.error('Error fetching distribution methods:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch distribution methods',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// POST a new distribution method
export async function POST(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    // Check if POAP exists
    const poap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    const { type, ...data } = body;

    if (!type || !['ClaimLinks', 'SecretWord', 'LocationBased'].includes(type)) {
      return NextResponse.json({ error: 'Invalid distribution method type' }, { status: 400 });
    }

    // Validate the data based on the type
    let validatedData: any;
    try {
      if (type === 'ClaimLinks') {
        validatedData = claimLinksSchema.parse(data);
      } else if (type === 'SecretWord') {
        validatedData = secretWordSchema.parse(data);
      } else if (type === 'LocationBased') {
        validatedData = locationBasedSchema.parse(data);
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of validationError.errors) {
          if (issue.path.length > 0) {
            const fieldName = issue.path[0].toString();
            fieldErrors[fieldName] = issue.message;
          }
        }

        return NextResponse.json(
          {
            error: 'Invalid request data',
            fieldErrors,
            message: 'Please check the form fields and try again',
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Create the distribution method with the appropriate related data
    let result;

    await prisma.$transaction(async tx => {
      // Create the distribution method
      const distributionMethod = await tx.distributionMethod.create({
        data: {
          poapId: id,
          type,
        },
      });

      // Create the related data based on the type
      if (type === 'ClaimLinks') {
        // Generate the specified number of claim links
        const { amount, expiryDate } = validatedData;

        // Create multiple claim links
        const claimLinks = Array.from({ length: amount }).map(() => ({
          distributionMethodId: distributionMethod.id,
          token: generateUniqueToken(),
          expiresAt: expiryDate,
        }));

        await tx.claimLink.createMany({
          data: claimLinks,
        });

        // Fetch the created claim links to return
        result = await tx.distributionMethod.findUnique({
          where: { id: distributionMethod.id },
          include: { claimLinks: true },
        });
      } else if (type === 'SecretWord') {
        // Create a secret word entry
        await tx.secretWord.create({
          data: {
            distributionMethodId: distributionMethod.id,
            ...validatedData,
          },
        });

        // Fetch the created secret word to return
        result = await tx.distributionMethod.findUnique({
          where: { id: distributionMethod.id },
          include: { secretWord: true },
        });
      } else if (type === 'LocationBased') {
        // Create a location-based entry
        await tx.locationBased.create({
          data: {
            distributionMethodId: distributionMethod.id,
            ...validatedData,
          },
        });

        // Fetch the created location-based info to return
        result = await tx.distributionMethod.findUnique({
          where: { id: distributionMethod.id },
          include: { locationBased: true },
        });
      }
    });

    // Update the POAP status based on distribution methods
    await updatePoapStatusBasedOnDistributionMethods(id);

    return NextResponse.json({
      success: true,
      message: `${type} distribution method created successfully`,
      distributionMethod: result,
    });
  } catch (error) {
    console.error('Error creating distribution method:', error);
    return NextResponse.json(
      {
        error: 'Failed to create distribution method',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Helper function to generate a unique token for claim links
function generateUniqueToken(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}
