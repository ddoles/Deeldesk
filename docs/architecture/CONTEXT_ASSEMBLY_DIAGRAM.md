# Context Assembly Engine - Visual Diagram

## Overview

This diagram illustrates how proposal context is assembled from various data sources, processed through the Context Assembly Engine, and budgeted for LLM consumption.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CONTEXT ASSEMBLY ENGINE                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   INPUT SOURCES                                          │
├───────────────────┬───────────────────┬───────────────────┬─────────────────────────────┤
│   DATABASE        │   DATABASE        │   DATABASE        │   USER INPUT                │
│   (Foundational)  │   (Deal-Specific) │   (RAG/Vector)    │                             │
├───────────────────┼───────────────────┼───────────────────┼─────────────────────────────┤
│ • organizations   │ • opportunities   │ • products        │ • User Prompt               │
│ • company_profiles│ • deal_context_   │   (embeddings)    │   (generation request)      │
│ • brand_settings  │   items           │ • battlecards     │                             │
│                   │                   │   (embeddings)    │                             │
│                   │                   │ • playbooks       │                             │
│                   │                   │   (embeddings)    │                             │
└───────────────────┴───────────────────┴───────────────────┴─────────────────────────────┘
```

---

## Data Flow Diagram

```
                                    ┌──────────────────────┐
                                    │     User Prompt      │
                                    │  "Create proposal    │
                                    │   for Acme Corp..."  │
                                    └──────────┬───────────┘
                                               │
                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     STEP 1: FETCH FOUNDATIONAL                             │
│                                        (Always Included)                                   │
└────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
         ┌─────────────────────────────────────┼─────────────────────────────────────┐
         │                                     │                                     │
         ▼                                     ▼                                     ▼
┌─────────────────────┐           ┌─────────────────────┐           ┌─────────────────────┐
│   organizations     │           │   company_profiles  │           │   brand_settings    │
│   ─────────────     │           │   ────────────────  │           │   ──────────────    │
│   • name            │           │   • summary         │           │   • tone            │
│   • settings        │           │   • companyOverview │           │   • formality       │
│                     │           │   • valueProposition│           │   • keyMessages     │
│                     │           │   • targetCustomers │           │   • contentStyle    │
│                     │           │   • revenueModel    │           │   • competitive     │
│                     │           │   • industry        │           │     Positioning     │
│                     │           │   • keyDifferent... │           │                     │
└─────────────────────┘           └─────────────────────┘           └─────────────────────┘
         │                                     │                                     │
         └─────────────────────────────────────┼─────────────────────────────────────┘
                                               │
                                               ▼
                              ┌───────────────────────────────────┐
                              │  FOUNDATIONAL CONTEXT             │
                              │  ≈1,000 tokens (never truncated)  │
                              └───────────────────────────────────┘
                                               │
                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  STEP 2: FETCH DEAL CONTEXT                                │
│                                      (Opportunity-Specific)                                │
└────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
         ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
         │   opportunities  │       │ deal_context_    │       │   Deal Summary   │
         │   ────────────── │       │ items            │       │   (JSON field)   │
         │   • name         │       │ ──────────────── │       │   ────────────── │
         │   • description  │       │ • sourceType     │       │   • Extracted    │
         │   • dealSummary  │       │ • rawContent     │       │     signals      │
         │                  │       │ • sourceMetadata │       │   • Structured   │
         │                  │       │                  │       │     data         │
         └──────────────────┘       └──────────────────┘       └──────────────────┘
                    │                          │                          │
                    └──────────────────────────┼──────────────────────────┘
                                               │
                                               ▼
                              ┌───────────────────────────────────┐
                              │  DEAL CONTEXT                     │
                              │  40% of RAG budget                │
                              │  Priority: 1 (last to truncate)   │
                              └───────────────────────────────────┘
                                               │
                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                               STEP 3: GENERATE QUERY EMBEDDING                             │
