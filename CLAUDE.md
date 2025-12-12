# CLAUDE.md - Deeldesk.ai Project Context

> This file provides context for Claude Code when working on the Deeldesk.ai codebase.

## Project Overview

**Deeldesk.ai** is an AI-powered proposal generation platform—"the first system of record for sales strategy." It enables sales professionals to create professional proposals in minutes while automatically capturing the positioning, pricing, and solutioning (PPS) decisions that determine deal outcomes.

### Core Value Proposition

- **10x Faster Proposals**: Generate professional, brand-compliant proposals from natural language prompts
- **Zero Cold Start**: Individual sellers get immediate value without team adoption
- **Strategy Capture**: Automatically extract PPS decisions from every proposal
- **Conversational Intelligence**: Query the knowledge base through natural language

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 14 (App Router) | Use server components by default |
| Language | TypeScript | Strict mode enabled |
| Database | PostgreSQL 16 + pgvector | Row-level security required |
| ORM | Prisma | With pgvector extension |
| Queue | BullMQ + Redis | For async proposal generation |
| Auth | NextAuth.js v5 | OAuth + email/password |
| Styling | Tailwind CSS | Use design system tokens |
| State | Zustand | Client-side state only |
| LLM | Anthropic Claude 3.5 Sonnet | Via official SDK |
| Embeddings | OpenAI text-embedding-3-small | 1536 dimensions |
| File Export | pptxgenjs | For PowerPoint generation (⚠️ rowSpan broken - avoid merged cells) |

## Phase 0 Validated Constraints

> **CRITICAL**: These constraints were validated through technical spikes. See [spikes/SPIKE_FINDINGS.md](./spikes/SPIKE_FINDINGS.md) for full details.

| Constraint | Spike | Impact |
|------------|-------|--------|
| **LLM math is 60% accurate** | Spike 2 | ALL pricing calculations MUST be programmatic. LLM extracts line items; code calculates totals. Never let LLM do arithmetic. |
| **pptxgenjs rowSpan broken** | Spike 1 | Use flat tables only. No merged cells. Use background colors for visual grouping. |
| **Bedrock has full parity** | Spike 4 | AWS Bedrock performs identically to Anthropic Direct (3.4% overhead, 25% faster TTFT). |
| **PLG cold start ~4 min** | Spike 3 | Zero-KB users get value in ~4 minutes. "Aha moment" is seeing complete 5-slide proposal. |

## Project Structure

```
deeldesk/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── opportunities/ # Opportunity management
│   │   ├── proposals/     # Proposal viewer/editor
│   │   ├── knowledge/     # Knowledge base management
│   │   │   ├── products/       # Product catalog
│   │   │   ├── battlecards/    # Competitive intelligence
│   │   │   ├── playbooks/      # Sales playbooks
│   │   │   ├── branding/       # Brand guidelines
│   │   │   └── company-profile/ # Company profile/business model
│   │   └── settings/      # User/org settings
│   ├── api/               # API routes
│   │   ├── opportunities/ # Opportunity CRUD
│   │   ├── proposals/     # Proposal generation
│   │   ├── knowledge/     # KB management
│   │   │   ├── company-profile/ # Company profile CRUD + generation
│   │   │   └── branding/       # Brand settings CRUD
│   │   └── stream/        # SSE endpoints
│   └── share/[id]/        # Public proposal viewer
├── components/
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── proposals/         # Proposal-specific components
│   ├── knowledge/         # KB-specific components
│   └── shared/            # Shared components
├── lib/
│   ├── ai/                # LLM integration layer
│   │   ├── anthropic.ts   # Claude client
│   │   ├── embeddings.ts  # Embedding generation
│   │   ├── prompts/       # System prompts
│   │   ├── context.ts     # Context Assembly Engine
│   │   └── business-model-generator.ts # AI company profile generation
│   ├── db/                # Database utilities
│   │   ├── prisma.ts      # Prisma client
│   │   └── queries/       # Typed query functions
│   ├── export/            # Export utilities
│   │   ├── pptx.ts        # PowerPoint generation
│   │   └── pdf.ts         # PDF generation
│   ├── pricing/           # Pricing engine
│   └── utils/             # General utilities
├── prisma/
│   ├── schema.prisma      # Database schema (includes brand_settings, company_profiles)
│   └── migrations/        # Migration history
├── workers/
│   └── generation.ts      # BullMQ worker for proposals
├── types/                 # TypeScript type definitions
└── tests/                 # Test files
```

