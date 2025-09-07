import { NextRequest, NextResponse } from 'next/server';
import { testRedisConnection } from '@/lib/redis';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    redis: {
      status: 'up' | 'down';
      responseTime?: number;
    };
    openrouter: {
      status: 'configured' | 'missing';
    };
  };
  version: string;
  uptime: number;
}

const startTime = Date.now();

export async function GET(request: NextRequest) {
  try {
    console.log('=== HEALTH CHECK ===');
    
    const healthStart = Date.now();
    
    // Test Redis connection
    const redisStart = Date.now();
    const redisHealthy = await testRedisConnection();
    const redisResponseTime = Date.now() - redisStart;
    
    // Check if OpenRouter API key is configured
    const openrouterConfigured = !!process.env.OPENROUTER_API_KEY;
    
    const healthResponse: HealthCheckResponse = {
      status: redisHealthy && openrouterConfigured ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: {
          status: redisHealthy ? 'up' : 'down',
          responseTime: redisResponseTime,
        },
        openrouter: {
          status: openrouterConfigured ? 'configured' : 'missing',
        },
      },
      version: '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };
    
    const totalResponseTime = Date.now() - healthStart;
    
    console.log(`Health check completed in ${totalResponseTime}ms`);
    console.log(`Redis: ${redisHealthy ? 'UP' : 'DOWN'} (${redisResponseTime}ms)`);
    console.log(`OpenRouter: ${openrouterConfigured ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`Overall Status: ${healthResponse.status.toUpperCase()}`);
    console.log('=== HEALTH CHECK COMPLETE ===');
    
    const statusCode = healthResponse.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthResponse, { status: statusCode });

  } catch (error: any) {
    console.error('Health check error:', error);
    
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: {
          status: 'down',
        },
        openrouter: {
          status: 'missing',
        },
      },
      version: '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };
    
    return NextResponse.json(errorResponse, { status: 503 });
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}