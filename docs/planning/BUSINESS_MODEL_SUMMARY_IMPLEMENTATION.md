# Business Model Summary Implementation Plan

**Feature:** AI-Generated Organization Business Model Summary  
**Status:** Implementation Plan  
**Last Updated:** January 2025

---

## Overview

This plan implements an AI-generated business model summary for the user's own organization, stored in `organizations.settings` JSONB and accessible via the Knowledge Base section. The summary provides persistent company-level context for all proposal generations.

---

## Architecture Decision

### Storage: `organizations.settings` JSONB

**Rationale:**
- Single organizational knowledge item (not a collection)
- Always included in context assembly (not RAG-retrieved)
- Similar to brand settings — organizational configuration
- No schema migration needed
- Always available for every proposal

**Structure:**
```typescript
interface OrganizationSettings {
  // ... existing fields ...
  business_model?: {
    summary: string;  // Main business model description
    generated_at: string;  // ISO timestamp
    generated_by: 'ai' | 'user';
    last_edited_at?: string;  // ISO timestamp
    last_edited_by?: string;  // user_id
    is_verified: boolean;  // User has reviewed/verified
    sources?: string[];  // URLs used for generation (optional)
    confidence?: 'high' | 'medium' | 'low';  // Generation confidence
  };
}
```

---

## Implementation Tasks

### Phase 1: Backend Foundation (8 points)

#### Task 1.1: Database Schema Updates
**File:** `prisma/schema.prisma`  
**Points:** 1

- No schema changes needed (uses existing `organizations.settings` JSONB)
- Update TypeScript types in `types/organization.ts` to include `business_model` field

**Files to modify:**
- `types/organization.ts` - Add `BusinessModelSummary` interface

---

#### Task 1.2: Business Model Generation Service
**File:** `lib/ai/business-model-generator.ts` (new)  
**Points:** 5

**Responsibilities:**
- Use LLM with web search capability to research organization
- Generate structured business model summary
- Return summary with confidence score and sources

**Implementation:**
```typescript
// lib/ai/business-model-generator.ts
export interface BusinessModelSummary {
  summary: string;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
}

export async function generateBusinessModelSummary(
  organizationName: string,
  organizationDomain?: string
): Promise<BusinessModelSummary> {
  // 1. Use LLM with web search to research company
  // 2. Generate summary covering:
  //    - Company overview
  //    - Value proposition
  //    - Target customers
  //    - Revenue model
  //    - Key differentiators
  // 3. Return with confidence and sources
}
```

**Dependencies:**
- LLM provider (Anthropic Claude with web search or similar)
- Web search API (Tavily, Serper, or LLM-native search)

**Files to create:**
- `lib/ai/business-model-generator.ts`

---

#### Task 1.3: API Endpoints
**Files:** `app/api/knowledge/business-model/route.ts` (new)  
**Points:** 2

**Endpoints:**

```typescript
// GET /api/knowledge/business-model
// Returns current business model summary for organization

// POST /api/knowledge/business-model/generate
// Triggers AI generation, returns summary

// PUT /api/knowledge/business-model
// Updates business model summary (user edits)
// Body: { summary: string, is_verified?: boolean }
```

**Files to create:**
- `app/api/knowledge/business-model/route.ts`
- `app/api/knowledge/business-model/generate/route.ts`

**Files to modify:**
- `lib/db/queries/organizations.ts` - Add helper functions for updating settings

---

### Phase 2: Context Assembly Integration (3 points)

#### Task 2.1: Update Context Assembly Engine
**File:** `lib/ai/context.ts`  
**Points:** 3

**Changes:**
- Retrieve business model summary from organization settings
- Include in `AssembledContext` when present
- Add to system prompt for proposal generation

**Implementation:**
```typescript
// lib/ai/context.ts
export async function assembleContext(
  opportunityId: string,
  organizationId: string
): Promise<AssembledContext> {
  const org = await getOrganization(organizationId);
  
  // Include business model if it exists
  const businessModel = org.settings.business_model?.summary;
  
  return {
    // ... existing context
    businessModel,  // Always included when present
    products: await getRelevantProducts(opportunityId),
    battlecards: await getRelevantBattlecards(opportunityId),
    playbooks: await getRelevantPlaybooks(opportunityId),
    // ...
  };
}
```

**Files to modify:**
- `lib/ai/context.ts` - Add business model retrieval
- `lib/ai/prompts/system-prompt.ts` - Include business model in prompt template

---

### Phase 3: Frontend UI (8 points)

#### Task 3.1: Knowledge Base Navigation Update
**File:** `docs/design/NAVIGATION_SYSTEM.md`, `app/(dashboard)/knowledge/layout.tsx`  
**Points:** 1

