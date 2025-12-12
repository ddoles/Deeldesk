# Rate Limiting Strategy

**Version:** 1.0
**Status:** MVP Specification
**Last Updated:** December 2025

---

## Overview

Rate limiting protects Deeldesk.ai from abuse, ensures fair resource allocation across users, and controls LLM API costs. This document specifies rate limits at multiple levels.

---

## Rate Limit Tiers

### By Plan Tier

| Resource | Free | Pro | Team | Enterprise |
|----------|------|-----|------|------------|
| **Proposals/month** | 5 | 50 | 200/user | Unlimited* |
| **KB items** | 50 | 500 | Unlimited | Unlimited |
| **Competitors (battlecards)** | 3 | 20 | Unlimited | Unlimited |
| **API calls/minute** | 10 | 60 | 120 | Custom |
| **Concurrent generations** | 1 | 3 | 5/user | Custom |
| **Business model generations/day** | 3 | 10 | 20 | Unlimited |

*Enterprise "Unlimited" subject to fair use policy (>1000/month triggers review)

### By Resource Type

#### Proposal Generation

| Limit Type | Value | Window | Action |
|------------|-------|--------|--------|
| Per-user concurrent | 1-5 (by plan) | N/A | Queue additional requests |
| Per-org per hour | 20-100 (by plan) | 1 hour | Soft block + warning |
| Per-org per day | 50-500 (by plan) | 24 hours | Hard block |

#### Knowledge Base Operations

| Limit Type | Value | Window | Action |
|------------|-------|--------|--------|
| Item creation/hour | 50 | 1 hour | Soft block |
| Bulk upload items | 100 per upload | N/A | Hard limit |
| Vector embedding/minute | 100 | 1 minute | Queue additional |

#### Public Proposal Views (Share Links)

| Limit Type | Value | Window | Action |
|------------|-------|--------|--------|
| Views per link/hour | 100-10000 (by plan) | 1 hour | Rate limit response |
| Views per IP/minute | 10 | 1 minute | 429 response |
| Unique viewers/day | 1000-100000 (by plan) | 24 hours | Soft block + alert |

#### API Endpoints (General)

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|--------|
| Read operations (GET) | 120/min | 1 minute |
| Write operations (POST/PUT/PATCH) | 60/min | 1 minute |
| Delete operations | 30/min | 1 minute |
| Search/query | 30/min | 1 minute |

---

## Implementation

### Rate Limiter Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                    (Next.js Middleware)                          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Rate Limiter Service                        │
│                         (Redis-backed)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   IP-based   │  │  User-based  │  │   Org-based  │          │
│  │   Limiter    │  │   Limiter    │  │   Limiter    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                           Redis                                  │
│              (Sliding window counters)                          │
└─────────────────────────────────────────────────────────────────┘
```

### Redis Key Structure

```
rate_limit:{scope}:{identifier}:{resource}:{window}

Examples:
rate_limit:ip:192.168.1.1:api:minute
rate_limit:user:user_123:proposals:day
rate_limit:org:org_456:generations:month
```

### Algorithm: Sliding Window Log

```typescript
// lib/rate-limiter.ts

import { Redis } from 'ioredis';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds
}

export async function checkRateLimit(
  redis: Redis,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Use Redis transaction
  const pipeline = redis.pipeline();

  // Remove old entries
  pipeline.zremrangebyscore(key, 0, windowStart);

  // Count current entries
  pipeline.zcard(key);

  // Add current request (optimistically)
  pipeline.zadd(key, now, `${now}-${Math.random()}`);

  // Set expiry
  pipeline.pexpire(key, windowMs);

  const results = await pipeline.exec();
  const currentCount = results![1][1] as number;

  if (currentCount >= limit) {
    // Over limit - remove the optimistic add
    await redis.zremrangebyscore(key, now, now);

    // Find oldest entry to calculate retry-after
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const oldestTime = oldest.length > 1 ? parseInt(oldest[1]) : now;
    const retryAfter = Math.ceil((oldestTime + windowMs - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(oldestTime + windowMs),
      retryAfter,
    };
  }

  return {
    allowed: true,
    remaining: limit - currentCount - 1,
    resetAt: new Date(now + windowMs),
  };
}
```

### Implementation Options

> **IMPORTANT**: Next.js middleware runs on the Edge Runtime, which does not support Node.js TCP sockets. This means traditional Redis clients like `ioredis` cannot be used in middleware.

#### Option A: Edge-Compatible Redis (Recommended for MVP)

Use Upstash Redis with their Edge-compatible `@upstash/redis` client:

```typescript
// middleware.ts (Next.js)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create rate limiter with Upstash (Edge-compatible)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(120, '1 m'), // 120 requests per minute
  analytics: true,
});

