# PRD Addendum: LLM Data Privacy Architecture

**Document Version:** 4.0.1  
**Addendum Date:** December 2025  
**Status:** APPROVED  
**Applies to:** Deeldesk PRD v4.0

---

## Purpose

This addendum elevates the LLM Data Privacy Architecture from a Phase 3 consideration to a **P0 (Core) MVP requirement**. The change is driven by the critical insight that enterprise data privacy concerns represent a potential adoption blocker for our highest-value user segment.

---

## Change Summary

| Section | Previous | Updated |
|---------|----------|---------|
| LLM Integration (Section 16) | Single provider (Anthropic API) | Multi-provider abstraction layer |
| Phase 0 Spikes | 3 spikes (Rendering, Context, PLG) | 4 spikes (+ LLM Data Privacy) |
| MVP Scope | Anthropic API only | Anthropic API + AWS Bedrock option |
| Plan Tier Features | BYOL in Phase 3 | Bedrock in Team/Enterprise from MVP |

---

## Updated Requirements

### 16. Integration Requirements (UPDATED)

#### 16.1 LLM Provider Architecture

**NEW P0 Requirement:** The system must implement a provider abstraction layer that enables multiple LLM backends without application code changes.

| Req ID | Requirement | Priority | Phase |
|--------|-------------|----------|-------|
| FR-LLM-001 | System implements LLMProvider interface for all LLM interactions | P0 | MVP |
| FR-LLM-002 | System supports Anthropic Direct API as default provider | P0 | MVP |
| FR-LLM-003 | System supports AWS Bedrock as alternative provider | P0 | MVP |
| FR-LLM-004 | Organization settings control provider selection | P0 | MVP |
| FR-LLM-005 | Provider selection respects plan tier eligibility | P0 | MVP |
| FR-LLM-006 | System implements graceful fallback when primary provider unavailable | P1 | MVP |
| FR-LLM-007 | System supports Google Vertex AI | P2 | Phase 3 |
| FR-LLM-008 | System supports BYOL (customer-provided endpoint) | P2 | Phase 3 |

#### 16.2 Provider Eligibility by Plan Tier

| Plan Tier | Anthropic Direct | AWS Bedrock | Vertex AI | BYOL |
|-----------|-----------------|-------------|-----------|------|
| Free | ✓ (default) | ✗ | ✗ | ✗ |
| Pro | ✓ (default) | ✗ | ✗ | ✗ |
| Team | ✓ | ✓ | ✗ | ✗ |
| Enterprise | ✓ | ✓ | ✓ | ✓ |

#### 16.3 Data Sovereignty Guarantee

For organizations using AWS Bedrock:

- All LLM requests are processed within the customer's specified AWS region
- No data is transmitted to Anthropic's servers
- Customer retains full control over data retention policies
- Compliant with HIPAA, SOC 2, and FedRAMP requirements (when deployed in compliant AWS regions)

#### 16.4 Embedding Provider Strategy

| LLM Provider | Default Embedding Provider | Rationale |
|--------------|---------------------------|-----------|
| Anthropic Direct | OpenAI text-embedding-3-small | Best quality, Anthropic lacks embedding API |
| AWS Bedrock | Amazon Titan Embeddings | Full data sovereignty within AWS |
| Vertex AI | Vertex AI Embeddings | Full data sovereignty within GCP |

---

## Updated Phase 0 Scope

### Spike 4: LLM Data Privacy Architecture (NEW)

**Duration:** 3 days  
**Objective:** Validate multi-provider architecture feasibility and performance

#### Acceptance Criteria

| Test | Green | Yellow | Red |
|------|-------|--------|-----|
| Bedrock feature parity | Full streaming + completion support | Minor gaps with workarounds | Major functionality broken |
| Latency overhead | <15% vs. Anthropic Direct | 15-25% overhead | >25% overhead |
| Streaming performance | Smooth, <2s time-to-first-token | Minor stuttering, <3s TTFT | Broken or >5s TTFT |
| Error handling | Graceful fallback works | Manual intervention needed | Cascading failures |

#### Go/No-Go Impact

- **All Green:** Ship MVP with both providers
- **1-2 Yellow:** Ship MVP with Anthropic default, fast-follow Bedrock in Sprint 3
- **Any Red:** Investigate root cause, evaluate Vertex AI as alternative

---

## Updated MVP Feature Priority

### P0 (Core - Must Ship) - ADDITIONS

