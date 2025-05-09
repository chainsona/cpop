import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { poapFormSchema } from '@/lib/validations';
import { startOfDay, endOfDay } from 'date-fns';

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

type Params = Promise<{ id: string }>;

// Get a single POAP by ID
export async function GET(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;

    // Find the POAP in the database
    const poap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    return NextResponse.json({ poap });
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
export async function PUT(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    // Find the POAP to make sure it exists
    const existingPoap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!existingPoap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Validate the request body using zod schema
    const validatedData = poapFormSchema.parse(body);

    // Check if the image URL has changed
    if (validatedData.imageUrl !== existingPoap.imageUrl) {
      // Validate the new image URL if it's not a base64 image
      if (!validatedData.imageUrl.startsWith('data:image/')) {
        const isValidImageUrl = await validateImageUrl(validatedData.imageUrl);
        if (!isValidImageUrl) {
          return NextResponse.json(
            {
              error: 'The provided image URL is not valid or is not accessible.',
            },
            { status: 400 }
          );
        }
      }
    }

    // Process dates
    const startDate = validatedData.startDate ? startOfDay(validatedData.startDate) : undefined;
    const endDate = validatedData.endDate ? endOfDay(validatedData.endDate) : undefined;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    // Update the POAP in the database
    const updatedPoap = await prisma.poap.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        imageUrl: validatedData.imageUrl,
        website: validatedData.website || null,
        startDate,
        endDate,
        attendees: validatedData.attendees || null,
        status: existingPoap.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'POAP updated successfully',
      poap: updatedPoap,
    });
  } catch (error) {
    console.error('Error updating POAP:', error);

    if (error instanceof z.ZodError) {
      // Extract field errors in a safer way
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.errors) {
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
export async function DELETE(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;

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
