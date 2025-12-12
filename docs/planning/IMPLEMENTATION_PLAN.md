# Deeldesk.ai Implementation Plan

**Based on:** Sprint Plan Phase 0 MVP v1.2
**Created:** December 2025
**Last Updated:** December 12, 2025
**Status:** Sprint 1 Complete - Proceeding to Sprint 2
**Note:** This is the consolidated execution plan. Historical spike documentation archived in `archive/SPRINT_PLAN.md`.

---

## Current Status: Sprint 1 Complete ✅

**Updated December 12, 2025**

### Sprint 1 Foundation - COMPLETE ✅

All Sprint 1 deliverables have been implemented:
- ✅ NextAuth.js v5 with email/password and Google OAuth
- ✅ Organization auto-creation on signup
- ✅ Dashboard with navigation and empty states
- ✅ Opportunity CRUD (create, list, view, update, delete)
- ✅ shadcn/ui component library configured
- ✅ Vitest test framework configured
- ✅ GitHub Actions CI/CD pipeline
- ✅ API versioning (`/api/v1/`)

**Bonus Deliverables (Sprint 1):**
- ✅ Platform Admin panel (`/admin/*`) with red sidebar
- ✅ Organization Settings (`/settings/*`)
- ✅ User management with platform admin toggle
- ✅ Organization role management (owner, admin, manager, member, viewer)
- ✅ Member listing for organizations

### Infrastructure Ready
- ✅ Next.js 16 project bootstrapped with TypeScript and Tailwind
- ✅ Prisma ORM configured with 21 database tables
- ✅ Docker services running (PostgreSQL 16 + pgvector, Redis 7, MinIO)
- ✅ All Phase 0 dependencies installed (pptxgenjs, AI SDKs, etc.)

### API Keys Verified
- ✅ **Anthropic API** — Claude Sonnet 4 responding
- ✅ **OpenAI API** — Embeddings working (1536 dimensions)
- ✅ **AWS Bedrock** — Claude 3.5 Sonnet responding (us-west-2)

### Architecture Decisions Locked
- ✅ RLS Strategy: Application-layer for MVP
- ✅ Rate Limiting: API routes + ioredis
- ✅ Embedding Provider: OpenAI text-embedding-3-small
- ✅ **Pricing Calculations: Programmatic (not LLM)** — See Spike 2 findings

### Spike 1 Results: Rendering Engine ✅ GO
- **Pass Rate:** 9/10 tests
- **Finding:** pptxgenjs is production-ready
- **Limitation:** `rowSpan` (merged cells) does NOT work — use flat tables
- **Workaround:** Avoid row spans, use visual separation with colors instead

### Spike 2 Results: Context Window Reasoning ✅ GO WITH CONDITIONS
- **Needle-in-Haystack:** 100% accuracy (30/30)
- **Math Integrity:** 60% accuracy (3/5) — **UNACCEPTABLE**
- **Currency Detection:** 100% accuracy (3/3)

> ⚠️ **CRITICAL FINDING:** LLM cannot be trusted for pricing calculations.
> Math drift up to $1,000 observed. ALL pricing must be calculated programmatically.
> See `spikes/SPIKE_FINDINGS.md` for full details.

### Spike 3 Results: PLG User Journey ✅ GO
- **Cold Start:** ~4 minutes (target: <10 min) — **PASS**
- **Minimal Setup:** ~7 minutes (target: <10 min) — **PASS**
- **Deal Context:** ~6 minutes (target: <10 min) — **PASS**
- **Returning User:** ~3 minutes (target: <5 min) — **PASS**
- **Verdict:** PLG motion validated, clear path to "aha moment"

### Spike 4 Results: LLM Provider Abstraction ✅ GO
- **Latency Overhead:** 3.4% (threshold: 25%) — **PASS**
- **TTFT:** Bedrock 25% FASTER than Anthropic Direct
- **Feature Parity:** 100% (system prompts, multi-turn, streaming)
- **Verdict:** Ship MVP with both Anthropic Direct and AWS Bedrock

### Phase 0 Complete - GO for MVP

| Spike | Status | Key Finding |
|-------|--------|-------------|
| 1 - Rendering | ✅ GO | pptxgenjs works; avoid rowSpan |
| 2 - Context | ✅ GO w/ conditions | Math must be programmatic |
| 3 - PLG Journey | ✅ GO | ~4 min cold start achieved |
| 4 - LLM Providers | ✅ GO | 3.4% overhead, full parity |
| 5 - POTX Upload | ⏭️ Deferred | Sprint 7 |

### Next Steps
Continue MVP Development:
1. ~~Phase 0 Spikes~~ ✅ Complete
2. ~~Sprint 1: Foundation~~ ✅ Complete
3. ~~Sprint 2: Core Generation~~ ✅ Complete
4. **Sprint 3:** Context & Knowledge Base

---

## Executive Summary

This implementation plan outlines the complete development roadmap for Deeldesk.ai, an AI-powered proposal generation platform. The plan covers **Phase 0 Technical De-Risking** (1.5 weeks) through **MVP Launch** (16 weeks), totaling **~17.5 weeks** of development.

### Key Objectives

1. **Validate Critical Technical Assumptions** (Phase 0)
2. **Build MVP with Core Features** (Sprints 1-8)
3. **Launch PLG Product** (Sprint 8)

### Team Assumptions

- 2-3 Full-stack Engineers
- 1 Designer (50% allocation)
- 1 Product Manager (50% allocation)
- 0.5 QA (Sprint 8 only)

---

## Phase 0: Technical De-Risking (1.5 Weeks)