export async function middleware(request: NextRequest) {
  // Get identifier (IP for unauthenticated, will be enhanced in API routes)
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

#### Option B: API Route Handlers Only (No Middleware Rate Limiting)

Skip Edge middleware entirely and implement rate limiting in API route handlers using ioredis:

```typescript
// lib/rate-limiter.ts (Node.js runtime only)

import { Redis } from 'ioredis';

// This runs in Node.js runtime (API routes), NOT Edge middleware
export async function checkRateLimit(
  redis: Redis,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // ... existing implementation ...
}
```

```typescript
// app/api/[...route]/route.ts
export const runtime = 'nodejs'; // Explicitly use Node.js runtime

import { checkRateLimit } from '@/lib/rate-limiter';
// ... rate limiting in handler
```

#### Decision Required

| Approach | Pros | Cons |
|----------|------|------|
| **Upstash (Option A)** | Works in Edge, simple setup, built-in analytics | Additional service cost, vendor dependency |
| **API Routes Only (Option B)** | Uses existing Redis, no new dependencies | IP-level limits only apply after route matching |

**Recommendation for MVP**: Use Option B (API route handlers) for simplicity. The BullMQ Redis instance can be reused. Add Edge middleware with Upstash in Sprint 8 if DDoS protection is needed before launch.

### API Route Rate Limiting (Node.js Runtime)

```typescript
// lib/api-utils.ts

export async function withRateLimit<T>(
  request: NextRequest,
  session: Session,
  config: {
    resource: string;
    userLimit?: number;
    orgLimit?: number;
    windowMs?: number;
  },
  handler: () => Promise<T>
): Promise<NextResponse<T> | NextResponse<{ error: string }>> {
  const redis = getRedis();
  const windowMs = config.windowMs ?? 60_000;

  // User-level limit
  if (config.userLimit) {
    const userResult = await checkRateLimit(
      redis,
      `rate_limit:user:${session.userId}:${config.resource}`,
      config.userLimit,
      windowMs
    );

    if (!userResult.allowed) {
      return NextResponse.json(
        { error: 'User rate limit exceeded', retryAfter: userResult.retryAfter },
        { status: 429 }
      );
    }
  }

  // Org-level limit
  if (config.orgLimit) {
    const orgResult = await checkRateLimit(
      redis,
      `rate_limit:org:${session.organizationId}:${config.resource}`,
      config.orgLimit,
      windowMs
    );

    if (!orgResult.allowed) {
      return NextResponse.json(
        { error: 'Organization rate limit exceeded', retryAfter: orgResult.retryAfter },
        { status: 429 }
      );
    }
  }

  // Execute handler
  const result = await handler();
  return NextResponse.json(result);
}
```

---

## Usage Tracking

### Monthly Usage Counters

Separate from rate limiting, track monthly usage for plan limits:

```typescript
// lib/usage.ts

export async function trackUsage(
  organizationId: string,
  resource: 'proposals' | 'kb_items' | 'competitors',
  increment: number = 1
): Promise<UsageStatus> {
  const periodStart = getMonthStart();

  await prisma.usageTracking.upsert({
    where: {
      organizationId_periodStart: {
        organizationId,
        periodStart,
      },
    },
    create: {
      organizationId,
      periodStart,
      periodEnd: getMonthEnd(),
      [`${resource}Count`]: increment,
    },
    update: {
      [`${resource}Count`]: { increment },
    },
  });

  return getUsageStatus(organizationId);
}

export async function checkUsageLimit(
  organizationId: string,
  resource: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const org = await getOrganization(organizationId);
  const usage = await getCurrentUsage(organizationId);
  const limit = getPlanLimit(org.planTier, resource);

  return {
    allowed: limit === null || usage[resource] < limit,
    current: usage[resource],
    limit: limit ?? Infinity,
  };
}
```

---

## Response Headers

All API responses include rate limit headers:

```http
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2025-01-15T10:30:00Z
X-RateLimit-Resource: api
```

For 429 responses:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-01-15T10:30:00Z

{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 45,
  "resource": "api",
  "limit": 120,
  "window": "1 minute"
}
```

---

## Client-Side Handling

### Retry Logic

```typescript
// lib/api-client.ts

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60');
      const backoff = Math.min(retryAfter * 1000, 60_000);

      console.warn(`Rate limited. Retrying in ${backoff}ms...`);
      await sleep(backoff);
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

### UI Warning

When approaching limits (>80% used), show warning:

```typescript
if (usageStatus.proposalsRemaining / usageStatus.proposalsLimit < 0.2) {
  showWarning(`You have ${usageStatus.proposalsRemaining} proposals remaining this month.`);
}
```

---

## Monitoring & Alerting

### Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| 429 response rate | >5% of requests |
| Rate limit hits/minute | >100 (indicates possible abuse) |
| User hitting limits repeatedly | >10 times/hour |
| Org approaching monthly limit | >90% |

### Logging

```json
{
  "event": "rate_limit_exceeded",
  "scope": "user",
  "identifier": "user_123",
  "resource": "proposals",
  "limit": 50,
  "window": "month",
  "current": 51,
  "ip": "192.168.1.1"
}
```

---

## Abuse Prevention

### Patterns to Detect

1. **Credential sharing** — Multiple IPs for same user in short window
2. **Scraping** — High-volume sequential requests
3. **DDoS attempts** — Spike in unauthenticated requests
4. **Bot traffic** — Missing user-agent, suspicious patterns

### Automatic Responses

| Pattern | Response |
|---------|----------|
| >10 IPs/user/hour | Flag account for review |
| >1000 requests/IP/minute | Temporary IP ban (1 hour) |
| Repeated 429s (>50/hour) | Escalating backoff requirement |
| Missing auth on protected routes | Immediate 401 + IP rate limit |

---

## Configuration

### Environment Variables

```env
# Rate limit configuration
RATE_LIMIT_REDIS_URL=redis://localhost:6379/1
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOG_ONLY=false  # Set true for monitoring without blocking

# Default limits (can be overridden per plan)
RATE_LIMIT_API_PER_MINUTE=120
RATE_LIMIT_GENERATIONS_PER_DAY=50
```

### Per-Organization Overrides

Enterprise customers may have custom limits:

```typescript
// In organization settings
{
  "rateLimits": {
    "apiPerMinute": 500,
    "generationsPerMonth": null,  // unlimited
    "concurrentGenerations": 20
  }
}
```

---

## Testing

### Load Testing

Before launch, validate rate limits under load:

```bash
# Test API rate limits
k6 run scripts/load-test-api.js

# Test proposal generation queue
k6 run scripts/load-test-generation.js
```

### Unit Tests

```typescript
describe('Rate Limiter', () => {
  it('should allow requests under limit', async () => {
    const result = await checkRateLimit(redis, 'test:key', 10, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('should block requests over limit', async () => {
    // Fill up the limit
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(redis, 'test:key', 10, 60000);
    }

    const result = await checkRateLimit(redis, 'test:key', 10, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});
```

---

## References

- [README.md](../../README.md) — Plan tier features
- [Monitoring](./MONITORING.md) — Alerting configuration
- [API Versioning](../architecture/API_VERSIONING.md) — API design
