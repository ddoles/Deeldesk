# API Versioning Strategy

**Version:** 1.0
**Status:** MVP Specification
**Last Updated:** December 2025

---

## Overview

This document specifies the API versioning strategy for Deeldesk.ai, ensuring backward compatibility and smooth transitions as the API evolves.

---

## Versioning Approach

### URL-Based Versioning

Deeldesk uses **URL path versioning** as the primary versioning strategy:

```
/api/v1/opportunities
/api/v1/proposals
/api/v1/knowledge/products
```

**Rationale:**
- Clear and explicit versioning
- Easy to route and document
- Industry standard for REST APIs
- Works well with API gateways and CDNs

### Version Format

```
/api/v{major}/resource

Examples:
/api/v1/opportunities
/api/v2/opportunities  (future)
```

- **Major version** increments indicate breaking changes
- Minor and patch changes are backward-compatible within a major version

---

## Versioning Rules

### What Triggers a New Major Version

The following changes require a new API version:

| Change Type | Example | Requires New Version |
|-------------|---------|---------------------|
| Remove endpoint | DELETE `/api/opportunities/:id/context` | Yes |
| Remove field from response | Remove `proposal.slides` | Yes |
| Change field type | `price: string` → `price: number` | Yes |
| Change field meaning | `status: 'active'` now means something different | Yes |
| Change authentication method | Bearer token → API key | Yes |
| Change error response format | Different error structure | Yes |
| Remove query parameter | Remove `?include=proposals` | Yes |

### What Does NOT Require a New Version

| Change Type | Example | Requires New Version |
|-------------|---------|---------------------|
| Add new endpoint | Add `/api/v1/analytics` | No |
| Add optional field to response | Add `proposal.metadata` | No |
| Add optional request parameter | Add `?limit=50` | No |
| Add new enum value | Add `status: 'archived'` | No |
| Performance improvements | Faster response times | No |
| Bug fixes | Correct calculation errors | No |
| Add new error code | Add `RATE_LIMIT_EXCEEDED` | No |

---

## API Lifecycle

### Version Lifecycle States

```
┌─────────────────────────────────────────────────────────────────┐
│                      Version Lifecycle                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Alpha   │ → │   Beta   │ → │  Stable  │ → │Deprecated│  │
│  │ (v2-alpha)│    │ (v2-beta)│    │   (v2)   │    │   (v1)   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                        │         │
│                                                        ▼         │
│                                                 ┌──────────┐    │
│                                                 │  Sunset  │    │
│                                                 │ (removed)│    │
│                                                 └──────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Lifecycle Definitions

| State | Description | Duration |
|-------|-------------|----------|
| **Alpha** | Experimental, may change without notice | Variable |
| **Beta** | Feature-complete, minor changes possible | 1-3 months |
| **Stable** | Production-ready, full support | Ongoing |
| **Deprecated** | Still functional, migration encouraged | 12 months |
| **Sunset** | Removed, returns 410 Gone | N/A |

---

## Deprecation Policy

### Deprecation Timeline

1. **Announcement** (Day 0)
   - Deprecation notice in API response headers
   - Documentation updated
   - Email notification to API users

2. **Deprecation Period** (12 months)
   - Old version continues to function
   - `Deprecation` and `Sunset` headers included
   - Console warnings in development

3. **Sunset** (Month 12+)
   - Old version returns `410 Gone`
   - Migration guide available
   - Support for new version only

### Deprecation Headers

When an endpoint is deprecated, include these headers:

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 15 Jan 2027 00:00:00 GMT
Link: </api/v2/opportunities>; rel="successor-version"
X-Deprecation-Notice: This endpoint is deprecated. Please migrate to /api/v2/opportunities by January 2027.
```

### Response Body Warning

For deprecated endpoints, include a warning in the response:

```json
{
  "data": { ... },
  "_deprecation": {
    "message": "This API version is deprecated",
    "sunsetDate": "2027-01-15T00:00:00Z",
    "migrationGuide": "https://docs.deeldesk.ai/migration/v1-to-v2",
    "newEndpoint": "/api/v2/opportunities"
  }
}
```

---

## Implementation

### Route Structure

```typescript
// app/api/v1/opportunities/route.ts
export async function GET(request: NextRequest) {
  // v1 implementation
}

// app/api/v2/opportunities/route.ts (future)
export async function GET(request: NextRequest) {
  // v2 implementation
}
```

### Version Detection Middleware

```typescript
// middleware.ts

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/^\/api\/v(\d+)\//);

  if (!pathMatch) {
    // No version specified, redirect to latest stable
    return NextResponse.redirect(
      new URL(url.pathname.replace('/api/', '/api/v1/'), request.url)
    );
  }

  const version = parseInt(pathMatch[1]);

  // Check if version is supported
  if (!SUPPORTED_VERSIONS.includes(version)) {
    return NextResponse.json(
      { error: `API version ${version} is not supported` },
      { status: 400 }
    );
  }

  // Check if version is deprecated
  if (DEPRECATED_VERSIONS.includes(version)) {
    const response = NextResponse.next();
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', SUNSET_DATES[version]);
    return response;
  }

  return NextResponse.next();
}
```

### Version Configuration

```typescript
// lib/api/versions.ts

export const API_VERSIONS = {
  v1: {
    status: 'stable',
    releasedAt: '2025-01-01',
    deprecatedAt: null,
    sunsetAt: null,
  },
  // v2 example (future)
  // v2: {
  //   status: 'stable',
  //   releasedAt: '2026-01-01',
  //   deprecatedAt: null,
  //   sunsetAt: null,
  // },
} as const;

export const SUPPORTED_VERSIONS = [1];
export const DEPRECATED_VERSIONS: number[] = [];
export const SUNSET_DATES: Record<number, string> = {};
```

