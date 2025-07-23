import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cache } from '@/lib/cache';

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1 as test`;
    
    // Check cache system
    const cacheTestKey = 'health-check';
    await cache.set(cacheTestKey, 'ok', { ttl: 10 });
    const cacheResult = await cache.get(cacheTestKey);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: 'healthy',
        cache: cacheResult === 'ok' ? 'healthy' : 'unhealthy',
        api: 'healthy'
      },
      version: process.env.npm_package_version || '1.0.0'
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'unhealthy',
        cache: 'unknown',
        api: 'healthy'
      }
    }, { status: 500 });
  }
}
