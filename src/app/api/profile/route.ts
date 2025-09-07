import { NextRequest, NextResponse } from 'next/server';
import { UserProfile } from '@/types/coaching';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    console.log('=== USER PROFILE UPDATE ===');
    
    // Parse request body
    const body: UserProfile = await request.json();
    console.log('Profile update request:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.deviceId) {
      return NextResponse.json(
        { error: 'Missing required field: deviceId' },
        { status: 400 }
      );
    }

    const redis = await getRedisClient();
    
    // Store user profile in Redis with expiration (30 days)
    const profileKey = `profile:${body.deviceId}`;
    const profileData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    await redis.setEx(profileKey, 30 * 24 * 60 * 60, JSON.stringify(profileData)); // 30 days
    
    console.log(`User profile updated for device: ${body.deviceId}`);
    
    // If training goal was updated, clear related cache
    if (body.trainingGoal) {
      console.log(`Training goal updated: ${body.trainingGoal.raceType} in ${body.trainingGoal.targetTime}s`);
      
      // Clear any existing coaching cache for this device to ensure fresh messages
      const pattern = `coaching:${body.deviceId}:*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(keys);
        console.log(`Cleared ${keys.length} cached coaching messages for updated training goal`);
      }
    }
    
    console.log('=== PROFILE UPDATE COMPLETE ===');
    
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const deviceId = url.searchParams.get('deviceId');
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Missing deviceId parameter' },
        { status: 400 }
      );
    }
    
    const redis = await getRedisClient();
    const profileKey = `profile:${deviceId}`;
    
    const profileData = await redis.get(profileKey);
    
    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    const profile: UserProfile = JSON.parse(profileData);
    
    return NextResponse.json(profile);

  } catch (error: any) {
    console.error('Error getting user profile:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}