# Business Model Summary Feature Specification

> **Note:** This document describes the full feature vision. For the MVP implementation plan using `organizations.settings` JSONB storage, see [Business Model Summary Implementation Plan](../planning/BUSINESS_MODEL_SUMMARY_IMPLEMENTATION.md).

## Overview

The Business Model Summary is an AI-generated company profile created during user signup that serves as foundational context for proposal generation. By automatically researching and synthesizing publicly available information about the user's company, Deeldesk demonstrates immediate value while reducing onboarding friction.

This feature addresses the cold start problem by bootstrapping the user's business context—transforming a blank slate into an intelligent starting point that users refine rather than create from scratch.

**MVP Implementation:** The initial implementation stores the business model summary in `organizations.settings.business_model` JSONB field and provides on-demand generation via the Knowledge Base section (`/knowledge/company-profile`). Future enhancements may include versioning, structured sections, and staleness detection as described in this specification.

## Strategic Value

**For Users:**
- Immediate "we get you" experience at signup
- Edit-to-refine is cognitively easier than create-from-scratch
- Ensures consistent, structured business context across all proposals

**For Proposal Generation:**
- Provides persistent company-level context for the Context Assembly Engine
- Enables intelligent defaults for positioning, differentiation, and targeting
- Reduces repetitive input across deals

## Context Assembly Integration

The Business Model Summary sits at the foundation of the Context Assembly Engine hierarchy:

```
Context Assembly Layers (bottom to top):
─────────────────────────────────────────
4. Conversation Context    (current session)
3. Deal-Specific Context   (customer, requirements, history)
2. Knowledge Base Entries  (curated, topic-specific)
1. Business Model Summary  (persistent, company-level) ← THIS FEATURE
```

All proposal generation draws from this foundational layer, ensuring company positioning, value proposition, and differentiation are consistently represented.

## Data Model

### BusinessModelSummary Entity

```
BusinessModelSummary
├── id: uuid (primary key)
├── organization_id: uuid (foreign key)
├── version: integer (incrementing)
├── generation_source: enum [ai_generated, user_created, hybrid]
│
├── content: jsonb
│   ├── company_overview
│   │   ├── description: text
│   │   ├── founding_year: integer (nullable)
│   │   ├── company_stage: enum [startup, growth, enterprise]
│   │   ├── employee_range: enum [1-10, 11-50, 51-200, 201-1000, 1000+]
│   │   └── headquarters: text (nullable)
│   │
│   ├── value_proposition
│   │   ├── core_statement: text
│   │   ├── key_benefits: text[]
│   │   └── positioning_statement: text (nullable)
│   │
│   ├── target_customers
│   │   ├── icp_description: text
│   │   ├── verticals: text[]
│   │   ├── company_sizes: enum[]
│   │   ├── buyer_personas: text[]
│   │   └── geographic_focus: text[] (nullable)
│   │
│   ├── revenue_model
│   │   ├── pricing_approach: enum [subscription, usage, hybrid, one-time, custom]
│   │   ├── typical_deal_size: text (nullable)
│   │   ├── sales_motion: enum [plg, sales-led, hybrid]
│   │   └── contract_terms: text (nullable)
│   │
│   ├── competitive_landscape
│   │   ├── primary_competitors: text[]
│   │   ├── competitive_category: text
│   │   └── market_position: text (nullable)
│   │
│   ├── key_differentiators: text[]
│   │
│   └── solution_components: jsonb[]
│       ├── name: text
│       ├── description: text
│       └── category: text (nullable)
│
├── confidence_metadata: jsonb
│   ├── overall_confidence: enum [high, medium, low]
│   ├── sources_used: text[] (URLs or "user_input")
│   ├── sections_needing_review: text[] (field paths)
│   └── ai_model_version: text
│
├── timestamps
│   ├── created_at: timestamp
│   ├── updated_at: timestamp
│   ├── last_ai_generated_at: timestamp (nullable)
│   ├── last_user_edited_at: timestamp (nullable)
│   └── user_verified_at: timestamp (nullable)
│
└── status
    ├── is_verified: boolean (default: false)
    ├── is_stale: boolean (computed)
    └── staleness_reason: text (nullable)
```

### Version History Table

```
BusinessModelSummaryVersion
├── id: uuid
├── business_model_summary_id: uuid (foreign key)
├── version: integer
├── content_snapshot: jsonb (full content at time of save)
├── changed_by: uuid (user_id)
├── change_type: enum [ai_generation, user_edit, regeneration]
├── change_summary: text (nullable)
└── created_at: timestamp
```

## User Experience Flow

### Signup Flow (Semi-Blocking)

```
[Signup Form Submitted]
         │
         ▼
[Generation Screen]
"Researching your company..."
    │
    ├── Success (< 10 seconds)
    │         │
    │         ▼
    │   [Review & Edit Screen]
    │
    ├── Success (> 10 seconds)
    │         │
    │         ▼
    │   [Proceed to Dashboard]
    │   "Profile generating..."
    │   (resolves async, notification when ready)
    │
    └── Failure / Low Signal
              │
              ▼
        [Manual Input Form]
        "Tell us about your company"
```

### UX State Machine

```
                              ┌─────────────────┐
                              │    Generating   │
                              └────────┬────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │  Review & Edit  │    │  Async Pending  │    │  Manual Input   │
    │  (high/medium   │    │  (user proceeds │    │  (fallback)     │
    │   confidence)   │    │   to dashboard) │    │                 │
    └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
             │                      │                      │
             └──────────────────────┼──────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │    Verified     │
                          │   (user saved)  │
                          └────────┬────────┘
                                   │
                            (time passes)
                                   │
                                   ▼
                          ┌─────────────────┐
                          │     Stale       │
                          └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
        [Regenerate]        [Edit Manually]       [Dismiss]
```

