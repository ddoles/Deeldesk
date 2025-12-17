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

    // Parse URL to check if we need TLS (Railway public URLs need TLS)
    const url = new URL(redisUrl);
    const isPublicUrl = !url.hostname.includes('.internal');

    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 10000,
      commandTimeout: 10000,
      enableReadyCheck: false,
      lazyConnect: true,
      // Enable TLS for public Railway URLs
      ...(isPublicUrl && { tls: {} }),
    });

    await redis.connect();
    const pong = await redis.ping();
    health.services.redis = pong === 'PONG' ? 'connected' : 'disconnected';
    await redis.quit();
  } catch (error) {
    health.services.redis = 'disconnected';
    // Include error details for debugging
    (health as Record<string, unknown>).redisError = error instanceof Error ? error.message : 'Unknown error';
    (health as Record<string, unknown>).redisUrl = process.env.REDIS_URL ? 'set' : 'not set';
    (health as Record<string, unknown>).redisHost = process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : 'not set';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