**Duration:** 8 working days  
**Objective:** Validate highest-risk technical assumptions before committing to full MVP build  
**Go/No-Go Decision:** End of Day 8

### Critical Spikes

#### Spike 1: Rendering Engine ("Slide Breaker") ✅ COMPLETE
**Owner:** Engineer 1
**Duration:** 2 days
**Status:** GO

**Tasks:**
- [x] Set up pptxgenjs test harness
- [x] Test 10 slide layouts with complex content
- [x] Stress test quote tables (25+ line items)
- [x] Test Unicode handling (€, ¥, 日本語)
- [x] Evaluate fallback options if needed

**Results:**
- ✅ **9/10 tests passed**
- ✅ Unicode characters render properly
- ✅ 25-item quote tables render correctly
- ❌ **Merged cells (rowSpan) do NOT work** — confirmed via manual verification

**Limitation:**
> pptxgenjs `rowSpan` renders cells as separate rows instead of merged.
> **WORKAROUND:** Use flat table structures with visual color grouping.

**Deliverables:**
- [x] Test execution log: `spikes/spike-1-rendering/results.json`
- [x] Generated artifacts: `spikes/spike-1-rendering/outputs/*.pptx`
- [x] Findings document: `spikes/SPIKE_FINDINGS.md`

---

#### Spike 2: Context Window Reasoning ✅ COMPLETE
**Owner:** Engineer 2
**Duration:** 2 days
**Status:** GO WITH CONDITIONS

**Tasks:**
- [x] Create test data (1,500-word battlecard, buried facts)
- [x] Run "needle in haystack" tests (10 iterations × 3 runs)
- [x] Test math integrity (exact number preservation)
- [x] Test currency consistency handling
- [x] Evaluate fallback approaches if accuracy <95%

**Results:**
- ✅ **Fact Retrieval:** 100% accuracy (30/30 tests)
- ❌ **Math Integrity:** 60% accuracy (3/5 tests) — **FAILED**
- ✅ **Currency Detection:** 100% accuracy (3/3 tests)

**Critical Finding:**
> LLM CANNOT be trusted for pricing calculations. Observed $15-$1,000 drift.
> **REQUIREMENT:** All pricing must be calculated programmatically in Sprint 4.

**Deliverables:**
- [x] Test execution log: `spikes/spike-2-context/results/results.json`
- [x] Findings document: `spikes/SPIKE_FINDINGS.md`
- [x] Architecture recommendation: Programmatic pricing engine

---

#### Spike 3: PLG User Journey Simulation ✅ COMPLETE
**Owner:** Engineer 1 + Designer
**Duration:** 1 day
**Status:** GO

**Tasks:**
- [x] Simulate cold start scenario (<10 min target)
- [x] Simulate minimal setup (1 battlecard + 1 product)
- [x] Simulate deal context paste (500-word email)
- [x] Document "aha moment" and friction points

**Results:**
- ✅ **Cold Start:** ~4 minutes (target: <10 min) — **PASS**
- ✅ **Minimal Setup:** ~7 minutes (target: <10 min) — **PASS**
- ✅ **Deal Context:** ~6 minutes (target: <10 min) — **PASS**
- ✅ **Returning User:** ~3 minutes (target: <5 min) — **PASS**

**Deliverables:**
- [x] User journey timelines: `spikes/SPIKE_FINDINGS.md`
- [x] Friction point analysis: Documented in findings
- [x] Onboarding optimization recommendations: Documented

---

#### Spike 4: LLM Data Privacy Architecture ✅ COMPLETE
**Owner:** Engineer 1 + Engineer 2
**Duration:** 3 days
**Priority:** CRITICAL — Determines enterprise adoption viability
**Status:** GO

**Background:** Enterprise customers require data sovereignty options where deal data never leaves their cloud environment.

**Tasks:**
- [x] Set up AWS Bedrock in test account
- [x] Design LLMProvider abstraction interface
- [x] Implement BedrockProvider with streaming
- [x] Implement AnthropicDirectProvider (default)
- [x] Benchmark performance (latency, throughput)
- [x] Analyze cost differences (deferred detailed spreadsheet to Sprint 2)
- [x] Evaluate embedding providers (OpenAI vs Bedrock Titan)

**Results:**
- ✅ **Latency Overhead:** 3.4% (threshold: 25%) — **PASS**
- ✅ **TTFT:** Bedrock 25% FASTER than Anthropic Direct
- ✅ **Feature Parity:** 100% (system prompts, multi-turn, streaming)
- ✅ **Verdict:** Ship MVP with both Anthropic Direct and AWS Bedrock

**Deliverables:**
- [x] `LLMProvider` interface specification: `spikes/spike-4-llm/providers/LLMProvider.ts`
- [x] Working provider implementations: Validated in spike
- [x] Performance benchmark report: `spikes/SPIKE_FINDINGS.md`
- [x] Architecture decision document: `docs/architecture/LLM_PROVIDER_ARCHITECTURE.md`

---

### Day 7-8: Integration & Go/No-Go Decision ✅ COMPLETE

**Tasks:**
- [x] Aggregate findings from all spikes
- [x] Identify cross-cutting concerns
- [x] Document blockers/dependencies
- [x] Finalize LLM provider recommendation
- [x] Prepare Go/No-Go recommendation

**Decision:** GO for MVP Development (December 12, 2025)

---

#### Spike 5: POTX Template Upload (Optional - If Time Permits)

**Owner:** Engineer 2  
**Duration:** 1 day (if time available, otherwise defer to Sprint 7)  
**Priority:** Nice-to-have for MVP, but valuable for onboarding

**Background:** Users often have existing PowerPoint templates (.potx files) with corporate branding. Validating if we can extract branding automatically would significantly improve onboarding.

