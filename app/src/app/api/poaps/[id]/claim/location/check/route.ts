import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Function to calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const poapId = params.id;
  
  try {
    // Get the user location from the request body
    const { latitude, longitude } = await request.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { message: 'Invalid location data' },
        { status: 400 }
      );
    }

    // Find the location-based distribution method for this POAP
    const locationMethod = await prisma.distributionMethod.findFirst({
      where: {
        poapId,
        type: 'LocationBased',
        disabled: false,
        deleted: false,
      },
      include: {
        locationBased: true,
      },
    });

    if (!locationMethod || !locationMethod.locationBased) {
      return NextResponse.json(
        { message: 'No location-based claim method available for this POAP' },
        { status: 404 }
      );
    }

    const locationData = locationMethod.locationBased;

    // Check if claim method has valid coordinates
    if (
      !locationData.latitude ||
      !locationData.longitude
    ) {
      return NextResponse.json(
        { message: 'Location coordinates not configured properly' },
        { status: 400 }
      );
    }

    // Check dates if specified
    const now = new Date();
    if (locationData.startDate && new Date(locationData.startDate) > now) {
      return NextResponse.json(
        { 
          inRange: false,
          message: 'Location-based claim is not yet active' 
        },
        { status: 200 }
      );
    }

    if (locationData.endDate && new Date(locationData.endDate) < now) {
      return NextResponse.json(
        { 
          inRange: false,
          message: 'Location-based claim has expired' 
        },
        { status: 200 }
      );
    }

    // Check max claims if specified
    if (
      locationData.maxClaims !== null &&
      locationData.claimCount >= locationData.maxClaims
    ) {
      return NextResponse.json(
        { 
          inRange: false,
          message: 'Maximum number of claims reached' 
        },
        { status: 200 }
      );
    }

    // Calculate distance
    const distance = calculateDistance(
      latitude,
      longitude,
      locationData.latitude,
      locationData.longitude
    );

    // Check if user is within the allowed radius
    const isInRange = distance <= locationData.radius;

    return NextResponse.json({
      inRange: isInRange,
      distance: Math.round(distance),
      city: locationData.city,
      message: isInRange
        ? `You are within the claim area in ${locationData.city}`
        : `You are ${Math.round(distance)}m away from the claim area`
    });
  } catch (error) {
    console.error('Location check error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
} 