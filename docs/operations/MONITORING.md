# Monitoring & Alerting Strategy

**Version:** 1.0
**Status:** MVP Specification
**Last Updated:** December 2025

---

## Overview

This document specifies the monitoring and alerting strategy for Deeldesk.ai, ensuring system health, performance visibility, and rapid incident response.

---

## Monitoring Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                            │
│   (Next.js, BullMQ Worker, API Routes)                          │
└─────────────────────────────────────────────────────────────────┘
                               │
                    Metrics / Logs / Traces
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Collection Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ OpenTelemetry│  │   Fluent Bit │  │  Prometheus  │          │
│  │   (Traces)   │  │    (Logs)    │  │  (Metrics)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Storage & Analysis                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Jaeger    │  │ CloudWatch   │  │   Grafana    │          │
│  │   (Traces)   │  │   (Logs)     │  │ (Dashboards) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Alerting Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ PagerDuty    │  │    Slack     │  │    Email     │          │
│  │ (Critical)   │  │  (Warning)   │  │   (Info)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Metrics

### Application Metrics

#### Proposal Generation

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `proposal_generation_duration_seconds` | Time to generate proposal | P95 > 90s (warning), > 120s (critical) |
| `proposal_generation_total` | Count of generations | N/A (tracking only) |
| `proposal_generation_errors_total` | Failed generations | Error rate > 5% (warning), > 10% (critical) |
| `proposal_queue_depth` | BullMQ queue size | > 100 (warning), > 500 (critical) |
| `proposal_queue_wait_time_seconds` | Time in queue | P95 > 30s (warning) |

#### LLM Provider

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `llm_request_duration_seconds` | LLM API latency | P95 > 30s (warning) |
| `llm_request_errors_total` | LLM API errors | Error rate > 2% (warning), > 5% (critical) |
| `llm_tokens_used_total` | Token consumption | Daily > 110% of budget (warning) |
| `llm_provider_health` | Provider health check | Unhealthy > 1 min (critical) |

#### Context Assembly

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `context_assembly_duration_seconds` | Context assembly time | P95 > 3s (warning) |
| `context_truncation_total` | Truncation events | Rate > 30% (warning) |
| `context_tokens_total` | Total tokens assembled | N/A (tracking only) |

#### API Performance

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `http_request_duration_seconds` | API latency by endpoint | P95 > 1s (warning), > 3s (critical) |
| `http_requests_total` | Request count | N/A (tracking only) |
| `http_request_errors_total` | 4xx/5xx responses | 5xx rate > 1% (critical) |

### Infrastructure Metrics

#### Database (PostgreSQL)

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `pg_connections_active` | Active connections | > 80% of max (warning) |
| `pg_replication_lag_seconds` | Replica lag | > 30s (warning), > 60s (critical) |
| `pg_deadlocks_total` | Deadlock count | > 0 (warning) |
| `pg_query_duration_seconds` | Slow queries | P95 > 1s (warning) |
| `pg_disk_usage_bytes` | Disk utilization | > 80% (warning), > 90% (critical) |

#### Redis

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `redis_memory_used_bytes` | Memory usage | > 80% of max (warning) |
| `redis_connected_clients` | Client count | > 1000 (warning) |
| `redis_commands_duration_seconds` | Command latency | P95 > 100ms (warning) |
| `redis_evicted_keys_total` | Eviction count | > 0 (warning) |

#### BullMQ

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `bullmq_jobs_waiting` | Waiting jobs | > 100 (warning), > 500 (critical) |
| `bullmq_jobs_active` | Active jobs | > 50 (warning) |
| `bullmq_jobs_failed_total` | Failed jobs | Rate > 5% (warning) |
| `bullmq_jobs_completed_total` | Completed jobs | N/A (tracking only) |

---

## Logging

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `ERROR` | Unexpected failures requiring attention | DB connection failed, LLM API error |
| `WARN` | Potential issues, degraded performance | Context truncated, retry succeeded |
| `INFO` | Key business events | Proposal generated, user signed up |
| `DEBUG` | Detailed debugging (dev only) | Request/response payloads |

