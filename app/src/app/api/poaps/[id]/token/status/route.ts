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
      const { id: poapId } = await ctx.params;
      console.log(`Checking token status for POAP ${poapId}`);

      // First check if the POAP exists
      const poap = await prisma.poap.findUnique({
        where: { id: poapId },
        select: { id: true },
      });

      if (!poap) {
        console.warn(`POAP ${poapId} not found when checking token status`);
        return NextResponse.json({ error: 'POAP not found', minted: false }, { status: 404 });
      }

      // Simple check to see if a token exists for this POAP
      const token = await prisma.poapToken.findFirst({
        where: { poapId },
        select: {
          id: true,
          mintAddress: true,
          createdAt: true,
        },
      });

      console.log(`Token status for POAP ${poapId}:`, token ? 'Minted' : 'Not minted');

      return NextResponse.json({
        minted: !!token,
        mintAddress: token?.mintAddress || null,
        mintedAt: token?.createdAt || null,
      });
    } catch (error) {
      console.error('Error checking token status:', error);
      return NextResponse.json(
        { error: 'Failed to check token status', minted: false },
        { status: 500 }
      );
    }
  });
