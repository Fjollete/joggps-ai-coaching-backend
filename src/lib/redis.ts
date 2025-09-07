import Redis from 'redis';

let redis: Redis | null = null;

export async function getRedisClient(): Promise<Redis> {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST ? 
      `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}` : 
      'redis://localhost:6379';
    
    console.log('Connecting to Redis:', redisUrl.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    redis = Redis.createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        connectTimeout: 60000,
        lazyConnect: true,
      },
      // Optimize for AI coaching use case
      database: 0,
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });

    await redis.connect();
  }

  return redis;
}

export async function closeRedisConnection() {
  if (redis) {
    await redis.disconnect();
    redis = null;
  }
}

// Cache helper functions for coaching messages
export async function getCachedMessage(cacheKey: string): Promise<string | null> {
  try {
    const client = await getRedisClient();
    return await client.get(cacheKey);
  } catch (error) {
    console.error('Error getting cached message:', error);
    return null;
  }
}

export async function setCachedMessage(cacheKey: string, message: string, ttlSeconds: number = 60): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.setEx(cacheKey, ttlSeconds, message);
  } catch (error) {
    console.error('Error setting cached message:', error);
  }
}

export async function deleteCachedMessage(cacheKey: string): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.del(cacheKey);
  } catch (error) {
    console.error('Error deleting cached message:', error);
  }
}

// Generate cache key based on running context
export function generateCacheKey(
  deviceId: string, 
  pace: number, 
  heartRate: number | undefined, 
  distance: number,
  modelApiValue: string | undefined
): string {
  const hrKey = heartRate ? Math.round(heartRate / 5) * 5 : 'no-hr'; // Round to nearest 5 bpm
  const paceKey = Math.round(pace / 10) * 10; // Round to nearest 10 sec/km
  const distanceKey = Math.round(distance / 100) * 100; // Round to nearest 100m
  const modelKey = modelApiValue || 'default';
  
  return `coaching:${deviceId}:${paceKey}:${hrKey}:${distanceKey}:${modelKey}`;
}

// Health check function
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}