**Tasks:**

- [ ] **Task 5.1: Set Up POTX Parser** (2 hours)
  - Install jszip and fast-xml-parser
  - Create basic POTX extraction utility
  - Test with sample corporate template

- [ ] **Task 5.2: Extract Branding Elements** (3 hours)
  - Parse theme XML for colors (primary, secondary, accent)
  - Extract font families (heading, body)
  - Locate and extract logo image from slide master
  - Handle edge cases (missing elements, corrupted files)

- [ ] **Task 5.3: Map to pptxgenjs** (2 hours)
  - Convert extracted colors to hex format
  - Map fonts to pptxgenjs font options
  - Test logo insertion in generated proposal
  - Generate sample proposal with extracted branding

- [ ] **Task 5.4: Validation & Assessment** (1 hour)
  - Test with 3-5 different corporate templates
  - Measure extraction accuracy
  - Document limitations and edge cases
  - Assess implementation complexity for Sprint 7

**Acceptance Criteria**

| Test | Green (Go) | Yellow (Proceed w/ Caution) | Red (No-Go) |
|------|------------|----------------------------|-------------|
| Color extraction | >90% accuracy across templates | 70-90% accuracy | <70% accuracy |
| Font extraction | >95% accuracy | 80-95% accuracy | <80% accuracy |
| Logo extraction | Works for 80%+ templates | Works for 50-80% | <50% success |
| Mapping to pptxgenjs | Full compatibility | Minor adjustments needed | Major incompatibilities |

**Deliverables**

- [ ] POTX parser proof-of-concept
- [ ] Test results with sample templates
- [ ] Implementation estimate for Sprint 7
- [ ] Recommendation: Include in Sprint 7 or defer to Phase 2

**Decision Criteria**

- **Green:** Include POTX upload in Sprint 7 (5 days estimated)
- **Yellow:** Include with manual fallback option
- **Red:** Defer to Phase 2, stick with manual configuration

---

**Decision Matrix:**

| Spike | Green (Go) | Yellow (Proceed w/ Caution) | Red (No-Go) |
|-------|------------|----------------------------|-------------|
| Rendering | All layouts pass | Minor fallbacks needed | Major layouts fail |
| Context Reasoning | 0% math drift, >95% retrieval | 5-10% issues w/ mitigation | >10% issues |
| PLG Journey | <10 min all scenarios | 10-15 min w/ clear fixes | >15 min |
| LLM Data Privacy | Full Bedrock parity, <15% latency | Minor gaps, 15-25% latency | Major gaps or >25% latency |

---

## MVP Development: Sprints 1-8 (16 Weeks)

### Sprint Overview

| Sprint | Weeks | Focus | Key Deliverables |
|--------|-------|-------|------------------|
| **Sprint 1** | 1-2 | Foundation | Data model, auth, basic UI shell |
| **Sprint 2** | 3-4 | Core Generation | Proposal creation, SSE streaming, LLM provider abstraction |
| **Sprint 3** | 5-6 | Context & KB | Deal context, knowledge base, RAG |
| **Sprint 4** | 7-8 | Pricing Engine | 4-scenario pricing, governance |
| **Sprint 5** | 9-10 | Strategy & Export | Strategy extraction, PPTX/PDF export |
| **Sprint 6** | 11-12 | Resilience | Session persistence, error recovery |
| **Sprint 7** | 13-14 | Polish | Safe Mode, battlecards, Send-as-Link |
| **Sprint 8** | 15-16 | Launch Prep | QA, performance, launch readiness |

---

## Sprint 1: Foundation (Weeks 1-2) ✅ COMPLETE

**Theme:** Build the architectural foundation
**Status:** COMPLETE (December 12, 2025)

### Goals
- ✅ Establish Opportunity-centric data model
- ✅ Implement authentication and organization setup
- ✅ Create basic UI shell and navigation
- ✅ Set up CI/CD pipeline

### User Stories (19 points)

| ID | Story | Points | Status |
|----|-------|--------|--------|
| S1-001 | Sign up with email/password or Google OAuth | 5 | ✅ Done |
| S1-002 | Create and name organization | 3 | ✅ Done (auto-created) |
| S1-003 | See dashboard with empty state | 3 | ✅ Done |
| S1-004 | Create new Opportunity with name/description | 5 | ✅ Done |
| S1-005 | View list of Opportunities | 3 | ✅ Done |

### Technical Tasks (35 points)

| ID | Task | Points | Status |
|----|------|--------|--------|
| T1-001 | Set up Next.js 14 project with App Router | 2 | ✅ Done |
| T1-002 | Configure PostgreSQL with pgvector | 3 | ✅ Done |
| T1-003 | Implement Organization entity with RLS | 5 | ✅ Done (app-level) |
| T1-004 | Implement Opportunity entity schema | 3 | ✅ Done |
| T1-005 | Implement User entity with org membership | 3 | ✅ Done |
| T1-006 | Set up authentication (NextAuth.js) | 5 | ✅ Done (v5) |
| T1-007 | Create UI component library foundation (shadcn/ui + design tokens) | 5 | ✅ Done |
| T1-008 | Set up CI/CD with GitHub Actions | 3 | ✅ Done |
| T1-009 | Configure staging environment | 2 | ⏭️ Deferred |
| T1-010 | Add closed_at handling to Opportunity model | 1 | ✅ Done |
| T1-011 | **Set up Vitest for unit tests** | 2 | ✅ Done |
| T1-012 | **Configure test database and fixtures** | 2 | ✅ Done |

### Bonus Deliverables (Not in Original Plan)

