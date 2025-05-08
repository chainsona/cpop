import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { poapFormSchema } from '@/lib/validations';
import { startOfDay, endOfDay } from 'date-fns';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate the request body using zod schema
    const validatedData = poapFormSchema.parse(body);

    // Check if we're dealing with a base64 image
    const isBase64Image = validatedData.imageUrl.startsWith('data:image/');

    if (isBase64Image) {
      // Validate base64 image size to prevent database issues
      if (isBase64ImageTooLarge(validatedData.imageUrl)) {
        return NextResponse.json(
          {
            error:
              'The uploaded image is too large. Maximum size is 2MB. Please use a smaller image or provide a URL instead.',
          },
          { status: 400 }
        );
      }
    } else {
      // Only validate external URLs
      const isValidImageUrl = await validateImageUrl(validatedData.imageUrl);
      if (!isValidImageUrl) {
        return NextResponse.json(
          { error: 'The provided image URL is not valid or is not accessible.' },
          { status: 400 }
        );
      }
    }

    // Process dates - start date is beginning of day, end date is end of day
    const startDate = validatedData.startDate ? startOfDay(validatedData.startDate) : undefined;
    const endDate = validatedData.endDate ? endOfDay(validatedData.endDate) : undefined;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    // Create a new POAP in the database
    const poap = await prisma.poap.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        imageUrl: validatedData.imageUrl,
        website: validatedData.website || null,
        startDate,
        endDate,
        supply: validatedData.supply || null,
        status: validatedData.status || 'Draft',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'POAP created successfully',
        poap,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating POAP:', error);

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
        error: 'Failed to create POAP',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const poaps = await prisma.poap.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ poaps });
  } catch (error) {
    console.error('Error fetching POAPs:', error);

    return NextResponse.json({ error: 'Failed to fetch POAPs' }, { status: 500 });
  }
}
