import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'connected';
  } catch {
    health.services.database = 'disconnected';
    health.status = 'degraded';
  }

  // Check Redis connection (if available)
  try {
    const Redis = (await import('ioredis')).default;
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      enableReadyCheck: false,
    });
    const pong = await redis.ping();
    health.services.redis = pong === 'PONG' ? 'connected' : 'disconnected';
    await redis.quit();
  } catch (error) {
    health.services.redis = 'disconnected';
    // Include error details for debugging
    (health as Record<string, unknown>).redisError = error instanceof Error ? error.message : 'Unknown error';
    (health as Record<string, unknown>).redisUrl = process.env.REDIS_URL ? 'set' : 'not set';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