| ID | Task | Description |
|----|------|-------------|
| T1-B01 | Platform Admin Panel | `/admin/*` routes with red sidebar, user/org management |
| T1-B02 | Organization Settings | `/settings/*` routes for org general settings and members |
| T1-B03 | Role Management | Platform admin toggle, org role changes (owner→viewer) |
| T1-B04 | API Versioning | All routes under `/api/v1/` namespace |
| T1-B05 | Debug Endpoints | `/api/debug/session` for troubleshooting auth |

### Acceptance Criteria
- [x] User can complete signup flow and land on dashboard
- [x] Organization created automatically on first signup
- [x] User can create Opportunity and see it in list
- [x] All database queries filtered by organization_id (app-level RLS)
- [x] CI/CD runs on push to main (staging deploy deferred)

---

## Sprint 2: Core Generation (Weeks 3-4) ✅ COMPLETE

**Theme:** Build the proposal generation engine

### Goals
- ✅ Implement proposal creation from Opportunity
- ✅ Build Context Assembly Engine (basic version)
- ✅ Implement SSE streaming for generation progress
- ✅ Create proposal viewer UI
- ✅ **Implement LLM Provider abstraction layer**

### User Stories (24 points)

| ID | Story | Points | Status |
|----|-------|--------|--------|
| S2-001 | Enter natural language prompt to generate proposal | 8 | ✅ |
| S2-002 | See real-time progress while proposal generates | 5 | ✅ |
| S2-003 | View generated proposal with slide preview | 5 | ✅ |
| S2-004 | See proposal listed under parent Opportunity | 3 | ✅ |
| S2-005 | Configure LLM provider for organization | 3 | ⏭️ Sprint 3 |

### Technical Tasks (37 points)

> **NOTE**: BedrockProvider and LLM settings moved to Sprint 3.

| ID | Task | Points | Status |
|----|------|--------|--------|
| T2-001 | Implement Proposal entity schema | 3 | ✅ |
| T2-002 | Set up BullMQ + Redis for async jobs | 5 | ✅ |
| T2-003 | Implement LLMProvider interface and factory | 5 | ✅ |
| T2-004 | Implement AnthropicDirectProvider | 5 | ✅ |
| T2-005 | ~~Implement BedrockProvider with streaming~~ | ~~8~~ | ⏭️ Sprint 3 |
| T2-006 | Implement basic Context Assembly Engine | 8 | ✅ |
| T2-007 | Build SSE streaming endpoint | 5 | ✅ |
| T2-008 | Implement slide content generation prompts | 8 | ✅ |
| T2-009 | Build proposal viewer component | 5 | ✅ |
| T2-010 | Implement generation progress UI | 3 | ✅ |
| T2-011 | ~~Add LLM provider selection to org settings~~ | ~~3~~ | ⏭️ Sprint 3 |
| T2-012 | Implement active proposal query logic (most recent) | 2 | ✅ |
| T2-013 | Add version increment on new proposal creation | 1 | ✅ |

### Acceptance Criteria
- [x] User can generate 5-slide proposal from prompt
- [x] SSE streams progress states (understanding → crafting → generating → complete)
- [x] Generated proposal displays in viewer
- [x] Proposal linked to parent Opportunity
- [x] Generation completes in <60 seconds
- [x] **Proposals generate correctly via Anthropic API** (Bedrock in Sprint 3)
- [x] **Most recent proposal is treated as active automatically**
- [x] **New proposals increment version number correctly**

### Key Files Implemented
- `lib/ai/types.ts` - LLM provider type definitions
- `lib/ai/providers/anthropic.ts` - Anthropic Direct provider
- `lib/ai/provider-factory.ts` - Provider selection factory
- `lib/ai/proposal-generator.ts` - Slide generation with streaming
- `lib/ai/context-assembly.ts` - Context Assembly Engine
- `lib/queue/redis.ts` - Redis connection utility
- `lib/queue/proposal-queue.ts` - BullMQ queue and worker
- `scripts/start-worker.ts` - BullMQ worker startup script
- `app/api/v1/proposals/*` - REST API + SSE streaming
- `app/(dashboard)/proposals/page.tsx` - All proposals listing
- `components/proposals/*` - Viewer and progress UI

### UX Testing Results ✅ PASSED
All test cases from `docs/testing/SPRINT_2_UX_TEST_PLAN.md` passed:

| Test Case | Result |
|-----------|--------|
| TC-01: Navigate to Generation | ✅ Pass |
| TC-02: Generation Form | ✅ Pass |
| TC-03: Submit Generation | ✅ Pass |
| TC-04: Progress States | ✅ Pass |
| TC-05: Slide Display | ✅ Pass |
| TC-06: Navigation | ✅ Pass |
| TC-07: Version Increment | ✅ Pass |
| TC-08: Proposals List | ✅ Pass |
| TC-09: Error Handling | ✅ Pass |
| TC-10: Context Assembly | ✅ Pass |
| TC-11: Prompt Display | ✅ Pass |
| TC-12: Concurrent Generation | ✅ Pass |

**Bugs Fixed During Testing:**
- Worker env loading (dynamic import required)
- SSE stream controller closed error
- Pricing hallucination (stricter prompt rules)
- Missing `/proposals` listing page

---

## Sprint 3: Context & Knowledge Base (Weeks 5-6)

**Theme:** Build the knowledge foundation

### Goals
- Implement deal context paste/drag input
- Build knowledge base (products, battlecards)
- Implement RAG indexing and retrieval
- Enhance Context Assembly with KB content
- Add organization business model summary (AI-generated, user-editable)