## Key Architectural Decisions

### 1. Opportunity-Centric Data Model

All proposals are children of Opportunities. This reflects real sales processes where deals have multiple proposal iterations.

```
Organization → User(s) → Opportunity(ies) → Proposal(s)
                                         → DealContextItem(s)
                                         → StrategyRecord(s)
```

**Why**: Enables Deal Arc construction, CRM integration, and maintains context across proposal iterations.

### 2. Async Proposal Generation

Proposal generation uses BullMQ for async processing with SSE for real-time progress updates.

```
POST /api/proposals → Returns 202 + job_id
GET /api/stream/[job_id] → SSE connection for progress
```

**Why**: 60-second generation would timeout synchronous HTTP. Async + streaming provides responsive UX.

### 3. Context Assembly Engine

The Context Assembly Engine dynamically retrieves relevant context for each generation. See [docs/architecture/CONTEXT_ASSEMBLY.md](./docs/architecture/CONTEXT_ASSEMBLY.md) for complete documentation.

**Context Layers (bottom to top):**
1. Company Profile (organization-level, always included when available) - from `company_profiles` table
2. Brand Context (colors, voice, tone guidelines) - from `brand_settings` table
3. Session Context (prompt, template, preferences)
4. Deal Context (opportunity-specific info)
5. Business Context (products, competitors, playbooks)
6. Historical Patterns (winning strategies - Phase 2)

**Token Budget Allocation:**

| Context Type | Budget | Truncation Priority | Notes |
|--------------|--------|---------------------|-------|
| Company Profile | ~500 tokens | Never truncated | Foundational company context |
| Brand Context | ~200 tokens | Never truncated | Voice, tone, guidelines |
| Deal Context | 40% of remaining | 1 (last to truncate) | Opportunity-specific info |
| Products | 30% of remaining | 2 | Relevant catalog entries |
| Competitive | 20% of remaining | 3 | Battlecards for mentioned competitors |
| Playbooks | 10% of remaining | 4 (first to truncate) | Sales playbooks, objection handling |

**Overflow Strategy:**
1. Company Profile & Brand Context are never truncated (foundational)
2. RAG-retrieved content is truncated by priority (Playbooks first, Deal Context last)
3. User is warned when context is truncated with actionable guidance
4. Truncation events are logged for monitoring

**Foundational Context Tables:**
- `company_profiles` - AI-generated or user-provided business model summary (one-to-one with organizations)
- `brand_settings` - Organization branding configuration (one-to-one with organizations)

### 4. Row-Level Security (RLS)

ALL database queries must be filtered by `organization_id`. Use Prisma middleware or explicit where clauses.

```typescript
// CORRECT
const opportunities = await prisma.opportunity.findMany({
  where: { organizationId: session.organizationId }
});

// WRONG - Security vulnerability
const opportunities = await prisma.opportunity.findMany();
```

### 5. Pricing Engine (4-Scenario Matrix)

> ⚠️ **CRITICAL (Spike 2 Finding):** LLM math accuracy is only 60% with drift up to $1,000. ALL pricing calculations MUST be done in code. The LLM's role is to extract line items and structure; the pricing engine (TypeScript) calculates all totals.

The pricing engine handles four scenarios:

| Scenario | Behavior |
|----------|----------|
| Fully codified | Auto-calculate exact quote (programmatic) |
| Partially codified | Calculate known items (programmatic), [CUSTOM] for unknowns |
| Opaque/variable | Structure with [ENTER VALUE] placeholders |
| User pastes quote | Preserve as-is, parse for signals |

**Never hallucinate prices**. When uncertain, use placeholders. **Never let LLM perform arithmetic.**

## Coding Conventions

### TypeScript

```typescript
// Use explicit types, avoid `any`
interface Opportunity {
  id: string;
  organizationId: string;
  name: string;
  status: OpportunityStatus;
  dealContext: DealContext | null;
  createdAt: Date;
}

// Use enums for fixed values
enum OpportunityStatus {
  OPEN = 'open',
  WON = 'won',
  LOST = 'lost',
  STALLED = 'stalled'
}

// Prefer const assertions for literal types
const PLAN_TIERS = ['free', 'pro', 'team', 'enterprise'] as const;
type PlanTier = typeof PLAN_TIERS[number];
```

