# Deeldesk.ai Sprint Plan
## Phase 0 De-Risking & MVP Development

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Status:** DRAFT  
**Note:** This document contains detailed spike documentation and alternative approaches. For the primary execution plan, see `IMPLEMENTATION_PLAN.md`.  

---

## Executive Summary

This document outlines the sprint-by-sprint development plan for Deeldesk.ai, covering Phase 0 technical de-risking (1.5 weeks) through MVP launch (approximately 16 weeks). The plan follows the feature priorities established in PRD v4.0, with clear dependencies, acceptance criteria, and team allocation guidance.

**Total Timeline:** ~17.5 weeks (Phase 0 + MVP)  
**Team Size Assumption:** 2-3 engineers, 1 designer, 1 PM (part-time)

### Critical Architecture Decision: LLM Data Privacy

A key addition in this version is **Spike 4: LLM Data Privacy Architecture**, which validates our ability to offer enterprise-grade data sovereignty through AWS Bedrock (or Google Vertex AI). This is critical for enterprise adoption where customers cannot send confidential deal data to third-party LLM APIs.

**Target Architecture:**
- **Free/Pro tiers**: Anthropic API (default, lowest latency)
- **Team/Enterprise tiers**: AWS Bedrock option (data stays in customer's cloud region)
- **Enterprise BYOL**: Customer-provided LLM endpoint (Phase 3)

---

## Phase 0: Technical De-Risking

**Duration:** 1.5 Weeks (8 working days)  
**Objective:** Validate highest-risk technical assumptions before committing to full MVP build  
**Go/No-Go Decision:** End of Day 8

### Sprint 0: De-Risking Spikes

| Day | Focus Area | Owner | Deliverable |
|-----|------------|-------|-------------|
| Day 1-2 | Spike 1: Rendering Engine | Eng 1 | Stress test results, fallback assessment |
| Day 1-2 | Spike 2: Context Reasoning | Eng 2 | Accuracy metrics, fallback assessment |
| Day 3 | Spike 3: PLG Journey Simulation | Eng 1 + Designer | Time-to-value measurement |
| Day 4-6 | Spike 4: LLM Data Privacy Architecture | Eng 1 + Eng 2 | Provider abstraction, Bedrock validation |
| Day 7 | Integration & Analysis | All | Combined findings, blockers identified |
| Day 7 | Spike 5: POTX Template Upload (Optional) | Eng 2 | POTX parser validation, Sprint 7 recommendation |
| Day 8 | Go/No-Go Decision | PM + Eng Lead | Technical report, architecture decision |

---

### Spike 1: Rendering Engine ("Slide Breaker")

**Owner:** Engineer 1  
**Duration:** 2 days

#### Tasks

- [ ] **Task 1.1: Environment Setup** (2 hours)
  - Set up pptxgenjs test harness
  - Create test output directory structure
  - Configure logging for detailed error capture

- [ ] **Task 1.2: Layout Stress Test** (4 hours)
  - Create comparison table with 5+ columns, complex row content
  - Test text overflow scenarios (200+ character cells)
  - Test footer overlap with dense content
  - Unicode handling: "ROI: 50% ↑", "€1,500", "¥10,000", "日本語テスト"

- [ ] **Task 1.3: Complex Quote Stress Test** (4 hours)
  - Generate 25-line-item quote table
  - Test grouped headers (Product Category → SKUs)
  - Test $0.00 line items (free add-ons)
  - Test wide text: "Implementation of Phase 2 Data Migration Services"
  - Test decimal precision: $1,234,567.89

- [ ] **Task 1.4: Fallback Path Evaluation** (4 hours)
  - If failures occur, test Fallback A: docxtemplater template injection
  - If Fallback A fails, test Fallback B: puppeteer HTML-to-image
  - Document render quality, editability trade-offs

#### Acceptance Criteria

| Test | Green | Yellow | Red |
|------|-------|--------|-----|
| Layout rendering | All 8 core layouts render correctly | 1-2 layouts need simplification | >2 layouts fail |
| Unicode support | All characters render correctly | Minor font substitution | Characters missing/corrupted |
| Quote tables | 25 items render, math correct | Minor alignment issues | Overflow/truncation |

#### Deliverables

- [ ] Test execution log with screenshots
- [ ] Generated .pptx artifacts (pass/fail samples)
- [ ] Fallback recommendation (if needed)
- [ ] Risk assessment document

---

### Spike 2: Context Window Reasoning

**Owner:** Engineer 2  
**Duration:** 2 days

#### Tasks

- [ ] **Task 2.1: Test Data Preparation** (2 hours)
  - Create 1,500-word battlecard with buried competitive fact
  - Create 1,000-word product spec with buried requirement
  - Create 5 simulated email threads with buried budget ($50,000)
  - Create quote document with exact total: $151,200

- [ ] **Task 2.2: Needle in Haystack Test** (4 hours)
  - Assemble full context (3,500+ tokens)
  - Prompt: "Write a pricing bullet that addresses the customer's budget constraint and highlights our advantage over Competitor X's security weakness"
  - Run 10 iterations, measure consistency
  - Success: Mentions Enterprise Tier, references $50k budget, mentions SSO advantage

- [ ] **Task 2.3: Math Integrity Test** (3 hours)
  - Context: Quote total $151,200 (no line-item breakdown)
  - Prompt: "Write an executive summary highlighting the investment"
  - Success: States "$151,200" exactly
  - Failure: Approximates ("~$150k", "about $150,000")
  - Run 10 iterations, measure drift rate

- [ ] **Task 2.4: Currency Consistency Test** (3 hours)
  - Context: Customer budget "£50,000", quote in USD
  - Prompt: "Generate pricing summary"
  - Expected: AI flags currency mismatch OR asks for conversion rate
  - Failure: Hallucinates conversion (e.g., assumes £1 = $1.25)

- [ ] **Task 2.5: Fallback Evaluation** (4 hours)
  - If accuracy <95%, test Map-Reduce approach (two-pass extraction)
  - If Map-Reduce insufficient, test Tool Use (structured get_quote_total function)
  - Measure latency impact of fallbacks

#### Acceptance Criteria

| Test | Green | Yellow | Red |
|------|-------|--------|-----|
| Fact retrieval | >95% accuracy across 10 runs | 90-95% accuracy | <90% accuracy |
| Math integrity | 0% drift (exact numbers always) | 1-5% drift with pattern | >5% drift |
| Currency handling | Always flags mismatch | Sometimes flags | Hallucinates conversion |

#### Deliverables

- [ ] Test execution log with prompts and responses
- [ ] Accuracy metrics spreadsheet
- [ ] Fallback recommendation (if needed)
- [ ] Prompt engineering recommendations

---

### Spike 3: PLG User Journey Simulation

**Owner:** Engineer 1 + Designer  
**Duration:** 1 day

#### Tasks

- [ ] **Task 3.1: Scenario A - Cold Start** (2 hours)
  - Simulate new user with zero prior content
  - Measure time from "signup" to first generated proposal
  - Identify friction points in onboarding
  - Target: <10 minutes

- [ ] **Task 3.2: Scenario B - Minimal Setup** (2 hours)
  - User uploads one battlecard + one product document
  - Measure ingestion time + first proposal time
  - Validate KB content appears in generated proposal
  - Target: <10 minutes total

- [ ] **Task 3.3: Scenario C - Deal Context Paste** (2 hours)
  - User pastes 500-word email thread as deal context
  - Measure context parsing + proposal generation
  - Validate deal-specific details appear in proposal
  - Target: <10 minutes total

- [ ] **Task 3.4: "Aha Moment" Analysis** (2 hours)
  - Document where users would experience value
  - Identify potential drop-off points
  - Recommend onboarding optimizations

#### Acceptance Criteria

| Scenario | Green | Yellow | Red |
|----------|-------|--------|-----|
| Cold start | <10 min to first proposal | 10-12 min | >12 min |
| Minimal setup | <10 min including upload | 10-12 min | >12 min |
| Deal context | <10 min with context integration | 10-12 min | >12 min |

#### Deliverables

- [ ] User journey timeline for each scenario
- [ ] Friction point documentation
- [ ] Onboarding improvement recommendations
- [ ] "Aha moment" analysis

---

### Spike 4: LLM Data Privacy Architecture (NEW)

**Owner:** Engineer 1 + Engineer 2  
**Duration:** 3 days  
**Priority:** CRITICAL — This spike determines enterprise adoption viability

#### Background

Enterprise sales professionals often work at companies with strict data policies that prohibit sending confidential deal information to third-party LLM APIs. This spike validates our ability to offer data sovereignty options that keep customer data within their cloud environment.

#### Provider Options Under Evaluation

| Provider | Claude Available | Data Residency | Compliance |
|----------|-----------------|----------------|------------|
| Anthropic API (Direct) | Yes | Anthropic servers | SOC 2 Type II |
| AWS Bedrock | Yes (Claude 3.5) | Customer AWS VPC | HIPAA, SOC2, FedRAMP |
| Google Vertex AI | Yes (Claude 3.5) | Customer GCP project | HIPAA, SOC2, FedRAMP |

#### Tasks

- [ ] **Task 4.1: AWS Bedrock Setup** (4 hours)
  - Provision AWS Bedrock in test AWS account
  - Request Claude 3.5 Sonnet model access
  - Configure IAM roles and permissions
  - Verify model availability and quotas
  - Document setup steps for future deployments

- [ ] **Task 4.2: Provider Abstraction Layer Design** (4 hours)
  - Design `LLMProvider` interface supporting:
    - `generateCompletion(prompt, options) → Response`
    - `streamCompletion(prompt, options) → AsyncGenerator<StreamEvent>`
    - `generateEmbedding(text) → Vector`
  - Define provider configuration schema
  - Design provider selection logic (org settings → provider)
  - Plan for graceful fallback if primary provider unavailable

- [ ] **Task 4.3: Bedrock Integration Implementation** (6 hours)
  - Implement `BedrockProvider` class
  - Implement streaming support (Bedrock uses different streaming format)
  - Handle Bedrock-specific error codes and retry logic
  - Implement request/response mapping to unified format

- [ ] **Task 4.4: Anthropic Direct Implementation** (3 hours)
  - Implement `AnthropicDirectProvider` class
  - Ensure feature parity with Bedrock implementation
  - Implement streaming support
  - Add as default provider

- [ ] **Task 4.5: Performance Benchmarking** (4 hours)
  - Test identical prompts across both providers
  - Measure metrics:
    - Time to first token (TTFT)
    - Total generation time
    - Tokens per second throughput
    - Error rates under load
  - Test with realistic context sizes (8K, 16K, 32K tokens)
  - Document latency delta (expected: 10-20% slower for Bedrock)

- [ ] **Task 4.6: Cost Analysis** (2 hours)
  - Calculate cost per proposal for each provider
  - Model monthly costs at 1K, 10K, 100K proposals
  - Factor in Bedrock infrastructure costs
  - Create pricing recommendation for Data Sovereignty add-on

- [ ] **Task 4.7: Embedding Provider Evaluation** (3 hours)
  - Test OpenAI embeddings vs. Bedrock Titan embeddings
  - Compare embedding quality (similarity search accuracy)
  - Measure latency differences
  - Recommend default embedding provider per LLM provider

#### Acceptance Criteria

| Test | Green | Yellow | Red |
|------|-------|--------|-----|
| Bedrock integration | Full feature parity with direct API | Minor feature gaps, workarounds exist | Streaming broken or major gaps |
| Latency overhead | <15% slower than direct | 15-25% slower | >25% slower |
| Streaming support | Smooth streaming, <2s TTFT | Minor stuttering, <3s TTFT | Broken or >5s TTFT |
| Error handling | Graceful fallback works | Manual intervention needed | Cascading failures |
| Cost delta | <20% more expensive | 20-40% more expensive | >40% more expensive |

#### Deliverables

- [ ] `LLMProvider` interface specification
- [ ] Working `AnthropicDirectProvider` implementation
- [ ] Working `BedrockProvider` implementation
- [ ] Performance benchmark report with charts
- [ ] Cost analysis spreadsheet
- [ ] Architecture decision document
- [ ] Updated CLAUDE.md with provider patterns

#### Go/No-Go Criteria for Multi-Provider MVP

| Outcome | Decision |
|---------|----------|
| All Green | Ship MVP with both providers, Bedrock as Team/Enterprise option |
| 1-2 Yellow | Ship MVP with Anthropic default, Bedrock in Sprint 3 fast-follow |
| Any Red | Investigate root cause, consider Vertex AI as alternative |

---

### Day 7: Integration & Analysis

**All Team Members**

#### Tasks

- [ ] Aggregate findings from all four spikes
- [ ] Identify cross-cutting concerns
- [ ] Document any blockers or dependencies
- [ ] Finalize LLM provider recommendation
- [ ] Prepare Go/No-Go recommendation
- [ ] Draft architecture decision document

---

### Spike 5: POTX Template Upload Validation (Optional)

**Owner:** Engineer 2  
**Duration:** 1 day (if time permits, otherwise defer to Sprint 7)  
**Priority:** Nice-to-have for MVP, valuable for onboarding

#### Background

Users often have existing PowerPoint templates (.potx files) with corporate branding. Validating if we can extract branding automatically would significantly improve onboarding experience.

#### Tasks

- [ ] **Task 5.1: Set Up POTX Parser** (2 hours)
  - Install jszip and fast-xml-parser libraries
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

#### Acceptance Criteria

| Test | Green (Go) | Yellow (Proceed w/ Caution) | Red (No-Go) |
|------|------------|----------------------------|-------------|
| Color extraction | >90% accuracy across templates | 70-90% accuracy | <70% accuracy |
| Font extraction | >95% accuracy | 80-95% accuracy | <80% accuracy |
| Logo extraction | Works for 80%+ templates | Works for 50-80% | <50% success |
| Mapping to pptxgenjs | Full compatibility | Minor adjustments needed | Major incompatibilities |

#### Deliverables

- [ ] POTX parser proof-of-concept
- [ ] Test results with sample templates
- [ ] Implementation estimate for Sprint 7
- [ ] Recommendation: Include in Sprint 7 or defer to Phase 2

#### Decision Criteria

- **Green:** Include POTX upload in Sprint 7 (5 days estimated)
- **Yellow:** Include with manual fallback option
- **Red:** Defer to Phase 2, stick with manual configuration

---

### Day 8: Go/No-Go Decision

**PM + Engineering Lead**

#### Go/No-Go Decision Matrix

| Spike | Green (Go) | Yellow (Proceed w/ Caution) | Red (No-Go) |
|-------|------------|----------------------------|-------------|
| Rendering | All core layouts pass | Minor fallbacks needed | Major layouts fail |
| Context Reasoning | 0% math drift, >95% retrieval | 5-10% issues w/ mitigation | >10% issues |
| PLG Journey | <10 min all scenarios | 10-15 min w/ clear fixes | >15 min |
| LLM Data Privacy | Full Bedrock parity, <15% latency | Minor gaps, 15-25% latency | Major gaps or >25% latency |

#### Architecture Decision Options

- **Option A: Native Generation + Full Context + Multi-Provider** — Proceed if all spikes Green
- **Option B: Template Injection + Map-Reduce + Anthropic Only** — If Rendering Yellow, Context Yellow, defer Bedrock
- **Option C: Hybrid Approach + Deferred Data Sovereignty** — Native text + image tables, Bedrock in Phase 2

#### Deliverables

- [ ] Final Go/No-Go Technical Report
- [ ] Architecture recommendation document
- [ ] Updated risk register
- [ ] MVP sprint plan adjustments (if needed)

---

## MVP Development: Sprints 1-8

**Duration:** 16 weeks (8 two-week sprints)  
**Objective:** Launch PLG product with P0 and P1 features

### Sprint Overview

| Sprint | Weeks | Focus | Key Deliverables |
|--------|-------|-------|------------------|
| Sprint 1 | 1-2 | Foundation | Data model, auth, basic UI shell |
| Sprint 2 | 3-4 | Core Generation | Proposal creation, SSE streaming, **LLM provider abstraction** |
| Sprint 3 | 5-6 | Context & KB | Deal context, knowledge base, RAG |
| Sprint 4 | 7-8 | Pricing Engine | 4-scenario pricing, governance |
| Sprint 5 | 9-10 | Strategy & Export | Strategy extraction, PPTX/PDF export |
| Sprint 6 | 11-12 | Resilience | Session persistence, error recovery |
| Sprint 7 | 13-14 | Polish | Safe Mode, battlecards, Send-as-Link |
| Sprint 8 | 15-16 | Launch Prep | QA, performance, launch readiness |

---

### Sprint 1: Foundation

**Weeks 1-2**  
**Theme:** Build the architectural foundation

#### Goals

- Establish Opportunity-centric data model
- Implement authentication and organization setup
- Create basic UI shell and navigation
- Set up CI/CD pipeline

#### User Stories

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S1-001 | As a user, I can sign up with email/password or Google OAuth | 5 | Eng 1 |
| S1-002 | As a user, I can create and name my organization | 3 | Eng 1 |
| S1-003 | As a user, I can see a dashboard with empty state | 3 | Eng 2 |
| S1-004 | As a user, I can create a new Opportunity with name and description | 5 | Eng 2 |
| S1-005 | As a user, I can view list of my Opportunities | 3 | Eng 2 |

#### Technical Tasks

| ID | Task | Points | Owner |
|----|------|--------|-------|
| T1-001 | Set up Next.js 14 project with App Router | 2 | Eng 1 |
| T1-002 | Configure PostgreSQL with pgvector extension | 3 | Eng 1 |
| T1-003 | Implement Organization entity with RLS | 5 | Eng 1 |
| T1-004 | Implement Opportunity entity schema | 3 | Eng 2 |
| T1-005 | Implement User entity with org membership | 3 | Eng 1 |
| T1-006 | Set up authentication (NextAuth.js) | 5 | Eng 1 |
| T1-007 | Create UI component library foundation | 5 | Eng 2 |
| T1-008 | Set up CI/CD with GitHub Actions | 3 | Eng 1 |
| T1-009 | Configure staging environment | 2 | Eng 1 |

#### Acceptance Criteria

- [ ] User can complete signup flow and land on dashboard
- [ ] Organization created automatically on first signup
- [ ] User can create Opportunity and see it in list
- [ ] All database tables have RLS policies
- [ ] CI/CD deploys to staging on merge to main

#### Sprint Risks

| Risk | Mitigation |
|------|------------|
| Auth complexity | Use NextAuth.js with proven patterns |
| RLS performance | Test with 1000+ rows early |

---

### Sprint 2: Core Generation

**Weeks 3-4**  
**Theme:** Build the proposal generation engine

#### Goals

- Implement proposal creation from Opportunity
- Build Context Assembly Engine (basic version)
- Implement SSE streaming for generation progress
- Create proposal viewer UI
- **Implement LLM Provider abstraction layer (multi-provider support)**

#### User Stories

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S2-001 | As a user, I can enter a natural language prompt to generate a proposal | 8 | Eng 1 |
| S2-002 | As a user, I can see real-time progress while my proposal generates | 5 | Eng 2 |
| S2-003 | As a user, I can view my generated proposal with slide preview | 5 | Eng 2 |
| S2-004 | As a user, I can see my proposal listed under its parent Opportunity | 3 | Eng 2 |
| S2-005 | As an admin, I can configure which LLM provider my organization uses | 3 | Eng 1 |

#### Technical Tasks

| ID | Task | Points | Owner |
|----|------|--------|-------|
| T2-001 | Implement Proposal entity schema | 3 | Eng 1 |
| T2-002 | Set up BullMQ + Redis for async jobs | 5 | Eng 1 |
| T2-003 | Implement LLMProvider interface and factory | 5 | Eng 1 |
| T2-004 | Implement AnthropicDirectProvider | 5 | Eng 1 |
| T2-005 | Implement BedrockProvider with streaming | 8 | Eng 1 |
| T2-006 | Implement basic Context Assembly Engine | 8 | Eng 1 |
| T2-007 | Build SSE streaming endpoint | 5 | Eng 2 |
| T2-008 | Implement slide content generation prompts | 8 | Eng 1 |
| T2-009 | Build proposal viewer component | 5 | Eng 2 |
| T2-010 | Implement generation progress UI | 3 | Eng 2 |
| T2-011 | Add LLM provider selection to org settings | 3 | Eng 2 |

#### Acceptance Criteria

- [ ] User can generate 5-slide proposal from prompt
- [ ] SSE streams progress states (understanding → crafting → generating → complete)
- [ ] Generated proposal displays in viewer
- [ ] Proposal linked to parent Opportunity
- [ ] Generation completes in <60 seconds
- [ ] **Proposals generate correctly via both Anthropic API and AWS Bedrock**
- [ ] **Organization can be configured to use Bedrock provider**

#### Sprint Risks

| Risk | Mitigation |
|------|------------|
| LLM latency | Implement streaming from first token |
| SSE reliability | Add heartbeat, reconnection logic |
| Bedrock streaming differences | Validated in Phase 0 Spike 4 |
| Provider failover | Implement graceful degradation with user notification |

---

### Sprint 3: Context & Knowledge Base

**Weeks 5-6**  
**Theme:** Build the knowledge foundation

#### Goals

- Implement deal context paste/drag input
- Build knowledge base (products, battlecards)
- Implement RAG indexing and retrieval
- Enhance Context Assembly with KB content

#### User Stories

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S3-001 | As a user, I can paste deal context (emails, notes) before generating | 5 | Eng 2 |
| S3-002 | As a user, I can add products to my knowledge base | 5 | Eng 1 |
| S3-003 | As a user, I can add competitor battlecards (paste/upload) | 5 | Eng 1 |
| S3-004 | As a user, I can query my knowledge base with natural language | 8 | Eng 1 |
| S3-005 | As a user, my proposals include relevant KB content automatically | 5 | Eng 1 |

#### Technical Tasks

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

#### Acceptance Criteria

- [ ] User can paste deal context and see it reflected in proposal
- [ ] User can add products and battlecards to KB
- [ ] KB content is automatically retrieved for relevant proposals
- [ ] User can query KB with natural language and get cited answers
- [ ] Vector search returns relevant results in <2 seconds

#### Sprint Risks

| Risk | Mitigation |
|------|------------|
| Embedding quality | Use OpenAI text-embedding-3-small, validate with test set |
| Retrieval relevance | Implement reranking, tune chunk size |

---

### Sprint 4: Pricing Engine

**Weeks 7-8**  
**Theme:** Build intelligent pricing generation

#### Goals

- Implement 4-scenario pricing matrix
- Build pricing confirmation UX
- Implement governance warnings
- Enable quote table paste/upload

#### User Stories

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S4-001 | As a user, I get auto-calculated pricing for codified products | 5 | Eng 1 |
| S4-002 | As a user, I see [ENTER VALUE] placeholders for custom pricing | 3 | Eng 1 |
| S4-003 | As a user, I can confirm/edit pricing in a modal before finalizing | 5 | Eng 2 |
| S4-004 | As a user, I see governance warnings for high discounts | 5 | Eng 1 |
| S4-005 | As a user, I can paste my quote table and use it as-is | 5 | Eng 2 |

#### Technical Tasks

| ID | Task | Points | Owner |
|----|------|--------|-------|
| T4-001 | Implement pricing tier configuration schema | 3 | Eng 1 |
| T4-002 | Build pricing calculation engine | 8 | Eng 1 |
| T4-003 | Implement 4-scenario detection logic | 5 | Eng 1 |
| T4-004 | Build pricing confirmation modal UI | 5 | Eng 2 |
| T4-005 | Implement governance policy engine | 5 | Eng 1 |
| T4-006 | Build governance warning UI components | 3 | Eng 2 |
| T4-007 | Implement quote table paste parser | 5 | Eng 1 |
| T4-008 | Build editable pricing table component | 5 | Eng 2 |

#### Acceptance Criteria

- [ ] Codified products auto-calculate with correct math
- [ ] Custom/variable pricing shows clear placeholders
- [ ] Pricing modal allows inline editing
- [ ] Governance warnings appear at correct thresholds (30%, 40%)
- [ ] Pasted quote tables preserve formatting and values

#### Sprint Risks

| Risk | Mitigation |
|------|------------|
| Math precision | Use decimal.js, never floats for currency |
| Paste parsing | Support common formats (Excel, CSV, plain text) |

---

### Sprint 5: Strategy & Export

**Weeks 9-10**  
**Theme:** Complete the value capture loop

#### Goals

- Implement automatic strategy extraction
- Build PPTX export with full fidelity
- Build PDF export
- Implement version history

#### User Stories

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S5-001 | As a user, my proposal strategy is automatically captured | 5 | Eng 1 |
| S5-002 | As a user, I can export my proposal to PowerPoint (.pptx) | 8 | Eng 2 |
| S5-003 | As a user, I can export my proposal to PDF | 5 | Eng 2 |
| S5-004 | As a user, I can view version history of my proposal | 5 | Eng 2 |
| S5-005 | As a user, I can iterate on my proposal with natural language | 5 | Eng 1 |

#### Technical Tasks

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

#### Acceptance Criteria

- [ ] Strategy extracted automatically on proposal completion
- [ ] PPTX export opens correctly in PowerPoint, Google Slides
- [ ] PDF export renders all slides with correct styling
- [ ] User can view and compare versions
- [ ] Iteration commands modify specific slides

#### Sprint Risks

| Risk | Mitigation |
|------|------------|
| PPTX compatibility | Test on PowerPoint, Google Slides, Keynote |
| Strategy extraction accuracy | Use structured output, validate with golden set |

---

### Sprint 6: Resilience

**Weeks 11-12**  
**Theme:** Build robust user experience

#### Goals

- Implement browser-local session persistence
- Build comprehensive error recovery UX
- Add pre-flight validation for context size
- Implement per-slide retry

#### User Stories

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S6-001 | As a user, my draft auto-saves so I never lose work | 5 | Eng 2 |
| S6-002 | As a user, I can resume my draft when I return | 3 | Eng 2 |
| S6-003 | As a user, I see clear error messages when generation fails | 5 | Eng 2 |
| S6-004 | As a user, I can retry failed slides without regenerating everything | 5 | Eng 1 |
| S6-005 | As a user, I'm warned if my context is too large before generation | 3 | Eng 1 |

#### Technical Tasks

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

#### Acceptance Criteria

- [ ] Draft saves every 30 seconds without user action
- [ ] User prompted to resume draft on return
- [ ] All error states have clear messages and single action
- [ ] Failed slides can be retried individually
- [ ] Context too large shows actionable guidance

#### Sprint Risks

| Risk | Mitigation |
|------|------------|
| localStorage limits | Store metadata only, not rendered output |
| Error state complexity | Create exhaustive error state map |

---

### Sprint 7: Polish

**Weeks 13-14**  
**Theme:** Add differentiation features

#### Goals

- Implement Safe Mode toggle
- Enhance battlecard management
- Build Send-as-Link functionality
- **Implement POTX template upload for branding** (if Phase 0 Spike 5 successful)
- Polish UI/UX across all flows

#### User Stories

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S7-001 | As a user, I can enable Safe Mode to eliminate hallucinations | 3 | Eng 1 |
| S7-002 | As a user, I can add battlecard content inline during generation | 5 | Eng 2 |
| S7-003 | As a user, I can generate a trackable web link for my proposal | 8 | Eng 1 |
| S7-004 | As a user, the web link shows a beautiful read-only view | 5 | Eng 2 |
| S7-005 | As a user, I can upload a POTX template to automatically extract branding | 5 | Eng 1 |
| S7-006 | As a user, all UI interactions feel polished and responsive | 5 | Eng 2 |

#### Technical Tasks

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

#### Acceptance Criteria

- [ ] Safe Mode adds [VERIFY] placeholders instead of uncertain content
- [ ] Inline battlecard content used in generation
- [ ] Shareable link works without authentication
- [ ] Public viewer is mobile-responsive
- [ ] **User can upload POTX template and see extracted branding preview**
- [ ] **Extracted colors, fonts, and logo automatically applied to proposals**
- [ ] **Manual branding configuration remains available as fallback**
- [ ] All interactive elements keyboard-accessible

#### Sprint Risks

| Risk | Mitigation |
|------|------------|
| Safe Mode effectiveness | Test with adversarial prompts |
| Public viewer security | Ensure no data leakage, rate limiting |

---

### Sprint 8: Launch Prep

**Weeks 15-16**  
**Theme:** Prepare for production launch

#### Goals

- Comprehensive QA and bug fixing
- Performance optimization
- Security audit
- Launch infrastructure setup
- Documentation completion

#### User Stories

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S8-001 | As a user, the application performs well under normal load | 5 | Eng 1 |
| S8-002 | As a user, my data is secure and isolated | 5 | Eng 1 |
| S8-003 | As a user, I can find help documentation when needed | 3 | PM |

#### Technical Tasks

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

#### Launch Checklist

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

## Post-MVP: Phase 2 Preview

The following features are prioritized for Phase 2 (Sprints 9-12):

| Priority | Feature | Sprint Target |
|----------|---------|---------------|
| P2-001 | Win Theme Slide Auto-Generator | Sprint 9 |
| P2-002 | Template Gallery (5 verticals) | Sprint 9 |
| P2-003 | Personal Pattern Feedback Loop | Sprint 10 |
| P2-004 | Server-side draft sync | Sprint 10 |
| P2-005 | Structured battlecard extraction | Sprint 11 |
| P2-006 | CRM integration (Salesforce) | Sprint 11-12 |
| P2-007 | Mobile-optimized editing | Sprint 12 |

---

## Appendix A: Team Capacity Planning

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

## Appendix B: Risk Register

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

## Appendix C: Definition of Done

A story is considered "Done" when:

1. **Code Complete**: All code written, reviewed, and merged
2. **Tests Passing**: Unit tests written and passing, integration tests where applicable
3. **Documentation**: API docs updated, inline comments for complex logic
4. **Deployed**: Successfully deployed to staging environment
5. **Verified**: QA verification complete (or self-verified for smaller items)
6. **Accepted**: Product owner has accepted the implementation

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | PM | Initial sprint plan based on PRD v4.0 |

---

*This document should be reviewed and updated at the start of each sprint during sprint planning.*