└────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
                     ┌─────────────────────────┼─────────────────────────┐
                     │                         │                         │
                     ▼                         ▼                         ▼
          ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
          │   User Prompt    │      │   OpenAI API     │      │  Query Embedding │
          │  ──────────────  │─────▶│  ────────────    │─────▶│  ───────────────│
          │  "Create a       │      │  text-embedding- │      │  [0.021, -0.15, │
          │   proposal..."   │      │  3-small         │      │   0.833, ...]   │
          └──────────────────┘      │  1536 dimensions │      │  1536 floats    │
                                    └──────────────────┘      └──────────────────┘
                                                                       │
                                                                       ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                              STEP 4: RAG RETRIEVAL (PARALLEL)                              │
│                           Vector Similarity Search with pgvector                           │
└────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
          ┌────────────────────────────────────┼────────────────────────────────────┐
          │                                    │                                    │
          ▼                                    ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐          ┌──────────────────────┐
│      PRODUCTS        │          │     BATTLECARDS      │          │     PLAYBOOKS        │
│   ─────────────────  │          │   ─────────────────  │          │   ─────────────────  │
│   Vector Search:     │          │   Vector Search:     │          │   Vector Search:     │
│   embedding <=>      │          │   embedding <=>      │          │   embedding <=>      │
│   query_embedding    │          │   query_embedding    │          │   query_embedding    │
│                      │          │   + Competitor       │          │   + Vertical/Segment │
│   • max 5 results    │          │     mention detect   │          │     filtering        │
│   • min similarity   │          │                      │          │                      │
│     0.4              │          │   • max 3 results    │          │   • max 5 results    │
│                      │          │   • min similarity   │          │   • min similarity   │
│   Returns:           │          │     0.4              │          │     0.4              │
│   • name             │          │                      │          │                      │
│   • description      │          │   Returns:           │          │   Returns:           │
│   • category         │          │   • competitorName   │          │   • title            │
│   • relevanceScore   │          │   • strengths        │          │   • content          │
│                      │          │   • weaknesses       │          │   • tags             │
│                      │          │   • keyDifferent...  │          │   • relevanceScore   │
│   Budget: 30%        │          │   • relevanceScore   │          │                      │
│   Priority: 2        │          │                      │          │   Budget: 10%        │
└──────────────────────┘          │   Budget: 20%        │          │   Priority: 4 (first │
          │                       │   Priority: 3        │          │   to truncate)       │
          │                       └──────────────────────┘          └──────────────────────┘
          │                                    │                                    │
          └────────────────────────────────────┼────────────────────────────────────┘
                                               │
                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                              STEP 5: ASSEMBLE & BUILD PROMPT                               │
└────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────┐
                        │        AssembledContext Object           │
                        │   ─────────────────────────────────────  │
                        │   {                                      │
                        │     organizationName,                    │
                        │     brandContext,                        │
                        │     companyProfile,                      │
                        │     opportunityName,                     │
                        │     opportunityDescription,              │
                        │     dealSummary,                         │
                        │     dealContext[],                       │
                        │     products[],                          │
                        │     battlecards[],                       │
                        │     userPrompt,                          │
                        │     tokenEstimate,                       │
                        │     truncated,                           │
                        │     truncationWarnings[]                 │
                        │   }                                      │
                        └──────────────────────────────────────────┘
                                               │
                                               ▼
                          ┌────────────────────────────────────┐
                          │        buildSystemPrompt()         │
                          │   ────────────────────────────     │
                          │   Formats assembled context into   │
                          │   structured system prompt         │
                          │                                    │
                          │   Sections:                        │
                          │   • ABOUT YOUR COMPANY             │
                          │   • BRAND GUIDELINES               │
                          │   • OPPORTUNITY                    │
                          │   • DEAL CONTEXT                   │
                          │   • DEAL SUMMARY                   │
                          │   • RELEVANT PRODUCTS              │
                          │   • COMPETITIVE INTELLIGENCE       │
                          │   • OUTPUT FORMAT                  │
                          │   • GUIDELINES                     │
                          │   • PRICING RULES                  │
                          └────────────────────────────────────┘
                                               │
                                               ▼
                         ┌─────────────────────────────────────┐
                         │           LLM PROVIDER              │
                         │  (Anthropic Direct / AWS Bedrock)   │
                         │         Claude 3.5 Sonnet           │
                         └─────────────────────────────────────┘
