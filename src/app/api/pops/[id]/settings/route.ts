import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { settingsSchema } from '@/lib/validations';

type Params = Promise<{ id: string }>;

// GET settings for a POP
export async function GET(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id  } = await params;

    // Check if POP exists
    const pop = await prisma.pop.findUnique({
      where: { id },
    });

    if (!pop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Get settings
    const settings = await prisma.settings.findUnique({
      where: { popId: id },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch settings',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// POST to create settings
export async function POST(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id  } = await params;
    const body = await request.json();

    // Check if POP exists
    const pop = await prisma.pop.findUnique({
      where: { id },
    });

    if (!pop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }
    
    // Check if settings already exist for this POP
    const existingSettings = await prisma.settings.findUnique({
      where: { popId: id },
    });

    if (existingSettings) {
      return NextResponse.json(
        { 
          error: 'Settings already exist for this POP',
          message: 'Use PATCH to update existing settings' 
        }, 
        { status: 409 }
      );
    }

    // Validate data
    let validatedData;
    try {
      validatedData = settingsSchema.parse(body);
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

    // Create new settings
    const settings = await prisma.settings.create({
      data: {
        ...validatedData,
        popId: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Settings created successfully',
      settings,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to create settings',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// PATCH to update settings
export async function PATCH(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id  } = await params;
    const body = await request.json();

    // Check if POP exists
    const pop = await prisma.pop.findUnique({
      where: { id },
    });

    if (!pop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Check if settings exist for this POP
    const existingSettings = await prisma.settings.findUnique({
      where: { popId: id },
    });

    if (!existingSettings) {
      return NextResponse.json(
        { 
          error: 'Settings not found', 
          message: 'Use POST to create new settings' 
        }, 
        { status: 404 }
      );
    }

    // Validate data
    let validatedData;
    try {
      validatedData = settingsSchema.parse(body);
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

    // Update existing settings
    const settings = await prisma.settings.update({
      where: { id: existingSettings.id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
