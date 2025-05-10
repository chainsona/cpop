import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { attributesSchema } from '@/lib/validations';

type Params = Promise<{ id: string }>;

// GET attributes for a POAP
export async function GET(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id  } = await params;

    // Check if POAP exists
    const poap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Get attributes with related data
    const attributes = await prisma.attributes.findUnique({
      where: { poapId: id },
      include: {
        artists: true,
        organization: true,
      },
    });

    return NextResponse.json({ attributes });
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch attributes',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// POST to create attributes
export async function POST(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id  } = await params;
    console.log('Creating attributes for POAP ID:', id);
    
    let body;
    try {
      body = await request.json();
      console.log('Request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          message: parseError instanceof Error ? parseError.message : 'Failed to parse request body'
        }, 
        { status: 400 }
      );
    }

    // Check if POAP exists
    const poap = await prisma.poap.findUnique({
      where: { id },
      select: { id: true, title: true }
    });

    if (!poap) {
      console.error('POAP not found with ID:', id);
      return NextResponse.json({ 
        error: 'POAP not found',
        message: `No POAP exists with ID: ${id}`,
        details: 'Make sure you have created a POAP first before adding attributes'
      }, { status: 404 });
    }
    
    console.log('Found POAP:', poap.id, poap.title);

    // Check if attributes already exist for this POAP
    const existingAttributes = await prisma.attributes.findUnique({
      where: { poapId: id },
    });

    if (existingAttributes) {
      console.log('Attributes already exist for POAP:', id);
      return NextResponse.json(
        { 
          error: 'Attributes already exist for this POAP',
          message: 'Use PATCH to update existing attributes' 
        }, 
        { status: 409 }
      );
    }

    // Validate data
    let validatedData;
    try {
      validatedData = attributesSchema.parse(body);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));
    } catch (validationError) {
      console.error('Validation error:', validationError);
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

    const { artists, organization, ...attributesData } = validatedData;
    console.log('Extracted attributes data:', JSON.stringify(attributesData, null, 2));
    console.log('Artists data:', artists ? JSON.stringify(artists, null, 2) : 'none provided');
    console.log('Organization data:', organization ? JSON.stringify(organization, null, 2) : 'none provided');

    let result;

    try {
      await prisma.$transaction(async tx => {
        console.log('Creating base attributes record');
        // Create new attributes
        const attributes = await tx.attributes.create({
          data: {
            ...attributesData,
            poapId: id,
          },
        });
        console.log('Created attributes record with ID:', attributes.id);

        // Handle artists if provided
        if (artists && artists.length > 0) {
          console.log('Creating artists records');
          // Create new artists
          await tx.artist.createMany({
            data: artists.map(artist => ({
              attributesId: attributes.id,
              name: artist.name,
              url: artist.url || null,
            })),
          });
          console.log(`Created ${artists.length} artist records`);
        }

        // Handle organization if provided
        if (organization) {
          console.log('Creating organization record');
          // Create organization
          await tx.organization.create({
            data: {
              attributesId: attributes.id,
              name: organization.name,
              url: organization.url || null,
            },
          });
          console.log('Created organization record');
        }

        // Get created attributes with relations
        result = await tx.attributes.findUnique({
          where: { id: attributes.id },
          include: {
            artists: true,
            organization: true,
          },
        });
        console.log('Retrieved complete attributes record with relations');
      });

      console.log('Transaction completed successfully');
      return NextResponse.json({
        success: true,
        message: 'Attributes created successfully',
        attributes: result,
      }, { status: 201 });
    } catch (txError) {
      console.error('Transaction error:', txError);
      console.error('Transaction error details:', txError instanceof Error ? txError.stack : 'No stack trace');
      throw txError; // Re-throw to be caught by the outer try/catch
    }
  } catch (error) {
    console.error('Error creating attributes:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Try to provide more specific error messages based on error type
    let errorMessage = 'An unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific Prisma errors
      if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;
        if (prismaError.code === 'P2002') {
          errorMessage = 'A unique constraint would be violated.';
          statusCode = 409;
        } else if (prismaError.code === 'P2003') {
          errorMessage = 'Foreign key constraint failed.';
          statusCode = 400;
        }
      }
    }
    
    return NextResponse.json(
      {
        error: 'Failed to create attributes',
        message: errorMessage,
        details: error instanceof Error ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}

// PATCH to update attributes
export async function PATCH(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id  } = await params;
    const body = await request.json();

    // Check if POAP exists
    const poap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Check if attributes exist for this POAP
    const existingAttributes = await prisma.attributes.findUnique({
      where: { poapId: id },
    });

    if (!existingAttributes) {
      return NextResponse.json(
        { 
          error: 'Attributes not found', 
          message: 'Use POST to create new attributes' 
        }, 
        { status: 404 }
      );
    }

    // Validate data
    let validatedData;
    try {
      validatedData = attributesSchema.parse(body);
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

    const { artists, organization, ...attributesData } = validatedData;

    let result;

    await prisma.$transaction(async tx => {
      // Update existing attributes
      const attributes = await tx.attributes.update({
        where: { id: existingAttributes.id },
        data: attributesData,
      });

      // Handle artists
      // Delete all existing artists first
      await tx.artist.deleteMany({
        where: { attributesId: attributes.id },
      });

      // Create new artists if provided
      if (artists && artists.length > 0) {
        await tx.artist.createMany({
          data: artists.map(artist => ({
            attributesId: attributes.id,
            name: artist.name,
            url: artist.url || null,
          })),
        });
      }

      // Handle organization
      const existingOrg = await tx.organization.findUnique({
        where: { attributesId: attributes.id },
      });

      if (organization) {
        // Organization is provided, update or create
        if (existingOrg) {
          // Update organization
          await tx.organization.update({
            where: { id: existingOrg.id },
            data: {
              name: organization.name,
              url: organization.url || null,
            },
          });
        } else {
          // Create organization
          await tx.organization.create({
            data: {
              attributesId: attributes.id,
              name: organization.name,
              url: organization.url || null,
            },
          });
        }
      } else if (existingOrg) {
        // Organization is null or undefined but existed before, delete it
        await tx.organization.delete({
          where: { id: existingOrg.id },
        });
      }

      // Get updated attributes with relations
      result = await tx.attributes.findUnique({
        where: { id: attributes.id },
        include: {
          artists: true,
          organization: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Attributes updated successfully',
      attributes: result,
    });
  } catch (error) {
    console.error('Error updating attributes:', error);
    return NextResponse.json(
      {
        error: 'Failed to update attributes',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
