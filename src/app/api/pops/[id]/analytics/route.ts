import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type Params = Promise<{ id: string }>;

// Enhanced in-memory cache with Redis-like LRU capability
class AnalyticsCache {
  private cache = new Map<string, { data: any, expiry: number, lastAccessed: number }>();
  private readonly maxSize = 100; // Maximum number of items to keep in cache
  private readonly TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  get(key: string) {
    const now = Date.now();
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if item is expired
    if (item.expiry < now) {
      this.cache.delete(key);
      return null;
    }
    
    // Update last accessed time for LRU
    item.lastAccessed = now;
    return item.data;
  }
  
  set(key: string, data: any) {
    const now = Date.now();
    
    // If cache is at capacity, remove least recently used item
    if (this.cache.size >= this.maxSize) {
      let oldestKey = '';
      let oldestAccess = Infinity;
      
      for (const [cacheKey, item] of this.cache.entries()) {
        if (item.lastAccessed < oldestAccess) {
          oldestAccess = item.lastAccessed;
          oldestKey = cacheKey;
        }
      }
      
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      expiry: now + this.TTL,
      lastAccessed: now
    });
  }
}

const analyticsCache = new AnalyticsCache();

// GET analytics data for a POP
export async function GET(request: Request, { params }: { params: Promise<Params > }) {
  try {
    const { id } = await params;
    
    // Check cache first
    const cachedData = analyticsCache.get(id);
    if (cachedData) {
      return NextResponse.json({ analyticsData: cachedData });
    }

    try {
      // First check if POP exists
      const pop = await prisma.pop.findUnique({
        where: { id },
        select: { id: true, attendees: true },
      });

      if (!pop) {
        return NextResponse.json({ error: 'POP not found' }, { status: 404 });
      }

      // Fetch all claims for this POP to use for timeline data
      const popClaims = await prisma.pOPClaim.findMany({
        where: { popId: id },
        select: {
          id: true,
          distributionMethodId: true,
          createdAt: true,
          distributionMethod: {
            select: {
              type: true,
              locationBased: {
                select: { city: true }
              }
            }
          }
        }
      });

      // Fetch distribution methods directly
      const distributionMethods = await prisma.distributionMethod.findMany({
        where: {
          popId: id,
          disabled: false,
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
      let availableClaims = 0;
      let claimsByMethod: {method: string, count: number}[] = [];
      let claimsByDay: Record<string, number> = {};
      let methodClaimsMap: Record<string, number> = {};

      // Group claims by method type
      for (const claim of popClaims) {
        // Format the date (YYYY-MM-DD)
        const date = claim.createdAt.toISOString().split('T')[0];
        
        // Increment the count for this day
        claimsByDay[date] = (claimsByDay[date] || 0) + 1;
        
        // Get method type display name
        let methodName = '';
        if (claim.distributionMethod.type === 'LocationBased' && claim.distributionMethod.locationBased?.city) {
          methodName = `Location - ${claim.distributionMethod.locationBased.city}`;
        } else {
          methodName = getMethodDisplayName(claim.distributionMethod.type);
        }
        
        // Track claims by method
        methodClaimsMap[methodName] = (methodClaimsMap[methodName] || 0) + 1;
      }
      
      // Convert methods map to array
      for (const [method, count] of Object.entries(methodClaimsMap)) {
        claimsByMethod.push({ method, count });
        totalClaims += count;
      }

      // Calculate available claims from distribution methods
      for (const method of distributionMethods) {
        let maxClaims = 0;

        if (method.type === 'ClaimLinks') {
          // For links, available = total links created
          const totalLinks = await prisma.claimLink.count({
            where: { distributionMethodId: method.id }
          });
          maxClaims = totalLinks;
        } else if (method.type === 'SecretWord' && method.secretWord) {
          maxClaims = method.secretWord.maxClaims || 0;
        } else if (method.type === 'LocationBased' && method.locationBased) {
          maxClaims = method.locationBased.maxClaims || 0;
        } else if (method.type === 'Airdrop' && method.airdrop) {
          maxClaims = method.airdrop.addresses?.length || 0;
        }
        
        availableClaims += maxClaims;
      }
      
      // If maxClaims is not set, use supply from POP
      if (availableClaims === 0 && pop.attendees) {
        availableClaims = pop.attendees;
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
      let maxDailyClaims = 0;

      for (const day of claimsByDayArray) {
        if (day.count > maxDailyClaims) {
          maxDailyClaims = day.count;
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
          count: maxDailyClaims,
        },
        topClaimMethod: {
          method: topClaimMethod,
          count: topClaimCount,
          percentage: topClaimCount > 0 ? Math.round((topClaimCount / totalClaims) * 100) : 0,
        },
      };

      // Store data in cache
      analyticsCache.set(id, analyticsData);

      return NextResponse.json({ analyticsData });
    } catch (innerError) {
      console.error('Specific analytics processing error:', innerError);
      throw innerError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to get display name for distribution method types
function getMethodDisplayName(methodType: string): string {
  switch (methodType) {
    case 'ClaimLinks':
      return 'Link';
    case 'SecretWord':
      return 'Secret';
    case 'LocationBased':
      return 'Location';
    case 'Airdrop':
      return 'Airdrop';
    default:
      return methodType;
  }
}