### User Stories (33 points)

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S3-001 | Paste deal context (emails, notes) before generating | 5 | Eng 2 |
| S3-002 | Add products to knowledge base | 5 | Eng 1 |
| S3-003 | Add competitor battlecards (paste/upload) | 5 | Eng 1 |
| S3-004 | Query knowledge base with natural language | 8 | Eng 1 |
| S3-005 | Proposals include relevant KB content automatically | 5 | Eng 1 |
| S3-006 | Generate and edit organization business model summary | 5 | Eng 2 |

### Technical Tasks (60 points)

> **NOTE**: Includes BedrockProvider tasks moved from Sprint 2. Brand features moved to Sprint 4.

| ID | Task | Points | Owner |
|----|------|--------|-------|
| T3-001 | Implement Deal Context entity schema | 3 | Eng 1 |
| T3-002 | Build deal context input UI (paste/drag) | 5 | Eng 2 |
| T3-003 | Implement Product entity with vector embedding | 5 | Eng 1 |
| T3-004 | Implement Battlecard entity with vector embedding | 5 | Eng 1 |
| T3-005 | Build embedding generation pipeline | 5 | Eng 1 |
| T3-006 | Implement hybrid search (vector + structured) | 8 | Eng 1 |
| T3-007 | Build knowledge base management UI | 5 | Eng 2 |
| T3-008 | Enhance Context Assembly with KB retrieval | 5 | Eng 1 |
| T3-009 | Build conversational KB query interface | 5 | Eng 2 |
| T3-010 | ~~Add brand preview panel to product editor~~ | ~~3~~ | **MOVED TO SPRINT 4** |
| T3-011 | ~~Integrate brand context into Context Assembly Engine~~ | ~~5~~ | **MOVED TO SPRINT 4** |
| T3-012 | ~~Add brand guidelines page to KB section~~ | ~~3~~ | **MOVED TO SPRINT 4** |
| T3-013 | Implement business model generator service (LLM + web search) | 5 | Eng 1 |
| T3-014 | Build business model API endpoints (GET, POST generate, PUT) | 2 | Eng 1 |
| T3-015 | Create company profile page in Knowledge Base | 4 | Eng 2 |
| T3-016 | Integrate business model into context assembly | 3 | Eng 1 |
| T3-017 | **Implement BedrockProvider with streaming** (from Sprint 2) | 8 | Eng 1 |
| T3-018 | **Add LLM provider selection to org settings** (from Sprint 2) | 3 | Eng 2 |

### Acceptance Criteria
- [ ] User can paste deal context and see it reflected in proposal
- [ ] User can add products and battlecards to KB
- [ ] KB content automatically retrieved for relevant proposals
- [ ] User can query KB with natural language and get cited answers
- [ ] Vector search returns relevant results in <2 seconds
- [ ] User can generate business model summary via AI (on-demand)
- [ ] User can edit and save business model summary
- [ ] Business model summary included in all proposal generations when available
- [ ] Company profile accessible from Knowledge Base navigation
- [ ] **Proposals generate correctly via both Anthropic API and AWS Bedrock**
- [ ] **Organization can be configured to use Bedrock provider**

---

## Sprint 4: Pricing Engine + Brand Features (Weeks 7-8)

**Theme:** Build intelligent pricing generation and brand context

> ⚠️ **CRITICAL (from Spike 2):** ALL pricing calculations MUST be programmatic.
> LLM math accuracy is only 60% with drift up to $1,000. The LLM extracts line items
> and quantities; the pricing engine (code) calculates all totals. Never let the LLM
> perform arithmetic on prices.

### Goals
- Implement 4-scenario pricing matrix
- Build pricing confirmation UX
- Implement governance warnings
- Enable quote table paste/upload
- **Implement brand context features** (moved from Sprint 3)

### User Stories (28 points)

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S4-001 | Get auto-calculated pricing for codified products | 5 | Eng 1 |
| S4-002 | See [ENTER VALUE] placeholders for custom pricing | 3 | Eng 1 |
| S4-003 | Confirm/edit pricing in modal before finalizing | 5 | Eng 2 |
| S4-004 | See governance warnings for high discounts | 5 | Eng 1 |
| S4-005 | Paste quote table and use it as-is | 5 | Eng 2 |
| S4-006 | **See brand preview when editing KB content** (from Sprint 3) | 5 | Eng 2 |

### Technical Tasks (50 points)

| ID | Task | Points | Owner |
|----|------|--------|-------|
| T4-001 | Implement pricing tier configuration schema | 3 | Eng 1 |
| T4-002 | Build pricing calculation engine **(PROGRAMMATIC - no LLM math)** | 8 | Eng 1 |
| T4-003 | Implement 4-scenario detection logic | 5 | Eng 1 |
| T4-004 | Build pricing confirmation modal UI | 5 | Eng 2 |
| T4-005 | Implement governance policy engine | 5 | Eng 1 |
| T4-006 | Build governance warning UI components | 3 | Eng 2 |
| T4-007 | Implement quote table paste parser | 5 | Eng 1 |
| T4-008 | Build editable pricing table component | 5 | Eng 2 |
| T4-009 | **Add brand preview panel to product editor** (from Sprint 3) | 3 | Eng 2 |
| T4-010 | **Integrate brand context into Context Assembly Engine** (from Sprint 3) | 5 | Eng 1 |
| T4-011 | **Add brand guidelines page to KB section** (from Sprint 3) | 3 | Eng 2 |

### Acceptance Criteria
- [ ] Codified products auto-calculate with correct math
- [ ] Custom/variable pricing shows clear placeholders
- [ ] Pricing modal allows inline editing
- [ ] Governance warnings appear at correct thresholds (30%, 40%)
- [ ] Pasted quote tables preserve formatting and values
- [ ] **Brand preview visible when creating/editing KB content**
- [ ] **KB content in proposals uses brand colors and voice automatically**
- [ ] **Brand guidelines accessible from KB navigation**