### Structured Log Format

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "deeldesk-api",
  "traceId": "abc123",
  "spanId": "def456",
  "message": "Proposal generated successfully",
  "context": {
    "organizationId": "org_123",
    "userId": "user_456",
    "proposalId": "prop_789",
    "durationMs": 45000,
    "tokensUsed": 28500
  }
}
```

### Log Aggregation

**CloudWatch Log Groups:**
```
/deeldesk/api          # API server logs
/deeldesk/worker       # BullMQ worker logs
/deeldesk/database     # PostgreSQL logs
/deeldesk/redis        # Redis logs
```

### Log Retention

| Log Type | Retention |
|----------|-----------|
| Application logs | 30 days |
| Access logs | 90 days |
| Audit logs | 1 year |
| Error logs | 90 days |

---

## Dashboards

### 1. Executive Overview

**Purpose:** High-level system health for leadership

**Panels:**
- System status (green/yellow/red)
- Active users (24h)
- Proposals generated (24h)
- Error rate trend
- Revenue-impacting metrics

### 2. Operations Dashboard

**Purpose:** Day-to-day monitoring for ops team

**Panels:**
- Request rate by endpoint
- Error rate by endpoint
- P50/P95/P99 latency
- Database connections
- Redis memory usage
- Queue depth
- Active jobs

### 3. Proposal Generation Dashboard

**Purpose:** Deep dive into core functionality

**Panels:**
- Generation duration histogram
- Queue wait time
- LLM latency by provider
- Token usage by organization
- Context assembly time
- Truncation rate
- Error breakdown

### 4. Business Metrics Dashboard

**Purpose:** Product and growth metrics

**Panels:**
- Daily active users
- Proposals per user
- Knowledge base growth
- Plan tier distribution
- Feature usage
- Conversion funnel

### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Deeldesk Operations",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{path}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_request_errors_total[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error %"
          }
        ]
      },
      {
        "title": "P95 Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P95"
          }
        ]
      }
    ]
  }
}
```

---

## Alerting Rules

### Critical Alerts (PagerDuty)

Immediate response required (24/7 on-call).

```yaml
groups:
  - name: critical
    rules:
      - alert: ServiceDown
        expr: up{job="deeldesk-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Deeldesk API is down"
          runbook: "https://runbooks.deeldesk.ai/service-down"

      - alert: HighErrorRate
        expr: rate(http_request_errors_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate exceeds 10%"
          runbook: "https://runbooks.deeldesk.ai/high-error-rate"

      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL database is down"
          runbook: "https://runbooks.deeldesk.ai/database-down"

      - alert: ProposalGenerationStuck
        expr: bullmq_jobs_waiting > 500 and rate(bullmq_jobs_completed_total[10m]) == 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Proposal generation queue is stuck"
          runbook: "https://runbooks.deeldesk.ai/queue-stuck"

      - alert: LLMProviderDown
        expr: llm_provider_health == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "LLM provider is unavailable"
          runbook: "https://runbooks.deeldesk.ai/llm-down"
```

### Warning Alerts (Slack)

Requires attention during business hours.

```yaml
groups:
  - name: warnings
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency exceeds 1 second"

      - alert: QueueBacklog
        expr: bullmq_jobs_waiting > 100
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Proposal queue backlog building up"

      - alert: DatabaseConnectionsHigh
        expr: pg_connections_active / pg_connections_max > 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Database connections at 80% capacity"

      - alert: DiskSpaceLow
        expr: pg_disk_usage_bytes / pg_disk_total_bytes > 0.8
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Database disk usage exceeds 80%"

      - alert: ContextTruncationHigh
        expr: rate(context_truncation_total[1h]) / rate(context_assembly_total[1h]) > 0.3
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Context truncation rate exceeds 30%"
```

### Info Alerts (Email)

Non-urgent notifications for tracking.

