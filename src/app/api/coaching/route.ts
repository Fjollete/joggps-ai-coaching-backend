import { NextRequest, NextResponse } from 'next/server';
import { CoachingRequest, CoachingResponse, CachedCoaching } from '@/types/coaching';
import { generateCoachingMessage } from '@/lib/openrouter';
import { 
  getRedisClient, 
  getCachedMessage, 
  setCachedMessage, 
  generateCacheKey 
} from '@/lib/redis';

// Cache settings - optimized for AI coaching variety
const CACHE_TTL_MINUTES = 1; // 1 minute cache
const SIMILAR_PACE_THRESHOLD = 10; // 10 sec/km
const SIMILAR_HR_THRESHOLD = 5; // 5 bpm
const MIN_DISTANCE_BETWEEN_MESSAGES = 200; // 200m minimum

export async function POST(request: NextRequest) {
  try {
    console.log('=== AI COACHING REQUEST DEBUG ===');
    
    // Parse request body
    const body: CoachingRequest = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.deviceId || !body.currentSegment || !body.runTotals) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId, currentSegment, runTotals' },
        { status: 400 }
      );
    }

    const { deviceId, runTotals, model } = body;
    console.log(`AI Model: ${model || 'Default (GPT-4.1 Nano)'}`);
    console.log(`Distance: ${runTotals.distance}m (${(runTotals.distance / 1000).toFixed(2)}km)`);
    console.log(`Average Pace: ${runTotals.avgPace} sec/km (${(runTotals.avgPace / 60).toFixed(2)} min/km)`);
    
    // Check cache first
    const cachedMessage = await checkCache(body);
    if (cachedMessage) {
      console.log('Using cached coaching message');
      console.log('=== END DEBUG (CACHED) ===');
      
      return NextResponse.json<CoachingResponse>({
        message: cachedMessage,
        cacheKey: 'cached'
      });
    }

    // Generate new coaching message
    console.log('Generating new coaching message via OpenRouter...');
    const message = await generateCoachingMessage(body);
    
    // Cache the response
    await cacheCoachingMessage(message, body);
    
    console.log('=== END DEBUG (NEW MESSAGE) ===');
    
    return NextResponse.json<CoachingResponse>({
      message,
    });

  } catch (error: any) {
    console.error('Error in coaching API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: getFallbackMessage(Math.random() * 1000) // Random distance for variety
      },
      { status: 500 }
    );
  }
}

async function checkCache(request: CoachingRequest): Promise<string | null> {
  try {
    const redis = await getRedisClient();
    
    // Generate cache key
    const cacheKey = generateCacheKey(
      request.deviceId,
      request.runTotals.avgPace,
      request.runTotals.avgHeartRate,
      request.runTotals.distance,
      request.model
    );
    
    // Check for exact match first
    const exactMatch = await redis.get(cacheKey);
    if (exactMatch) {
      const cached: CachedCoaching = JSON.parse(exactMatch);
      
      // Verify cache is still fresh
      const now = Date.now();
      const cacheAge = (now - cached.timestamp) / 1000 / 60; // minutes
      
      if (cacheAge <= CACHE_TTL_MINUTES) {
        // Check if runner has moved far enough for new message
        const distanceDiff = Math.abs(request.runTotals.distance - cached.distance);
        if (distanceDiff < MIN_DISTANCE_BETWEEN_MESSAGES) {
          return cached.message;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

async function cacheCoachingMessage(message: string, request: CoachingRequest): Promise<void> {
  try {
    const redis = await getRedisClient();
    
    const cacheKey = generateCacheKey(
      request.deviceId,
      request.runTotals.avgPace,
      request.runTotals.avgHeartRate,
      request.runTotals.distance,
      request.model
    );
    
    const cachedData: CachedCoaching = {
      message,
      timestamp: Date.now(),
      pace: request.runTotals.avgPace,
      heartRate: request.runTotals.avgHeartRate,
      distance: request.runTotals.distance,
      modelApiValue: request.model,
    };
    
    await redis.setEx(cacheKey, CACHE_TTL_MINUTES * 60, JSON.stringify(cachedData));
    console.log(`Cached message with key: ${cacheKey}`);
  } catch (error) {
    console.error('Error caching message:', error);
  }
}

function getFallbackMessage(distance: number): string {
  const messages = [
    "Keep up the great work! You're doing awesome.",
    "Stay strong and maintain your rhythm.",
    "Focus on your breathing and stay relaxed.",
    "You've got this! Keep pushing forward.",
    "Great pace! Stay consistent.",
    "Listen to your body and keep it up.",
    "One step at a time, you're making progress!",
    "Stay focused and trust your training."
  ];
  
  // Use distance to pick a consistent message for the same segment
  const index = Math.floor(distance / 100) % messages.length;
  return messages[index];
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}