---

## Sprint 5: Strategy & Export (Weeks 9-10)

**Theme:** Complete the value capture loop

### Goals
- Implement automatic strategy extraction
- Build PPTX export with full fidelity
- Build PDF export
- Implement version history

### User Stories (28 points)

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S5-001 | Proposal strategy automatically captured | 5 | Eng 1 |
| S5-002 | Export proposal to PowerPoint (.pptx) | 8 | Eng 2 |
| S5-003 | Export proposal to PDF | 5 | Eng 2 |
| S5-004 | View version history of proposal | 5 | Eng 2 |
| S5-005 | Iterate on proposal with natural language | 5 | Eng 1 |

### Technical Tasks (40 points)

| ID | Task | Points | Owner |
|----|------|--------|-------|
| T5-001 | Implement Strategy Record entity schema | 3 | Eng 1 |
| T5-002 | Build strategy extraction prompts and pipeline | 8 | Eng 1 |
| T5-003 | Implement pptxgenjs rendering engine | 8 | Eng 2 |
| T5-004 | Build all 8 core slide layouts | 8 | Eng 2 |
| T5-005 | Implement PDF generation (via puppeteer) | 5 | Eng 2 |
| T5-006 | Build version history tracking | 5 | Eng 1 |
| T5-007 | Build version history UI | 3 | Eng 2 |
| T5-008 | Implement iteration command processing | 5 | Eng 1 |
| T5-009 | Build proposal version list component | 3 | Eng 2 |
| T5-010 | Add "Create Revision" functionality | 3 | Eng 1 |

### Acceptance Criteria
- [ ] Strategy extracted automatically on proposal completion
- [ ] PPTX export opens correctly in PowerPoint, Google Slides
- [ ] PDF export renders all slides with correct styling
- [ ] User can view version history for an opportunity
- [ ] Active proposal clearly marked in UI
- [ ] User can create new revision from existing proposal
- [ ] Iteration commands modify specific slides

---

## Sprint 6: Resilience (Weeks 11-12)

**Theme:** Build robust user experience

### Goals
- Implement browser-local session persistence
- Build comprehensive error recovery UX
- Add pre-flight validation for context size
- Implement per-slide retry

### User Stories (21 points)

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S6-001 | Draft auto-saves so I never lose work | 5 | Eng 2 |
| S6-002 | Resume draft when I return | 3 | Eng 2 |
| S6-003 | See clear error messages when generation fails | 5 | Eng 2 |
| S6-004 | Retry failed slides without regenerating everything | 5 | Eng 1 |
| S6-005 | Warned if context is too large before generation | 3 | Eng 1 |

### Technical Tasks (31 points)

| ID | Task | Points | Owner |
|----|------|--------|-------|
| T6-001 | Implement localStorage auto-save (30-second interval) | 3 | Eng 2 |
| T6-002 | Build draft resume flow and UI | 5 | Eng 2 |
| T6-003 | Implement comprehensive error state handling | 5 | Eng 1 |
| T6-004 | Build error recovery UI components | 5 | Eng 2 |
| T6-005 | Implement pre-flight context validation | 3 | Eng 1 |
| T6-006 | Build per-slide retry mechanism | 5 | Eng 1 |
| T6-007 | Implement retry with backoff for LLM failures | 3 | Eng 1 |
| T6-008 | Add draft expiration (7-day cleanup) | 2 | Eng 2 |

### Acceptance Criteria
- [ ] Draft saves every 30 seconds without user action
- [ ] User prompted to resume draft on return
- [ ] All error states have clear messages and single action
- [ ] Failed slides can be retried individually
- [ ] Context too large shows actionable guidance

---

## Sprint 7: Polish (Weeks 13-14)

**Theme:** Add differentiation features

### Goals
- Implement Safe Mode toggle
- Enhance battlecard management
- Build Send-as-Link functionality
- **Implement POTX template upload for branding** (if Phase 0 spike successful)
- Polish UI/UX across all flows

### User Stories (26 points)

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S7-001 | Enable Safe Mode to eliminate hallucinations | 3 | Eng 1 |
| S7-002 | Add battlecard content inline during generation | 5 | Eng 2 |
| S7-003 | Generate trackable web link for proposal | 8 | Eng 1 |
| S7-004 | Web link shows beautiful read-only view | 5 | Eng 2 |
| S7-005 | Upload POTX template to automatically extract branding | 5 | Eng 1 |
| S7-006 | All UI interactions feel polished and responsive | 5 | Eng 2 |

### Technical Tasks (38 points)

| ID | Task | Points | Owner |
|----|------|--------|-------|
| T7-001 | Implement Safe Mode system prompt modification | 3 | Eng 1 |
| T7-002 | Build Safe Mode toggle in settings | 2 | Eng 2 |
| T7-003 | Build inline battlecard addition UI | 5 | Eng 2 |
| T7-004 | Implement shareable link generation | 5 | Eng 1 |
| T7-005 | Build public proposal viewer (read-only) | 8 | Eng 2 |
| T7-006 | Implement basic view analytics (open, scroll depth) | 5 | Eng 1 |
| T7-007 | Build POTX upload UI and API endpoint | 3 | Eng 2 |
| T7-008 | Implement POTX parser (extract colors, fonts, logo) | 5 | Eng 1 |
| T7-009 | Integrate extracted branding with proposal generation | 3 | Eng 1 |
| T7-010 | UI polish pass - loading states, transitions | 5 | Eng 2 |
| T7-011 | Accessibility audit and fixes (WCAG 2.1 AA) | 5 | Eng 2 |
| T7-012 | Add opportunity close workflow (won/lost) | 3 | Eng 1 |
| T7-013 | Implement read-only state for closed opportunities | 2 | Eng 1 |