**Changes:**
- Add "Company Profile" or "About Us" to Knowledge Base navigation
- Update navigation structure

**Navigation structure:**
```
/knowledge
├── /knowledge/products
├── /knowledge/battlecards
├── /knowledge/playbooks
├── /knowledge/branding
└── /knowledge/company-profile  ← NEW
```

**Files to modify:**
- `app/(dashboard)/knowledge/layout.tsx` - Add navigation item
- `docs/design/NAVIGATION_SYSTEM.md` - Update documentation

---

#### Task 3.2: Company Profile Page
**File:** `app/(dashboard)/knowledge/company-profile/page.tsx` (new)  
**Points:** 4

**UI Components:**
- Display current business model summary (if exists)
- "Generate with AI" button (if not generated or user wants to regenerate)
- Editable text area for summary
- Save button
- "Verified" checkbox
- Loading states for generation
- Confidence indicator and sources (if available)

**UI Structure:**
```
┌─────────────────────────────────────────────────┐
│  Company Profile                    [Generate]   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Business Model Summary                         │
│  ┌───────────────────────────────────────────┐  │
│  │ [Editable text area with current summary] │  │
│  │                                           │  │
│  │ [AI Generated] Last updated: Jan 15, 2025 │  │
│  │ Sources: company.com, linkedin.com       │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ☑ I have verified this information             │
│                                                  │
│  [Save Changes]                                 │
└─────────────────────────────────────────────────┘
```

**Empty State:**
```
┌─────────────────────────────────────────────────┐
│  Company Profile                                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  No business model summary yet.                 │
│                                                  │
│  Generate an AI-powered summary based on        │
│  publicly available information about your      │
│  company. You can edit and refine it after.    │
│                                                  │
│  [Generate with AI]                             │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Files to create:**
- `app/(dashboard)/knowledge/company-profile/page.tsx`
- `components/knowledge/CompanyProfileEditor.tsx`

**Files to modify:**
- `app/(dashboard)/knowledge/layout.tsx` - Add route

---

#### Task 3.3: Generation UI Flow
**File:** `components/knowledge/CompanyProfileEditor.tsx`  
**Points:** 3

**Features:**
- Loading state during generation
- Error handling for generation failures
- Success state with generated summary
- Edit mode toggle
- Save confirmation

**Files to create:**
- `components/knowledge/CompanyProfileEditor.tsx`
- `components/knowledge/BusinessModelGenerator.tsx` (if needed)

---

### Phase 4: Integration & Testing (3 points)

#### Task 4.1: Update System Prompts
**File:** `lib/ai/prompts/system-prompt.ts`  
**Points:** 1

**Changes:**
- Include business model summary in system prompt template
- Add instructions for how to use business model context

**Prompt addition:**
```
BUSINESS MODEL CONTEXT:
${businessModel || 'No business model summary available.'}

Use this context to:
- Align value propositions with company positioning
- Ensure messaging consistency
- Reference company differentiators appropriately
```

**Files to modify:**
- `lib/ai/prompts/system-prompt.ts`

---

#### Task 4.2: Testing
**Points:** 2

**Test Cases:**
1. Generate business model summary via API
2. Update business model summary via API
3. Verify context assembly includes business model
4. Test UI generation flow
5. Test UI editing and saving
6. Verify business model appears in proposal generation prompts

**Files to create:**
- `tests/api/knowledge/business-model.test.ts`
- `tests/lib/ai/business-model-generator.test.ts`
- `tests/lib/ai/context.test.ts` (update existing)

---

## File Structure

### New Files

```
lib/
├── ai/
│   └── business-model-generator.ts  (new)
│
app/
├── api/
│   └── knowledge/
│       └── business-model/
│           ├── route.ts  (new)
│           └── generate/
│               └── route.ts  (new)
│
├── (dashboard)/
│   └── knowledge/
│       └── company-profile/
│           └── page.tsx  (new)
│
components/
└── knowledge/
    ├── CompanyProfileEditor.tsx  (new)
    └── BusinessModelGenerator.tsx  (new, optional)
│
types/
└── organization.ts  (modify - add BusinessModelSummary interface)
```

### Modified Files

```
lib/
├── ai/
│   ├── context.ts  (add business model retrieval)
│   └── prompts/
│       └── system-prompt.ts  (include business model in prompt)
│
app/
└── (dashboard)/
    └── knowledge/
        └── layout.tsx  (add navigation item)

docs/
└── design/
    └── NAVIGATION_SYSTEM.md  (update navigation structure)
