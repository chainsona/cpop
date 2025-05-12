import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { id: popId } = await params;

  try {
    console.log(`Retrieving claim methods for POP: ${popId}`);

    // Fetch distribution methods directly from the database
    const distributionMethods = await prisma.distributionMethod.findMany({
      where: {
        popId: popId,
        disabled: false,
        deleted: false,
      },
      select: {
        type: true,
      },
    });

    // Extract method types
    const methods = distributionMethods.map(method => method.type);

    console.log(`Available claim methods for POP ${popId}:`, methods);

    return NextResponse.json({
      methods: methods,
    });
  } catch (error) {
    console.error('Error fetching claim methods:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