### Acceptance Criteria
- [ ] Safe Mode adds [VERIFY] placeholders instead of uncertain content
- [ ] Inline battlecard content used in generation
- [ ] Shareable link works without authentication
- [ ] Public viewer is mobile-responsive
- [ ] **User can upload POTX template and see extracted branding preview**
- [ ] **Extracted colors, fonts, and logo automatically applied to proposals**
- [ ] **Manual branding configuration remains available as fallback**
- [ ] **User can close opportunity as won or lost**
- [ ] **Closed opportunities prevent new proposal creation**
- [ ] **Proposals in closed opportunities are read-only**
- [ ] All interactive elements keyboard-accessible

---

## Sprint 8: Launch Prep (Weeks 15-16)

**Theme:** Prepare for production launch

### Goals
- Comprehensive QA and bug fixing
- Performance optimization
- Security audit
- Launch infrastructure setup
- Documentation completion

### User Stories (13 points)

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S8-001 | Application performs well under normal load | 5 | Eng 1 |
| S8-002 | Data is secure and isolated | 5 | Eng 1 |
| S8-003 | Can find help documentation when needed | 3 | PM |

### Technical Tasks (55 points)

| ID | Task | Points | Owner |
|----|------|--------|-------|
| T8-001 | Execute full QA test plan | 8 | QA/All |
| T8-002 | Fix P0/P1 bugs from QA | 8 | All |
| T8-003 | Performance profiling and optimization | 5 | Eng 1 |
| T8-004 | Load testing (100 concurrent users) | 3 | Eng 1 |
| T8-005 | Security audit (OWASP top 10) | 5 | Eng 1 |
| T8-006 | Set up production infrastructure | 5 | Eng 1 |
| T8-007 | Configure monitoring and alerting | 3 | Eng 1 |
| T8-008 | Write user documentation | 5 | PM |
| T8-009 | Set up support channels | 2 | PM |
| T8-010 | Create demo environment | 3 | Eng 2 |
| T8-011 | **Implement API rate limiting (Node.js runtime)** | 3 | Eng 1 |
| T8-012 | **Set up application logging (Pino)** | 2 | Eng 1 |
| T8-013 | **Configure APM (OpenTelemetry or Datadog)** | 3 | Eng 1 |

### Launch Checklist

**Infrastructure**
- [ ] Production database provisioned with backups
- [ ] CDN configured for static assets
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Error tracking (Sentry) configured
- [ ] Uptime monitoring configured

**Security**
- [ ] All API endpoints authenticated
- [ ] RLS policies verified
- [ ] Input validation complete
- [ ] XSS prevention verified
- [ ] CSRF protection enabled

**Quality**
- [ ] All P0 bugs resolved
- [ ] Performance targets met (<60s generation, <3s TTI)
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing complete (Chrome, Safari, Firefox, Edge)

**Operations**
- [ ] Runbook documented
- [ ] On-call rotation established
- [ ] Rollback procedure tested
- [ ] Database migration procedure documented

**Launch**
- [ ] Landing page live
- [ ] Analytics configured
- [ ] User documentation published
- [ ] Support email configured
- [ ] Feedback collection mechanism in place

---

## Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R001 | LLM API reliability | Medium | High | Multi-provider fallback, queue retry | Eng 1 |
| R002 | PPTX rendering edge cases | Medium | Medium | Comprehensive layout testing, fallbacks | Eng 2 |
| R003 | Vector search performance | Low | Medium | Index optimization, caching | Eng 1 |
| R004 | User adoption friction | Medium | High | PLG journey spike, continuous UX testing | PM |
| R005 | Scope creep | High | Medium | Strict P0/P1/P2 enforcement | PM |
| R006 | Security vulnerabilities | Low | High | Security audit, penetration testing | Eng 1 |
| R007 | Enterprise data privacy concerns | High | Critical | Bedrock/Vertex options from MVP, clear messaging | PM |
| R008 | Bedrock latency exceeds threshold | Medium | Medium | Performance testing in Spike 4, fallback to direct API | Eng 1 |
| R009 | Provider abstraction complexity | Medium | Medium | Clean interface design, validated in Spike 4 | Eng 1 |
| R010 | Bedrock regional availability | Low | High | Multi-region deployment, document requirements | Eng 1 |

---

## Dependencies & Critical Path

### Phase 0 Dependencies
- **Spike 4 (LLM Data Privacy)** must complete successfully for enterprise viability
- **Spike 1 (Rendering)** must validate pptxgenjs or identify fallback
- **Spike 2 (Context Reasoning)** must achieve >95% accuracy or identify mitigation

### Sprint Dependencies
1. **Sprint 1 → Sprint 2:** Foundation must be complete before generation
2. **Sprint 2 → Sprint 3:** Core generation must work before adding KB context
3. **Sprint 3 → Sprint 4:** KB must exist before pricing can reference products
4. **Sprint 4 → Sprint 5:** Pricing must work before strategy extraction
5. **Sprint 5 → Sprint 6:** Export must work before resilience features
6. **Sprint 6 → Sprint 7:** Resilience must be in place before polish
7. **Sprint 7 → Sprint 8:** All features must be complete before launch prep

---

## Success Metrics

### Phase 0 Success Criteria
- ✅ All 4 spikes pass with Green or Yellow status
- ✅ Architecture decisions documented and approved
- ✅ No blocking technical risks identified