### API Routes (Next.js App Router)

```typescript
// app/api/opportunities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const opportunities = await prisma.opportunity.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { updatedAt: 'desc' }
  });

  return NextResponse.json(opportunities);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  // Validate with zod
  const validated = opportunityCreateSchema.parse(body);

  const opportunity = await prisma.opportunity.create({
    data: {
      ...validated,
      organizationId: session.organizationId,
      userId: session.userId
    }
  });

  return NextResponse.json(opportunity, { status: 201 });
}
```

### Server Components (Default)

```tsx
// app/(dashboard)/opportunities/page.tsx
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { OpportunityList } from '@/components/opportunities/OpportunityList';

export default async function OpportunitiesPage() {
  const session = await getServerSession(authOptions);
  
  const opportunities = await prisma.opportunity.findMany({
    where: { organizationId: session!.organizationId },
    include: { proposals: { select: { id: true, status: true } } },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Opportunities</h1>
      <OpportunityList opportunities={opportunities} />
    </div>
  );
}
```

### Client Components (When Needed)

```tsx
// components/proposals/ProposalEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import { useProposalStore } from '@/stores/proposalStore';

export function ProposalEditor({ proposalId }: { proposalId: string }) {
  const { proposal, isLoading, fetchProposal } = useProposalStore();
  
  useEffect(() => {
    fetchProposal(proposalId);
  }, [proposalId, fetchProposal]);

  if (isLoading) return <LoadingSkeleton />;
  
  return (
    // Editor UI
  );
}
```

### Error Handling

```typescript
// Use custom error classes
class DeeldeskError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'DeeldeskError';
  }
}

class NotFoundError extends DeeldeskError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

class UnauthorizedError extends DeeldeskError {
  constructor() {
    super('Unauthorized', 'UNAUTHORIZED', 401);
  }
}

// In API routes
try {
  // ... operation
} catch (error) {
  if (error instanceof DeeldeskError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
```

### LLM Integration (Multi-Provider Architecture)

> **IMPORTANT**: See [docs/architecture/LLM_PROVIDER_ARCHITECTURE.md](./docs/architecture/LLM_PROVIDER_ARCHITECTURE.md) for complete documentation.

Deeldesk uses a provider abstraction layer to support multiple LLM backends for data sovereignty:

| Provider | Use Case | Plan Tiers |
|----------|----------|------------|
| Anthropic Direct | Default, lowest latency | Free, Pro |
| AWS Bedrock | Enterprise data sovereignty | Team, Enterprise |
| Google Vertex AI | Enterprise data sovereignty | Enterprise (Phase 3) |
| BYOL | Customer's own LLM | Enterprise (Phase 3) |

```typescript
// lib/ai/provider-factory.ts
import { getProviderForOrganization } from './provider-factory';

// Always get provider through factory - never instantiate directly
const provider = await getProviderForOrganization(organizationId);

// Use unified interface for all providers
const response = await provider.generateCompletion({
  systemPrompt: buildSystemPrompt(context, options),
  messages: [{ role: 'user', content: context.userPrompt }],
  maxTokens: 4096,
});
```

```typescript
// Streaming example
async function* generateProposal(organizationId: string, context: AssembledContext) {
  const provider = await getProviderForOrganization(organizationId);
  
  for await (const event of provider.streamCompletion({
    systemPrompt: buildSystemPrompt(context),
    messages: [{ role: 'user', content: context.userPrompt }],
  })) {
    if (event.type === 'content_delta') {
      yield { type: 'content', content: event.content };
    }
  }
}
```

**Key Rules:**
- NEVER instantiate providers directly in application code
- ALWAYS use `getProviderForOrganization()` factory
- Provider selection is based on organization settings and plan tier
- Embeddings may use a different provider than completions (for cost optimization)
```

## Important Patterns

### 1. Safe Mode (Zero Hallucination)

When Safe Mode is enabled, modify system prompts to use [VERIFY] placeholders for uncertain content:

```typescript
const safeModeInstruction = `
CRITICAL: Safe Mode is enabled. You must:
- Never invent features, prices, or competitive claims
- If uncertain about any fact, use [VERIFY: description] placeholder
- Only state information explicitly present in the provided context
- For pricing, use [ENTER VALUE] for any amount not in context
`;
```

### 2. Draft Auto-Save (localStorage)

```typescript
// hooks/useDraftPersistence.ts
const DRAFT_KEY = (opportunityId: string) => `deeldesk_draft_${opportunityId}`;
const SAVE_INTERVAL = 30000; // 30 seconds
const DRAFT_EXPIRY_DAYS = 7;