```

---

## Token Budget Allocation

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  TOKEN BUDGET: 32,000 TOKENS                                │
│                                    (Practical Target Limit)                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┬────────────────────────────────────────────┐
│           FOUNDATIONAL (Fixed)                 │               RAG-RETRIEVED                │
│           Never Truncated                      │           Percentage-Based Budgets         │
│           ~2,000 tokens reserved               │           ~29,000 tokens available         │
├────────────────────────────────────────────────┼────────────────────────────────────────────┤
│                                                │                                            │
│  ┌──────────────────────────────────────────┐  │  ┌──────────────────────────────────────┐  │
│  │  System Prompt           ~1,000 tokens   │  │  │  Deal Context           ~11,600 tok  │  │
│  │  ─────────────────────────────────────── │  │  │  ───────────────────────────────────  │  │
│  │  • Base instructions                     │  │  │  • Pasted emails, notes              │  │
│  │  • Output format                         │  │  │  • Meeting summaries                 │  │
│  │  • Guidelines                            │  │  │  • Customer requirements             │  │
│  │  • Pricing rules                         │  │  │                                      │  │
│  └──────────────────────────────────────────┘  │  │  Budget: 40% │ Priority: 1 (last)    │  │
│                                                │  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │                                            │
│  │  Company Profile            ~800 tokens  │  │  ┌──────────────────────────────────────┐  │
│  │  ─────────────────────────────────────── │  │  │  Products                ~8,700 tok  │  │
│  │  • Summary                               │  │  │  ───────────────────────────────────  │  │
│  │  • Company overview                      │  │  │  • Names, descriptions               │  │
│  │  • Value proposition                     │  │  │  • Features, benefits                │  │
│  │  • Target customers                      │  │  │  • Pricing info (if codified)        │  │
│  │  • Revenue model                         │  │  │                                      │  │
│  │  • Industry & market segment             │  │  │  Budget: 30% │ Priority: 2           │  │
│  │  • Key differentiators                   │  │  └──────────────────────────────────────┘  │
│  └──────────────────────────────────────────┘  │                                            │
│                                                │  ┌──────────────────────────────────────┐  │
│  ┌──────────────────────────────────────────┐  │  │  Competitive/Battlecards ~5,800 tok  │  │
│  │  Brand Context              ~200 tokens  │  │  │  ───────────────────────────────────  │  │
│  │  ─────────────────────────────────────── │  │  │  • Competitor strengths/weaknesses   │  │
│  │  • Tone (professional/friendly/...)      │  │  │  • Win themes                        │  │
│  │  • Formality                             │  │  │  • Differentiators                   │  │
│  │  • Key messages                          │  │  │                                      │  │
│  │  • Content style                         │  │  │  Budget: 20% │ Priority: 3           │  │
│  │  • Competitive positioning               │  │  └──────────────────────────────────────┘  │
│  └──────────────────────────────────────────┘  │                                            │
│                                                │  ┌──────────────────────────────────────┐  │
│                                                │  │  Playbooks               ~2,900 tok  │  │
│                                                │  │  ───────────────────────────────────  │  │
│                                                │  │  • Sales playbooks                   │  │
│                                                │  │  • Objection handling                │  │
│                                                │  │  • Discovery questions               │  │
│                                                │  │                                      │  │
│                                                │  │  Budget: 10% │ Priority: 4 (first)   │  │
│                                                │  └──────────────────────────────────────┘  │
└────────────────────────────────────────────────┴────────────────────────────────────────────┘

Safety Buffer: ~1,300 tokens reserved for variance
```

---

## Truncation Priority Stack

When context exceeds budget, truncation occurs in this order (top = first to truncate):

```
                           FIRST TO TRUNCATE
                                  │
                                  ▼
                    ┌───────────────────────────┐
            4      │        PLAYBOOKS          │  10% budget
                   │   Supplementary guidance   │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
            3      │       COMPETITIVE         │  20% budget
                   │   Can be summarized        │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
            2      │        PRODUCTS           │  30% budget
                   │   Reduce detail level      │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
            1      │      DEAL CONTEXT         │  40% budget
                   │   Most deal-relevant       │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
     ════════════════════════════════════════════════════════
                           NEVER TRUNCATED
     ════════════════════════════════════════════════════════
                                  │
                                  ▼
                    ┌───────────────────────────┐
            ∞      │      BRAND CONTEXT        │  ~200 tokens
                   │   Always preserved         │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
            ∞      │    COMPANY PROFILE        │  ~800 tokens
                   │   Foundational context     │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
            ∞      │     SYSTEM PROMPT         │  ~1,000 tokens
                   │   Core instructions        │
                    └───────────────────────────┘
                                  │
                                  ▼
                          LAST TO TRUNCATE
```