### MVP Launch Success Criteria
- ✅ All P0 features implemented and tested
- ✅ Performance targets met (<60s generation, <3s TTI)
- ✅ Security audit passed
- ✅ Documentation complete
- ✅ Production infrastructure ready

### Post-Launch Metrics (First 30 Days)
- User signups: Target TBD
- Time to first proposal: <10 minutes
- Proposal generation success rate: >95%
- User retention (Day 7): >40%
- NPS score: >50

---

## Next Steps

1. **Review and Approve Plan** — Stakeholder review of this implementation plan
2. **Assemble Team** — Confirm team allocation and availability
3. **Set Up Infrastructure** — Provision dev/staging environments
4. **Kick Off Phase 0** — Begin technical de-risking spikes
5. **Daily Standups** — Start daily sync during Phase 0
6. **Go/No-Go Decision** — Review findings and make decision on Day 8
7. **Begin Sprint 1** — If Go decision, start MVP development

---

## Appendix: Key Technical Decisions

### LLM Provider Architecture
- **Default:** Anthropic Direct API (Free/Pro tiers)
- **Enterprise:** AWS Bedrock option (Team/Enterprise tiers)
- **Future:** Google Vertex AI, BYOL (Phase 3)
- **Embedding Migration:** When switching providers with data sovereignty requirements, embeddings must be re-generated
- **See:** [LLM Provider Architecture](../architecture/LLM_PROVIDER_ARCHITECTURE.md)

### Context Assembly Engine
- **Foundational Context (Never Truncated):**
  - Business Model Summary (~500 tokens)
  - Brand Context (~200 tokens)
- **RAG-Retrieved Context (Token-Budgeted):**
  - Deal Context: 40%
  - Products: 30%
  - Competitive: 20%
  - Playbooks: 10%
- **Truncation Priority:** Playbooks → Competitive → Products → Deal Context
- **See:** [Context Assembly Architecture](../architecture/CONTEXT_ASSEMBLY.md)

### Data Model
- **Opportunity-Centric:** All proposals are children of Opportunities
- **Row-Level Security:** All queries filtered by organization_id
- **Vector Search:** pgvector for semantic search, hybrid with full-text
- **See:** [Database Schema](../architecture/DATABASE_SCHEMA.sql)

### Pricing Engine
- **4-Scenario Matrix:** Fully codified, Partially codified, Opaque/variable, User-provided
- **Never Hallucinate:** Use [ENTER VALUE] placeholders when uncertain
- **Governance:** Configurable warnings and blocks based on discount thresholds

### Export Strategy
- **Primary:** pptxgenjs for PowerPoint generation
- **Fallback:** docxtemplater or puppeteer HTML-to-image if needed
- **PDF:** Puppeteer for PDF generation from rendered slides

### API Design
- **Versioning:** URL-based versioning (`/api/v1/`)
- **Deprecation Policy:** 12-month deprecation period before sunset
- **See:** [API Versioning Strategy](../architecture/API_VERSIONING.md)

### Operations
- **Rate Limiting:** Redis-backed sliding window, per-user/org/IP limits
- **Backups:** Daily full backups, continuous WAL archiving, 7-day PITR
- **Monitoring:** Prometheus metrics, Grafana dashboards, PagerDuty alerting
- **See:**
  - [Rate Limiting](../operations/RATE_LIMITING.md)
  - [Backup Strategy](../operations/BACKUP_STRATEGY.md)
  - [Monitoring](../operations/MONITORING.md)

### Security
- **Secrets:** AWS Secrets Manager with automatic rotation
- **Encryption:** AES-256 at rest, TLS 1.2+ in transit
- **See:** [Secrets Management](../security/SECRETS_MANAGEMENT.md)

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [Spike Findings](../../spikes/SPIKE_FINDINGS.md) | Phase 0 technical validation results |
| [Context Assembly](../architecture/CONTEXT_ASSEMBLY.md) | Token budgets and truncation strategy |
| [LLM Provider Architecture](../architecture/LLM_PROVIDER_ARCHITECTURE.md) | Multi-provider design and embedding migration |
| [API Versioning](../architecture/API_VERSIONING.md) | API versioning and deprecation policy |
| [Rate Limiting](../operations/RATE_LIMITING.md) | Rate limits by plan tier |
| [Backup Strategy](../operations/BACKUP_STRATEGY.md) | Backup and disaster recovery procedures |
| [Monitoring](../operations/MONITORING.md) | Metrics, alerting, and incident response |
| [Secrets Management](../security/SECRETS_MANAGEMENT.md) | Credentials and secrets handling |

---

## Appendix B: Team Capacity Planning

### Assumed Team Structure

| Role | Count | Allocation |
|------|-------|------------|
| Full-stack Engineer | 2 | 100% |
| Designer | 1 | 50% (shared) |
| Product Manager | 1 | 50% (shared) |
| QA | 0.5 | Sprint 8 only |

### Velocity Assumptions

- Sprint length: 2 weeks
- Points per engineer per sprint: 20-25
- Total team capacity per sprint: ~50 points
- Buffer for meetings, reviews: 20%
- Effective capacity: ~40 points/sprint

---

## Appendix C: Definition of Done

A story is considered "Done" when:

1. **Code Complete**: All code written, reviewed, and merged
2. **Tests Passing**: Unit tests written and passing, integration tests where applicable
3. **Documentation**: API docs updated, inline comments for complex logic
4. **Deployed**: Successfully deployed to staging environment
5. **Verified**: QA verification complete (or self-verified for smaller items)
6. **Accepted**: Product owner has accepted the implementation

---

**Document Version:** 1.3
**Last Updated:** December 12, 2025
**Next Review:** End of Sprint 2