### Review & Edit Interface

Section-by-section editing with confidence indicators:

```
┌──────────────────────────────────────────────────────────────┐
│  Your Business Profile                          [Regenerate] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ Company Overview                    [Edit] [Verified ✓]   │
│    "Acme Corp is a B2B SaaS platform founded in 2019..."    │
│    Sources: acme.com, crunchbase.com, linkedin.com          │
│                                                              │
│  ⚠ Value Proposition                   [Edit] [Needs Review] │
│    "Enterprise-grade analytics for modern data teams..."     │
│    Low confidence — limited sources found                    │
│                                                              │
│  ✓ Target Customers                    [Edit] [Verified ✓]   │
│    ICP: Mid-market finance teams (200-2000 employees)       │
│    Verticals: Financial Services, Healthcare, Manufacturing │
│                                                              │
│  ✓ Revenue Model                       [Edit] [Verified ✓]   │
│    Pricing: Subscription (hybrid usage)                      │
│    Sales Motion: Product-led growth                          │
│                                                              │
│  ○ Competitive Landscape               [Edit] [Add Details]  │
│    No information found — click to add                       │
│                                                              │
│  ✓ Key Differentiators                 [Edit] [Verified ✓]   │
│    • Real-time processing (sub-second latency)              │
│    • No-code integration builder                             │
│    • SOC 2 Type II certified                                 │
│                                                              │
│  ✓ Solution Components                 [Edit] [Verified ✓]   │
│    • Analytics Dashboard (Core Product)                      │
│    • Integration Hub (Add-on)                                │
│    • API Access (Developer Tier)                             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                              [Save & Continue to Dashboard]  │
└──────────────────────────────────────────────────────────────┘
```

## Staleness Detection

### Triggers for Stale Status

| Trigger | Condition | Staleness Reason |
|---------|-----------|------------------|
| Time-based | `last_user_edited_at` > 90 days | "Profile not updated in 90+ days" |
| Knowledge Base signal | New KB entries suggest company pivot | "Recent knowledge base updates may affect profile" |
| User-triggered | Manual "mark as needs update" | User-specified reason |
| (Future) Web monitoring | Significant company news detected | "Recent company news detected" |

### Staleness Configuration

```
staleness_config:
  time_threshold_days: 90  # configurable per organization
  kb_signal_enabled: true
  web_monitoring_enabled: false  # future feature flag
```

## AI Generation Specifications

### Input Sources for Research

1. **Company website** (primary) — derived from signup email domain
2. **LinkedIn company page**
3. **Crunchbase profile**
4. **G2/Capterra listings** (for SaaS companies)
5. **Press releases / news**

### Generation Prompt Strategy

The AI generation should:
- Prioritize accuracy over completeness
- Flag low-confidence sections explicitly
- Cite sources for each section
- Avoid hallucinating details not found in sources
- Default to "No information found" rather than guessing

### Confidence Scoring

| Confidence Level | Criteria |
|------------------|----------|
| **High** | 2+ corroborating sources, recent information (< 1 year) |
| **Medium** | 1 source, or information may be dated |
| **Low** | Inferred from limited context, requires user verification |

## Relationship to Knowledge Base

The Business Model Summary and Knowledge Base serve complementary purposes:

| Business Model Summary | Knowledge Base |
|------------------------|----------------|
| Company-level context | Topic-specific content |
| Auto-generated at signup | User-curated over time |
| Structured schema | Flexible document types |
| Single authoritative version | Multiple entries per topic |
| "Who we are" | "What we know" |

**Battle Cards Note:** Competitive objections and responses are intentionally excluded from the Business Model Summary. These belong in the Knowledge Base as battle cards, which provide richer, deal-specific competitive intelligence.

## API Endpoints

```
POST   /api/v1/business-model-summary/generate
       Triggers AI generation for current organization

GET    /api/v1/business-model-summary
       Returns current version

PUT    /api/v1/business-model-summary
       Updates content (creates new version)

POST   /api/v1/business-model-summary/verify
       Marks current version as user-verified

GET    /api/v1/business-model-summary/versions
       Returns version history

GET    /api/v1/business-model-summary/versions/:version
       Returns specific version
```

## Implementation Considerations

### MVP Scope

**In Scope:**
- AI generation from company website + LinkedIn
- Section-by-section editing UI
- Version history (basic)
- Time-based staleness detection
- Source attribution display

**Post-MVP:**
- Additional data sources (Crunchbase, G2)
- Web monitoring for staleness triggers
- Knowledge Base signal detection
- Bulk import for enterprise onboarding

### Performance Requirements

| Operation | Target |
|-----------|--------|
| AI generation | < 15 seconds (P95) |
| Save/update | < 500ms |
| Load current version | < 200ms |

### Privacy & Data Handling

- AI research uses only publicly available information
- Users can opt for manual-only input at signup
- Generated content is organization-owned, not shared
- Sources are logged for transparency and audit

## Success Metrics

| Metric | Target |
|--------|--------|
| Generation success rate | > 85% (medium+ confidence) |
| User edit rate | 60-80% (indicates engagement without full rejection) |
| Verification rate | > 70% within first session |
| Staleness acknowledgment | > 50% take action on stale banner |
| Time to first proposal | Reduced by 40% vs. manual onboarding |

## Open Questions for Implementation

1. **Email domain edge cases** — How to handle users with gmail.com/outlook.com emails? Prompt for company website URL?

2. **Multi-product companies** — Should solution_components support hierarchical product structures?

3. **Internationalization** — Should generation support non-English company websites?

4. **Rate limiting** — How to handle regeneration abuse? Daily limit per organization?