---

## Documentation

### OpenAPI Specification

Each version has its own OpenAPI spec:

```yaml
# openapi/v1.yaml
openapi: 3.1.0
info:
  title: Deeldesk API
  version: 1.0.0
  description: |
    Deeldesk.ai API for proposal generation and management.

    ## Versioning
    This API uses URL-based versioning. Include the version in the path:
    `/api/v1/opportunities`

    ## Deprecation
    Deprecated endpoints will include `Deprecation` and `Sunset` headers.
    Check the migration guide before sunset dates.

servers:
  - url: https://api.deeldesk.ai/api/v1
    description: Production

paths:
  /opportunities:
    get:
      summary: List opportunities
      # ...
```

### Migration Guides

For each major version upgrade, provide a migration guide:

```markdown
# Migrating from API v1 to v2

## Overview
API v2 introduces improved response formats and new features.
v1 will be sunset on January 15, 2027.

## Breaking Changes

### 1. Opportunity Response Format
**v1:**
```json
{ "id": "opp_123", "name": "Acme Deal" }
```

**v2:**
```json
{ "data": { "id": "opp_123", "attributes": { "name": "Acme Deal" } } }
```

### 2. Pagination
**v1:** Offset-based (`?offset=20&limit=10`)
**v2:** Cursor-based (`?cursor=abc123&limit=10`)

## Migration Steps
1. Update API base URL to `/api/v2/`
2. Update response parsing for new format
3. Update pagination handling
4. Test thoroughly before cutover
```

---

## Error Handling

### Version-Related Errors

```json
// Unsupported version
{
  "error": {
    "code": "UNSUPPORTED_VERSION",
    "message": "API version 3 is not supported",
    "supportedVersions": [1, 2],
    "documentation": "https://docs.deeldesk.ai/api/versions"
  }
}

// Sunset version
{
  "error": {
    "code": "VERSION_SUNSET",
    "message": "API version 0 has been sunset",
    "currentVersion": 1,
    "migrationGuide": "https://docs.deeldesk.ai/migration/v0-to-v1"
  }
}
```

### HTTP Status Codes

| Scenario | Status Code |
|----------|-------------|
| Unsupported version | 400 Bad Request |
| Sunset version | 410 Gone |
| Deprecated endpoint (still working) | 200 OK (with headers) |

---

## Client SDK Considerations

### SDK Version Alignment

- SDK major version should match API major version
- SDK 1.x → API v1
- SDK 2.x → API v2

### SDK Version Header

SDKs should include version information in requests:

```http
User-Agent: deeldesk-sdk-js/1.2.3
X-SDK-Version: 1.2.3
X-SDK-Language: javascript
```

### Backwards Compatibility in SDK

```typescript
// sdk/client.ts

export class DeeldeskClient {
  constructor(config: ClientConfig) {
    this.apiVersion = config.apiVersion ?? 1;
    this.baseUrl = `${config.baseUrl}/api/v${this.apiVersion}`;
  }

  // Handle deprecated responses
  private handleResponse<T>(response: Response, data: any): T {
    if (response.headers.get('Deprecation') === 'true') {
      console.warn(
        `[Deeldesk SDK] Warning: This API version is deprecated. ` +
        `Sunset date: ${response.headers.get('Sunset')}. ` +
        `Please upgrade your SDK.`
      );
    }
    return data as T;
  }
}
```

---

## Monitoring

### Metrics to Track

| Metric | Purpose |
|--------|---------|
| Requests by version | Track adoption of new versions |
| Deprecated endpoint usage | Identify clients needing migration |
| Version errors | Detect integration issues |
| Time until sunset | Plan deprecation communications |

### Alerting

```yaml
# alerts/api-versioning.yaml
groups:
  - name: api-versioning
    rules:
      - alert: HighDeprecatedAPIUsage
        expr: rate(api_requests_total{version="v1", deprecated="true"}[1h]) > 100
        for: 24h
        labels:
          severity: warning
        annotations:
          summary: "High usage of deprecated API v1"
          description: "Consider reaching out to heavy users for migration support"

      - alert: SunsetApproaching
        expr: (api_sunset_timestamp - time()) / 86400 < 30
        labels:
          severity: warning
        annotations:
          summary: "API version sunset in less than 30 days"
```

---

## Communication Plan

### Deprecation Announcement

**Channels:**
- In-app notification
- Email to API users
- API documentation banner
- Changelog entry
- Status page update

**Template:**
```
Subject: [Action Required] Deeldesk API v1 Deprecation Notice

Dear Developer,

We're writing to inform you that Deeldesk API v1 will be deprecated on [DATE]
and sunset on [DATE + 12 months].

**What's Changing:**
- API v1 endpoints will stop functioning after [SUNSET DATE]
- Please migrate to API v2 before this date

**Migration Resources:**
- Migration Guide: [URL]
- API v2 Documentation: [URL]
- Support: api-support@deeldesk.ai

**Timeline:**
- [DATE]: v1 deprecated, v2 stable
- [DATE + 6 months]: Reminder notification
- [DATE + 12 months]: v1 sunset

If you have questions or need migration assistance, please contact us.

Best regards,
The Deeldesk Team
```

---

## MVP Scope

For MVP launch:

1. **Single Version (v1)** — No versioning complexity initially
2. **Versioned URLs** — Structure for `/api/v1/` from day one
3. **Version Headers** — Include `API-Version: 1` in responses
4. **Documentation** — OpenAPI spec for v1

Future versions will follow this strategy when breaking changes are needed.

---

## References

- [Rate Limiting](../operations/RATE_LIMITING.md) — API rate limits
- [Monitoring](../operations/MONITORING.md) — API monitoring
- [README.md](../../README.md) — API reference
