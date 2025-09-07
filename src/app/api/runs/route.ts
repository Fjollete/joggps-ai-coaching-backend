import { NextRequest, NextResponse } from 'next/server';
import { RunHistory } from '@/types/coaching';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    console.log('=== RUN HISTORY LOG ===');
    
    // Parse request body
    const body: RunHistory = await request.json();
    console.log('Run history log request:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.date || !body.distance || !body.duration) {
      return NextResponse.json(
        { error: 'Missing required fields: date, distance, duration' },
        { status: 400 }
      );
    }

    const redis = await getRedisClient();
    
    // Extract deviceId from request headers or use a default approach
    // Since the Android app sends deviceId in coaching requests, we'll expect it in the body
    const deviceId = (body as any).deviceId || 'unknown';
    
    // Store run in Redis with a unique key
    const runId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const runKey = `run:${deviceId}:${runId}`;
    
    const runData = {
      ...body,
      id: runId,
      deviceId,
      loggedAt: new Date().toISOString(),
    };
    
    // Store individual run (expire after 1 year)
    await redis.setEx(runKey, 365 * 24 * 60 * 60, JSON.stringify(runData));
    
    // Update user's recent runs list
    const recentRunsKey = `recent_runs:${deviceId}`;
    
    // Get current recent runs
    const recentRunsData = await redis.get(recentRunsKey);
    let recentRuns: RunHistory[] = recentRunsData ? JSON.parse(recentRunsData) : [];
    
    // Add new run to the front
    recentRuns.unshift(body);
    
    // Keep only the last 50 runs
    recentRuns = recentRuns.slice(0, 50);
    
    // Store updated recent runs list (expire after 1 year)
    await redis.setEx(recentRunsKey, 365 * 24 * 60 * 60, JSON.stringify(recentRuns));
    
    console.log(`Run logged successfully for device: ${deviceId}`);
    console.log(`Distance: ${(body.distance / 1000).toFixed(2)}km, Duration: ${Math.floor(body.duration / 60)}:${(body.duration % 60).toString().padStart(2, '0')}`);
    console.log('=== RUN LOG COMPLETE ===');
    
    return NextResponse.json({ success: true, runId });

  } catch (error: any) {
    console.error('Error logging run:', error);
    
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
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Missing deviceId parameter' },
        { status: 400 }
      );
    }
    
    const redis = await getRedisClient();
    const recentRunsKey = `recent_runs:${deviceId}`;
    
    const recentRunsData = await redis.get(recentRunsKey);
    
    if (!recentRunsData) {
      return NextResponse.json([]);
    }
    
    const recentRuns: RunHistory[] = JSON.parse(recentRunsData);
    
    // Return requested number of runs
    const limitedRuns = recentRuns.slice(0, Math.min(limit, recentRuns.length));
    
    return NextResponse.json(limitedRuns);

  } catch (error: any) {
    console.error('Error getting run history:', error);
    
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