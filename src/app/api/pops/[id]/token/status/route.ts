import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiMiddleware } from '../../../../middleware';

interface Params {
  id: string;
}

/**
 * GET endpoint to check token minting status
 * This is used by the polling mechanism to check if a token has been created
 * after the first distribution method is created
 */
export const GET = (req: NextRequest, ctx: { params: Promise<Params> }) =>
  apiMiddleware(req, async () => {
    try {
      const { id: popId } = await ctx.params;
      console.log(`Checking token status for POP ${popId}`);

      // Add cache control headers to prevent caching
      const headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      // First check if the POP exists
      const pop = await prisma.pop.findUnique({
        where: { id: popId },
        select: { id: true },
      });

      if (!pop) {
        console.warn(`POP ${popId} not found when checking token status`);
        return NextResponse.json({ error: 'POP not found', minted: false }, { status: 404, headers });
      }

      // Simple check to see if a token exists for this POP
      const token = await prisma.popToken.findFirst({
        where: { popId },
        select: {
          id: true,
          mintAddress: true,
          createdAt: true,
        },
      });

      console.log(`Token status for POP ${popId}:`, token ? 'Minted' : 'Not minted');

      return NextResponse.json({
        minted: !!token,
        mintAddress: token?.mintAddress || null,
        mintedAt: token?.createdAt || null,
        timestamp: Date.now(), // Add a timestamp to help with debugging
      }, { headers });
    } catch (error) {
      console.error('Error checking token status:', error);
      return NextResponse.json(
        { 
          error: 'Failed to check token status', 
          minted: false,
          timestamp: Date.now(), 
          errorDetails: error instanceof Error ? error.message : 'Unknown error' 
        },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
  });
