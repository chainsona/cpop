import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type Params = Promise<{ id: string }>;

// Simple in-memory cache for analytics data
// Keys are POAP IDs and values are analytics data with expiry time
const analyticsCache = new Map<string, { data: any, expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// GET analytics data for a POAP
export async function GET(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id } = await params;

    // Check cache first
    const now = Date.now();
    const cachedData = analyticsCache.get(id);
    if (cachedData && cachedData.expiry > now) {
      return NextResponse.json({ analyticsData: cachedData.data });
    }

    // Check if POAP exists
    const poap = await prisma.poap.findUnique({
      where: { id },
      select: { id: true, attendees: true },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Optimize query for distribution methods and associated claim data
    // Use a single query for distribution methods with only the fields we need
    const distributionMethods = await prisma.distributionMethod.findMany({
      where: {
        poapId: id,
        disabled: false, // Only include active methods
      },
      select: {
        id: true,
        type: true,
        claimLinks: {
          where: { claimed: true },
          select: {
            claimed: true,
            claimedAt: true,
          }
        },
        secretWord: {
          select: {
            claimCount: true,
            maxClaims: true,
          }
        },
        locationBased: {
          select: {
            claimCount: true,
            maxClaims: true,
            city: true,
          }
        },
        airdrop: {
          select: {
            claimCount: true,
            addresses: true,
          }
        }
      },
    });

    // Calculate analytics data efficiently
    let totalClaims = 0;
    let claimsByMethod = [];
    let claimsByDay: Record<string, number> = {};

    for (const method of distributionMethods) {
      let methodClaims = 0;
      let methodName = '';

      // Calculate claims based on distribution method type
      if (method.type === 'ClaimLinks' && method.claimLinks?.length > 0) {
        methodClaims = method.claimLinks.length;
        methodName = 'Link';

        // Process claims by day for this method
        for (const link of method.claimLinks) {
          if (link.claimedAt) {
            const date = new Date(link.claimedAt).toISOString().split('T')[0];
            claimsByDay[date] = (claimsByDay[date] || 0) + 1;
          }
        }
      } else if (method.type === 'SecretWord' && method.secretWord) {
        methodClaims = method.secretWord.claimCount;
        methodName = 'Secret';

        // For secret words, we don't have individual claim dates,
        // so we'll distribute them evenly across the last 5 days for demo purposes
        const daysWithClaims = 5;
        if (methodClaims > 0) {
          const today = new Date();
          const claimsPerDay = Math.ceil(methodClaims / daysWithClaims);
          for (let i = 0; i < daysWithClaims; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            claimsByDay[dateStr] =
              (claimsByDay[dateStr] || 0) +
              (i === daysWithClaims - 1
                ? methodClaims - claimsPerDay * (daysWithClaims - 1)
                : claimsPerDay);
          }
        }
      } else if (method.type === 'LocationBased' && method.locationBased) {
        methodName = `Location - ${method.locationBased.city}`;
        methodClaims = method.locationBased.claimCount || 0;
      } else if (method.type === 'Airdrop' && method.airdrop) {
        // For Airdrops, there's no claiming - tokens are directly minted to recipients
        methodName = 'Airdrop';
        methodClaims = method.airdrop.claimCount || 0;
      }

      if (methodClaims > 0) {
        claimsByMethod.push({
          method: methodName,
          count: methodClaims,
        });
        totalClaims += methodClaims;
      }
    }

    // Calculate available claims in one efficient query
    const availableClaimsQuery = await prisma.$transaction([
      // Count total claim links
      prisma.claimLink.count({
        where: {
          distributionMethod: {
            poapId: id,
          },
        },
      }),
      // Sum max claims from other distribution methods
      ...['SecretWord', 'LocationBased', 'Airdrop'].map(type => 
        prisma.distributionMethod.findMany({
          where: { 
            poapId: id, 
            type: type as any
          },
          select: {
            secretWord: type === 'SecretWord' ? { select: { maxClaims: true } } : undefined,
            locationBased: type === 'LocationBased' ? { select: { maxClaims: true } } : undefined,
            airdrop: type === 'Airdrop' ? { select: { addresses: true } } : undefined,
          }
        })
      )
    ]);

    // Process results from transaction
    let availableClaims = availableClaimsQuery[0]; // Claim links count
    
    // Add max claims from other methods
    const secretWordMethods = availableClaimsQuery[1] as any[];
    const locationBasedMethods = availableClaimsQuery[2] as any[];
    const airdropMethods = availableClaimsQuery[3] as any[];
    
    for (const method of secretWordMethods) {
      if (method.secretWord?.maxClaims) {
        availableClaims += method.secretWord.maxClaims;
      }
    }
    
    for (const method of locationBasedMethods) {
      if (method.locationBased?.maxClaims) {
        availableClaims += method.locationBased.maxClaims;
      }
    }
    
    for (const method of airdropMethods) {
      if (method.airdrop?.addresses) {
        availableClaims += method.airdrop.addresses.length;
      }
    }

    // If maxClaims is not set, use supply from POAP
    if (availableClaims === 0 && poap.attendees) {
      availableClaims = poap.attendees;
    }

    // Ensure we have at least the total claims
    availableClaims = Math.max(availableClaims, totalClaims);

    // Convert claimsByDay object to array and sort by date
    const claimsByDayArray = Object.entries(claimsByDay)
      .map(([date, count]) => ({
        date,
        count: count as number,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Find the most active day
    let mostActiveDay = null;
    let maxClaims = 0;

    for (const day of claimsByDayArray) {
      if (day.count > maxClaims) {
        maxClaims = day.count;
        mostActiveDay = day.date;
      }
    }

    // Find the top claim method
    let topClaimMethod = null;
    let topClaimCount = 0;

    for (const method of claimsByMethod) {
      if (method.count > topClaimCount) {
        topClaimCount = method.count;
        topClaimMethod = method.method;
      }
    }

    // Assemble the analytics data
    const analyticsData = {
      totalClaims,
      availableClaims,
      claimMethods: claimsByMethod,
      claimsByDay: claimsByDayArray,
      mostActiveDay: {
        date: mostActiveDay,
        count: maxClaims,
      },
      topClaimMethod: {
        method: topClaimMethod,
        count: topClaimCount,
        percentage: topClaimCount > 0 ? Math.round((topClaimCount / totalClaims) * 100) : 0,
      },
    };

    // Store data in cache
    analyticsCache.set(id, {
      data: analyticsData,
      expiry: now + CACHE_TTL
    });

    return NextResponse.json({ analyticsData });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
