import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check for admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    if (token !== process.env.ADMIN_API_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }
    
    // Return a message that migrations are now handled via Prisma
    return NextResponse.json({ 
      message: 'The database schema has been refactored. Runtime migrations are no longer needed as schema changes are now properly handled via Prisma migrations.',
      status: 'success'
    });
  } catch (error) {
    console.error('Error in migration endpoint:', error);
    return NextResponse.json(
      { error: 'Migration failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 