| Feature | Description | Dependency |
|---------|-------------|------------|
| LLMProvider interface | Abstraction layer for multi-provider support | None |
| AnthropicDirectProvider | Default provider implementation | LLMProvider interface |
| BedrockProvider | Enterprise provider implementation | LLMProvider interface |
| Provider selection in org settings | Admin UI for provider configuration | Organization entity |

### Updated Sprint 2 Scope

Sprint 2 (Core Generation) now includes:

- T2-003: Implement LLMProvider interface and factory (5 points)
- T2-004: Implement AnthropicDirectProvider (5 points)
- T2-005: Implement BedrockProvider with streaming (8 points)
- T2-011: Add LLM provider selection to org settings (3 points)

---

## Updated Data Model

### Organization Settings Schema Addition

```typescript
interface OrganizationSettings {
  // ... existing fields ...
  
  // LLM Provider Configuration (NEW)
  llmProvider: 'anthropic_direct' | 'bedrock' | 'vertex';
  
  bedrockConfig?: {
    region: string;
    useIAMRole: boolean;
  };
  
  vertexConfig?: {
    projectId: string;
    region: string;
  };
  
  embeddingProvider: 'openai' | 'bedrock_titan' | 'vertex';
  
  // Fallback behavior
  allowProviderFallback: boolean;  // Default: true for non-enterprise
}
```

### Database Schema Addition

```sql
-- Add to organizations table or settings JSONB
-- Provider credentials stored in secure secrets manager, NOT in database

-- Audit log for provider usage (for billing and compliance)
CREATE TABLE llm_provider_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  provider VARCHAR(50) NOT NULL,
  request_type VARCHAR(50) NOT NULL,  -- 'completion', 'streaming', 'embedding'
  model VARCHAR(100) NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_code VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_usage_org ON llm_provider_usage(organization_id, created_at);
```

---

## Updated Pricing Implications

### Option A: Data Sovereignty as Plan Feature

| Plan | Price | Providers |
|------|-------|-----------|
| Free | $0/mo | Anthropic Direct only |
| Pro | $29/mo | Anthropic Direct only |
| Team | $79/user/mo | + AWS Bedrock option |
| Enterprise | Custom | + Vertex AI + BYOL |

### Option B: Data Sovereignty Add-on (Alternative)

| Plan | Base Price | + Data Sovereignty |
|------|------------|-------------------|
| Pro | $29/mo | +$20/mo = $49/mo |
| Team | $79/user/mo | Included |
| Enterprise | Custom | Included |

**Recommendation:** Option A (feature of higher tiers) aligns better with enterprise sales motion and avoids pricing complexity.

---

## Updated Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Provider parity | 100% feature coverage | Automated integration tests |
| Bedrock latency overhead | <15% vs. direct | P95 latency monitoring |
| Provider failover time | <5 seconds | Synthetic monitoring |
| Embedding quality parity | >95% similarity | A/B testing with golden dataset |

### Business Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Enterprise trial conversion | >10% | Data sovereignty removes blocker |
| Security review pass rate | >80% | Bedrock addresses common concerns |
| Time to security approval | <2 weeks | vs. industry avg 6-8 weeks |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Bedrock latency exceeds threshold | Medium | Medium | Performance testing in Spike 4; fallback option |
| Provider abstraction adds complexity | Medium | Low | Clean interface design; comprehensive testing |
| Customer confusion about options | Low | Medium | Clear documentation; sales enablement |
| Bedrock regional availability gaps | Low | High | Document supported regions; multi-region deployment |

---

## Implementation Notes

### For Claude Code

When implementing the LLM provider layer:

1. **Read first:** `LLM_PROVIDER_ARCHITECTURE.md` for complete design
2. **Never** instantiate providers directly in application code
3. **Always** use `getProviderForOrganization()` factory
4. **Log** all provider selections and performance metrics
5. **Test** both providers in integration tests

### File Structure

```
lib/ai/
├── types.ts                 # LLMProvider interface, types
├── provider-factory.ts      # Factory function
├── providers/
│   ├── anthropic-direct.ts  # AnthropicDirectProvider
│   ├── bedrock.ts           # BedrockProvider
│   └── vertex.ts            # VertexProvider (Phase 3)
├── embeddings.ts            # Embedding generation
├── credentials.ts           # Secure credential retrieval
└── metrics.ts               # Provider metrics tracking
```

---

## Approval

This addendum has been reviewed and approved by:

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Engineering Lead | | | |
| Security Lead | | | |

---

*This addendum supersedes any conflicting information in PRD v4.0 regarding LLM integration and data privacy architecture.*