```

---

## API Specification

### GET /api/knowledge/business-model

Returns current business model summary for the authenticated user's organization.

**Response:**
```json
{
  "summary": "Acme Corp is a B2B SaaS platform...",
  "generated_at": "2025-01-15T10:30:00Z",
  "generated_by": "ai",
  "last_edited_at": "2025-01-16T14:20:00Z",
  "last_edited_by": "user_123",
  "is_verified": true,
  "sources": ["https://acme.com", "https://linkedin.com/company/acme"],
  "confidence": "high"
}
```

**Status Codes:**
- `200` - Success
- `404` - No business model summary exists yet

---

### POST /api/knowledge/business-model/generate

Triggers AI generation of business model summary.

**Request Body:**
```json
{
  "organization_name": "Acme Corp",  // Optional, defaults to org name
  "organization_domain": "acme.com"  // Optional, for better search
}
```

**Response:**
```json
{
  "summary": "Acme Corp is a B2B SaaS platform...",
  "generated_at": "2025-01-15T10:30:00Z",
  "generated_by": "ai",
  "is_verified": false,
  "sources": ["https://acme.com", "https://linkedin.com/company/acme"],
  "confidence": "high"
}
```

**Status Codes:**
- `200` - Generation successful
- `400` - Invalid request
- `429` - Rate limit exceeded (too many generations)
- `500` - Generation failed

---

### PUT /api/knowledge/business-model

Updates the business model summary (user edits).

**Request Body:**
```json
{
  "summary": "Updated business model description...",
  "is_verified": true  // Optional
}
```

**Response:**
```json
{
  "summary": "Updated business model description...",
  "generated_at": "2025-01-15T10:30:00Z",
  "generated_by": "ai",
  "last_edited_at": "2025-01-16T14:20:00Z",
  "last_edited_by": "user_123",
  "is_verified": true,
  "sources": ["https://acme.com", "https://linkedin.com/company/acme"],
  "confidence": "high"
}
```

**Status Codes:**
- `200` - Update successful
- `400` - Invalid request
- `401` - Unauthorized

---

## Context Assembly Integration

### Updated Context Structure

```typescript
interface AssembledContext {
  // ... existing fields
  businessModel?: string;  // Organization's business model summary
  products: Product[];
  battlecards: Battlecard[];
  playbooks: Playbook[];
  // ...
}
```

### System Prompt Integration

The business model summary is included in the system prompt as foundational context:

```
You are generating a proposal for [Customer Company].

ORGANIZATION CONTEXT:
[Business Model Summary if available]

Use this context to ensure:
- Value propositions align with our company positioning
- Messaging reflects our key differentiators
- Tone and style match our business model
```

---

## Implementation Phases

### MVP (Phase 1-3)
- Basic AI generation from organization name
- Simple text summary (not structured sections)
- Edit and save functionality
- Context assembly integration
- Basic UI in Knowledge Base

**Estimated Points:** 19 points

### Phase 4 Enhancements (Future)
- Structured sections (company overview, value prop, etc.)
- Version history
- Staleness detection
- Multiple data sources (Crunchbase, G2, etc.)
- Confidence indicators per section
- Source attribution per section

---

## Dependencies

### External Services
- **LLM Provider:** Anthropic Claude (with web search) or similar
- **Web Search API:** Tavily, Serper, or LLM-native search capability

### Environment Variables
```env
# Existing
ANTHROPIC_API_KEY=sk-ant-...

# New (if using separate search API)
TAVILY_API_KEY=tvly-...  # Optional
SERPER_API_KEY=...  # Optional
```

---

## Security & Privacy Considerations

1. **Rate Limiting:** Limit generation requests (e.g., 5 per day per organization)
2. **Data Privacy:** Only use publicly available information
3. **User Control:** Users can opt for manual-only input
4. **Audit Trail:** Log when summaries are generated/updated

---

## Success Metrics

- **Generation Success Rate:** > 80% (medium+ confidence)
- **User Edit Rate:** 60-80% (indicates engagement)
- **Verification Rate:** > 70% within first week
- **Context Usage:** Business model included in > 90% of proposals (when available)

---

## Open Questions

1. **Web Search Provider:** Which service to use? (Tavily, Serper, or LLM-native)
2. **Generation Trigger:** On-demand only, or also prompt during onboarding?
3. **Rate Limits:** How many generations per day/week?
4. **Structured vs. Freeform:** Start with simple text or structured sections?

---

## Next Steps

1. Review and approve this implementation plan
2. Set up web search API access (Tavily/Serper)
3. Begin Phase 1 implementation
4. Test generation quality with sample organizations
5. Iterate based on feedback