export function useDraftPersistence(opportunityId: string) {
  // Save draft
  const saveDraft = useCallback((draft: DraftState) => {
    const payload = {
      ...draft,
      savedAt: Date.now(),
      expiresAt: Date.now() + (DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    };
    localStorage.setItem(DRAFT_KEY(opportunityId), JSON.stringify(payload));
  }, [opportunityId]);

  // Load draft
  const loadDraft = useCallback((): DraftState | null => {
    const stored = localStorage.getItem(DRAFT_KEY(opportunityId));
    if (!stored) return null;
    
    const draft = JSON.parse(stored);
    if (Date.now() > draft.expiresAt) {
      localStorage.removeItem(DRAFT_KEY(opportunityId));
      return null;
    }
    return draft;
  }, [opportunityId]);

  // Auto-save effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) saveDraft(currentDraft);
    }, SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, currentDraft, saveDraft]);
}
```

### 3. SSE Streaming

```typescript
// app/api/stream/[jobId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: StreamEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      // Subscribe to job progress
      const subscription = await subscribeToJob(params.jobId);
      
      for await (const update of subscription) {
        sendEvent(update);
        if (update.status === 'complete' || update.status === 'error') {
          break;
        }
      }
      
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

## Testing Expectations

### Unit Tests

- All utility functions in `lib/` should have unit tests
- Use Vitest as test runner
- Mock external services (Anthropic, OpenAI)

### Integration Tests

- API routes should have integration tests
- Use test database with RLS verification
- Test auth flows end-to-end

### E2E Tests

- Critical user journeys with Playwright
- Proposal generation flow (happy path)
- Error recovery scenarios

## Things to Avoid

### Security Anti-Patterns

```typescript
// ❌ NEVER: Query without organization filter
await prisma.opportunity.findMany();

// ❌ NEVER: Trust client-provided organizationId
const { organizationId } = await request.json();
await prisma.opportunity.findMany({ where: { organizationId } });

// ✅ CORRECT: Always use session organizationId
const session = await getServerSession(authOptions);
await prisma.opportunity.findMany({ 
  where: { organizationId: session.organizationId } 
});
```

### Performance Anti-Patterns

```typescript
// ❌ NEVER: N+1 queries
const opportunities = await prisma.opportunity.findMany();
for (const opp of opportunities) {
  opp.proposals = await prisma.proposal.findMany({ 
    where: { opportunityId: opp.id } 
  });
}

// ✅ CORRECT: Use include
const opportunities = await prisma.opportunity.findMany({
  include: { proposals: true }
});
```

### LLM Anti-Patterns

```typescript
// ❌ NEVER: Hallucinate prices
"The total investment is approximately $150,000..."

// ❌ NEVER: Let LLM calculate (60% accuracy - Spike 2)
prompt: "Calculate 50 users × $99/month × 12 months"
// LLM may return $58,400 instead of $59,400

// ✅ CORRECT: Use exact values or placeholders
"The total investment is $151,200..." // If in context
"The total investment is [ENTER VALUE]..." // If unknown

// ✅ CORRECT: Programmatic calculation
const total = quantity * unitPrice * term; // Always in code
```

## Environment Variables

Required environment variables (see `.env.example`):

```
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI Services
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# File Storage
S3_BUCKET=...
S3_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Generate coverage report

# Building
npm run build            # Production build
npm run start            # Start production server

# Utilities
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript compiler
npm run format           # Format with Prettier
```

## References

- [PRD v4.0](./docs/product/Deeldesk_PRD_v4_0.docx) - Full product requirements
- [Sprint Plan](./docs/planning/SPRINT_PLAN.md) - Development timeline
- [Database Schema](./docs/architecture/DATABASE_SCHEMA.sql) - Full schema with comments
- [LLM Provider Architecture](./docs/architecture/LLM_PROVIDER_ARCHITECTURE.md) - Multi-provider design for data sovereignty
- [Spike Findings](./spikes/SPIKE_FINDINGS.md) - Phase 0 technical validation results