---

## Context Layer Stack Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    ╔═══════════════════════════════════════════════════════════════════╗   │
│    ║ Layer 6: Historical Patterns                   [PHASE 2 - Future] ║   │
│    ║ • Winning strategies from similar deals                           ║   │
│    ╚═══════════════════════════════════════════════════════════════════╝   │
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐   │
│    │ Layer 5: Playbooks                              10% │ Priority 4 │   │
│    │ • Sales playbooks per vertical                                    │   │
│    │ • Objection handling scripts                                      │   │
│    │ • Discovery questions                                             │   │
│    └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐   │
│    │ Layer 4: Competitive/Battlecards                20% │ Priority 3 │   │
│    │ • Competitor strengths & weaknesses                               │   │
│    │ • Win themes & differentiators                                    │   │
│    │ • Objection handling                                              │   │
│    └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐   │
│    │ Layer 3: Products                               30% │ Priority 2 │   │
│    │ • Product names & descriptions                                    │   │
│    │ • Features & benefits                                             │   │
│    │ • Pricing (if codified)                                           │   │
│    └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐   │
│    │ Layer 2: Deal Context                           40% │ Priority 1 │   │
│    │ • Pasted emails, call notes                                       │   │
│    │ • Meeting summaries                                               │   │
│    │ • Customer requirements & pain points                             │   │
│    │ • Budget signals                                                  │   │
│    └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│    ╔═══════════════════════════════════════════════════════════════════╗   │
│    ║ Layer 1b: Brand Context                    ~200 tokens (FIXED)    ║   │
│    ║ • Tone & formality                                                ║   │
│    ║ • Key messages                                                    ║   │
│    ║ • Content style & competitive positioning                         ║   │
│    ╠═══════════════════════════════════════════════════════════════════╣   │
│    ║ Layer 1a: Company Profile                  ~800 tokens (FIXED)    ║   │
│    ║ • Summary & overview                                              ║   │
│    ║ • Value proposition                                               ║   │
│    ║ • Target customers                                                ║   │
│    ║ • Key differentiators                                             ║   │
│    ╚═══════════════════════════════════════════════════════════════════╝   │
│    ═════════════════════════════════════════════════════════════════════   │
│                         F O U N D A T I O N A L                            │
│                          (Never Truncated)                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Tables Reference

| Table | Purpose | Retrieval Method | Budget |
|-------|---------|------------------|--------|
| `organizations` | Company name, settings | Direct lookup | N/A |
| `company_profiles` | Business model summary | Direct lookup | ~800 (fixed) |
| `brand_settings` | Tone, voice, style | Direct lookup | ~200 (fixed) |
| `opportunities` | Deal name, description | Direct lookup | N/A |
| `deal_context_items` | Emails, notes, docs | Direct lookup (limit 10) | 40% |
| `products` | Product catalog | Vector similarity (RAG) | 30% |
| `battlecards` | Competitive intel | Vector similarity + mention detect | 20% |
| `playbooks` | Sales playbooks | Vector similarity (RAG) | 10% |

---

## RAG Settings

| Setting | Value | Notes |
|---------|-------|-------|
| Max Products | 5 | Top 5 most relevant products |
| Max Battlecards | 3 | Top 3 most relevant competitors |
| Min Similarity | 0.4 | Threshold for relevance |
| Embedding Model | text-embedding-3-small | OpenAI, 1536 dimensions |
| Vector Store | pgvector | PostgreSQL extension |

---

## Performance Targets

| Operation | Target P95 |
|-----------|------------|
| Total context assembly | <2 seconds |
| Embedding generation | <500ms |
| Vector search (per table) | <200ms |
| Token counting | <50ms |

---

## References

- [Context Assembly Architecture](./CONTEXT_ASSEMBLY.md) - Full specification
- [LLM Provider Architecture](./LLM_PROVIDER_ARCHITECTURE.md) - Provider abstraction
- [CLAUDE.md](../../CLAUDE.md) - Project context
