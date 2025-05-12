import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface Params {
  token: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { token } = await params;
    
    // Validate token format
    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json({ 
        error: 'Invalid token format' 
      }, { status: 400 });
    }
    
    // Fetch claim link with distribution method details
    const claimLink = await prisma.claimLink.findUnique({
      where: { token },
      include: {
        distributionMethod: {
          include: {
            pop: {
              select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                creatorId: true,
                creator: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    // If claim link not found
    if (!claimLink) {
      return NextResponse.json({
        valid: false,
        claimed: false,
        expired: false,
        pop: null,
        message: 'Claim link not found',
      }, { status: 404 });
    }
    
    // Check if distribution method is disabled or deleted
    if (claimLink.distributionMethod.disabled || claimLink.distributionMethod.deleted) {
      return NextResponse.json({
        valid: false,
        claimed: false,
        expired: false,
        pop: null,
        message: 'This distribution method has been disabled',
      }, { status: 403 });
    }
    
    // Check if claim link is already claimed
    if (claimLink.claimed) {
      return NextResponse.json({
        valid: true,
        claimed: true,
        expired: false,
        pop: {
          id: claimLink.distributionMethod.pop.id,
          title: claimLink.distributionMethod.pop.title,
          description: claimLink.distributionMethod.pop.description,
          imageUrl: claimLink.distributionMethod.pop.imageUrl,
          creatorId: claimLink.distributionMethod.pop.creatorId,
          creatorName: claimLink.distributionMethod.pop.creator?.name,
        },
        claimInfo: claimLink.claimedByWallet ? {
          claimedAt: claimLink.claimedAt,
          claimedByWallet: claimLink.claimedByWallet,
          transactionSignature: claimLink.transactionSignature,
        } : undefined,
        message: 'This POP has already been claimed',
      });
    }
    
    // Check if claim link is expired
    const isExpired = claimLink.expiresAt ? new Date(claimLink.expiresAt) < new Date() : false;
    
    if (isExpired) {
      return NextResponse.json({
        valid: true,
        claimed: false,
        expired: true,
        pop: {
          id: claimLink.distributionMethod.pop.id,
          title: claimLink.distributionMethod.pop.title,
          description: claimLink.distributionMethod.pop.description,
          imageUrl: claimLink.distributionMethod.pop.imageUrl,
          creatorId: claimLink.distributionMethod.pop.creatorId,
          creatorName: claimLink.distributionMethod.pop.creator?.name,
        },
        message: 'This claim link has expired',
      });
    }
    
    // Valid and claimable
    return NextResponse.json({
      valid: true,
      claimed: false,
      expired: false,
      pop: {
        id: claimLink.distributionMethod.pop.id,
        title: claimLink.distributionMethod.pop.title,
        description: claimLink.distributionMethod.pop.description,
        imageUrl: claimLink.distributionMethod.pop.imageUrl,
        creatorId: claimLink.distributionMethod.pop.creatorId,
        creatorName: claimLink.distributionMethod.pop.creator?.name,
      },
      message: 'Ready to claim',
    });
    
  } catch (error) {
    console.error('Error verifying claim token:', error);
    return NextResponse.json({ 
      error: 'Failed to verify claim token',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    }, { status: 500 });
  }
} 