```yaml
groups:
  - name: info
    rules:
      - alert: DailyUsageReport
        expr: vector(1)
        labels:
          severity: info
        annotations:
          summary: "Daily usage metrics report"

      - alert: NewEnterpriseSignup
        expr: increase(signups_total{tier="enterprise"}[24h]) > 0
        labels:
          severity: info
        annotations:
          summary: "New enterprise customer signed up"
```

---

## Alert Routing

### PagerDuty Integration

```yaml
# alertmanager.yml
receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: ${PAGERDUTY_SERVICE_KEY}
        severity: critical

  - name: 'slack-warnings'
    slack_configs:
      - api_url: ${SLACK_WEBHOOK_URL}
        channel: '#deeldesk-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .Annotations.summary }}'

  - name: 'email-info'
    email_configs:
      - to: 'ops@deeldesk.ai'
        from: 'alerts@deeldesk.ai'

route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack-warnings'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      repeat_interval: 15m
    - match:
        severity: info
      receiver: 'email-info'
      repeat_interval: 24h
```

### On-Call Schedule

| Day | Primary | Secondary |
|-----|---------|-----------|
| Mon-Fri (9-6) | Engineering Lead | Senior Engineer |
| Mon-Fri (6-9) | On-call rotation | Engineering Lead |
| Weekends | On-call rotation | Engineering Lead |

---

## Tracing

### OpenTelemetry Configuration

```typescript
// lib/telemetry.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  serviceName: 'deeldesk-api',
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/metrics'],
      },
    }),
  ],
});

sdk.start();
```

### Key Spans to Trace

```typescript
// Proposal generation trace
const span = tracer.startSpan('proposal.generate');
span.setAttributes({
  'organization.id': organizationId,
  'opportunity.id': opportunityId,
  'llm.provider': provider,
});

// Child spans
const contextSpan = tracer.startSpan('context.assemble', { parent: span });
const llmSpan = tracer.startSpan('llm.generate', { parent: span });
const exportSpan = tracer.startSpan('proposal.export', { parent: span });
```

---

## Health Checks

### Endpoints

```typescript
// app/api/health/route.ts

export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkLLMProvider(),
  ]);

  const status = checks.every(c => c.healthy) ? 'healthy' : 'unhealthy';

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    checks,
  }, {
    status: status === 'healthy' ? 200 : 503,
  });
}

// Kubernetes probes
// GET /api/health/live   - Liveness (is process running?)
// GET /api/health/ready  - Readiness (can accept traffic?)
```

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "checks": [
    {
      "name": "database",
      "healthy": true,
      "latencyMs": 5
    },
    {
      "name": "redis",
      "healthy": true,
      "latencyMs": 2
    },
    {
      "name": "llm_provider",
      "healthy": true,
      "latencyMs": 150
    }
  ]
}
```

---

## Incident Response

### Severity Levels

| Level | Criteria | Response Time | Examples |
|-------|----------|---------------|----------|
| SEV1 | Complete outage | 15 minutes | Service down, data breach |
| SEV2 | Major feature broken | 1 hour | Proposal generation failing |
| SEV3 | Degraded performance | 4 hours | Slow responses, elevated errors |
| SEV4 | Minor issue | 24 hours | UI bug, non-critical feature |

### Incident Workflow

1. **Detection** — Alert fires or user reports
2. **Triage** — Assess severity, assign owner
3. **Investigation** — Use dashboards, logs, traces
4. **Mitigation** — Apply quick fix or rollback
5. **Resolution** — Deploy permanent fix
6. **Post-mortem** — Document and learn (SEV1/SEV2)

### Communication Templates

**Status Page Update:**
```
[Investigating] We are investigating reports of slow proposal generation.

[Identified] The issue has been identified as high load on our LLM provider.

[Monitoring] A fix has been deployed and we are monitoring the situation.

[Resolved] The issue has been resolved. Proposal generation is operating normally.
```

---

## References

- [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md) — Backup procedures
- [RATE_LIMITING.md](./RATE_LIMITING.md) — Rate limit configuration
- [LLM_PROVIDER_ARCHITECTURE.md](../architecture/LLM_PROVIDER_ARCHITECTURE.md) — Provider failover
