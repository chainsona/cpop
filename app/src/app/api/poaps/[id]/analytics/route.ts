import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type Params = Promise<{ id: string }>;

// GET analytics data for a POAP
export async function GET(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;

    // Check if POAP exists
    const poap = await prisma.poap.findUnique({
      where: { id },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Get distribution methods with their related claims data (only active ones)
    const distributionMethods = await prisma.distributionMethod.findMany({
      where: {
        poapId: id,
        disabled: false, // Only include active methods
      },
      include: {
        claimLinks: true,
        secretWord: true,
        locationBased: true,
      },
    });

    // Calculate total claims
    let totalClaims = 0;
    let claimsByMethod = [];
    let claimsByDay: Record<string, number> = {};

    for (const method of distributionMethods) {
      let methodClaims = 0;
      let methodName = '';

      // Calculate claims based on distribution method type
      if (method.type === 'ClaimLinks' && method.claimLinks) {
        const claims = method.claimLinks.filter(link => link.claimed);
        methodClaims = claims.length;
        methodName = 'Link';

        // Process claims by day for this method
        for (const link of claims) {
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
        methodClaims = method.locationBased.claimCount;
        methodName = 'Location';

        // Similar approach for location-based claims
        const daysWithClaims = 5;
        if (methodClaims > 0) {
          const today = new Date();
          const claimsPerDay = Math.ceil(methodClaims / daysWithClaims);
          for (let i = 0; i < daysWithClaims; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i - 1); // Offset by 1 more day from secret words
            const dateStr = date.toISOString().split('T')[0];
            claimsByDay[dateStr] =
              (claimsByDay[dateStr] || 0) +
              (i === daysWithClaims - 1
                ? methodClaims - claimsPerDay * (daysWithClaims - 1)
                : claimsPerDay);
          }
        }
      }

      if (methodClaims > 0) {
        claimsByMethod.push({
          method: methodName,
          count: methodClaims,
        });
        totalClaims += methodClaims;
      }
    }

    // Get total available claims (claimed + unclaimed)
    let availableClaims = 0;

    // Calculate based on claim links
    const claimLinksCount = await prisma.claimLink.count({
      where: {
        distributionMethod: {
          poapId: id,
        },
      },
    });
    availableClaims += claimLinksCount;

    // Add max claims from secret words and location-based
    for (const method of distributionMethods) {
      if (method.type === 'SecretWord' && method.secretWord?.maxClaims) {
        availableClaims += method.secretWord.maxClaims;
      } else if (method.type === 'LocationBased' && method.locationBased?.maxClaims) {
        availableClaims += method.locationBased.maxClaims;
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

    // Assemble and return the analytics data
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
