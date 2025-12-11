# Deeldesk.ai Implementation Plan

**Based on:** Sprint Plan Phase 0 MVP v1.0  
**Created:** December 2025  
**Status:** Ready for Execution  
**Note:** This is the primary execution plan. See `SPRINT_PLAN.md` for detailed spike documentation and alternative approaches.

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

#### Spike 1: Rendering Engine ("Slide Breaker")
**Owner:** Engineer 1  
**Duration:** 2 days

**Tasks:**
- [ ] Set up pptxgenjs test harness
- [ ] Test 8 core slide layouts with complex content
- [ ] Stress test quote tables (25+ line items)
- [ ] Test Unicode handling (€, ¥, 日本語)
- [ ] Evaluate fallback options if needed

**Acceptance Criteria:**
- ✅ All 8 core layouts render correctly
- ✅ Unicode characters render properly
- ✅ 25-item quote tables render with correct math

**Deliverables:**
- Test execution log with screenshots
- Generated .pptx artifacts
- Fallback recommendation (if needed)

---

#### Spike 2: Context Window Reasoning
**Owner:** Engineer 2  
**Duration:** 2 days

**Tasks:**
- [ ] Create test data (1,500-word battlecard, buried facts)
- [ ] Run "needle in haystack" tests (10 iterations)
- [ ] Test math integrity (exact number preservation)
- [ ] Test currency consistency handling
- [ ] Evaluate fallback approaches if accuracy <95%

**Acceptance Criteria:**
- ✅ >95% fact retrieval accuracy
- ✅ 0% math drift (exact numbers always)
- ✅ Currency mismatches always flagged

**Deliverables:**
- Test execution log with prompts/responses
- Accuracy metrics spreadsheet
- Prompt engineering recommendations

---

#### Spike 3: PLG User Journey Simulation
**Owner:** Engineer 1 + Designer  
**Duration:** 1 day

**Tasks:**
- [ ] Simulate cold start scenario (<10 min target)
- [ ] Simulate minimal setup (1 battlecard + 1 product)
- [ ] Simulate deal context paste (500-word email)
- [ ] Document "aha moment" and friction points

**Acceptance Criteria:**
- ✅ All scenarios complete in <10 minutes
- ✅ Clear friction point documentation
- ✅ Onboarding improvement recommendations

**Deliverables:**
- User journey timelines
- Friction point analysis
- Onboarding optimization recommendations

---

#### Spike 4: LLM Data Privacy Architecture ⚠️ CRITICAL
**Owner:** Engineer 1 + Engineer 2  
**Duration:** 3 days  
**Priority:** CRITICAL — Determines enterprise adoption viability

**Background:** Enterprise customers require data sovereignty options where deal data never leaves their cloud environment.

**Tasks:**
- [ ] Set up AWS Bedrock in test account
- [ ] Design LLMProvider abstraction interface
- [ ] Implement BedrockProvider with streaming
- [ ] Implement AnthropicDirectProvider (default)
- [ ] Benchmark performance (latency, throughput)
- [ ] Analyze cost differences
- [ ] Evaluate embedding providers (OpenAI vs Bedrock Titan)

**Acceptance Criteria:**
- ✅ Full feature parity between providers
- ✅ <15% latency overhead for Bedrock
- ✅ Smooth streaming (<2s TTFT)
- ✅ Graceful fallback on errors

**Deliverables:**
- `LLMProvider` interface specification
- Working provider implementations
- Performance benchmark report
- Cost analysis spreadsheet
- Architecture decision document

**Go/No-Go Criteria:**
- **All Green:** Ship MVP with both providers
- **1-2 Yellow:** Ship MVP with Anthropic default, Bedrock in Sprint 3
- **Any Red:** Investigate root cause, consider Vertex AI alternative

---

### Day 7-8: Integration & Go/No-Go Decision

**Tasks:**
- [ ] Aggregate findings from all spikes
- [ ] Identify cross-cutting concerns
- [ ] Document blockers/dependencies
- [ ] Finalize LLM provider recommendation
- [ ] Prepare Go/No-Go recommendation

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

## Sprint 1: Foundation (Weeks 1-2)

**Theme:** Build the architectural foundation

### Goals
- Establish Opportunity-centric data model
- Implement authentication and organization setup
- Create basic UI shell and navigation
- Set up CI/CD pipeline

### User Stories (19 points)

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S1-001 | Sign up with email/password or Google OAuth | 5 | Eng 1 |
| S1-002 | Create and name organization | 3 | Eng 1 |
| S1-003 | See dashboard with empty state | 3 | Eng 2 |
| S1-004 | Create new Opportunity with name/description | 5 | Eng 2 |
| S1-005 | View list of Opportunities | 3 | Eng 2 |

### Technical Tasks (31 points)

| ID | Task | Points | Owner |
|----|------|--------|-------|
| T1-001 | Set up Next.js 14 project with App Router | 2 | Eng 1 |
| T1-002 | Configure PostgreSQL with pgvector | 3 | Eng 1 |
| T1-003 | Implement Organization entity with RLS | 5 | Eng 1 |
| T1-004 | Implement Opportunity entity schema | 3 | Eng 2 |
| T1-005 | Implement User entity with org membership | 3 | Eng 1 |
| T1-006 | Set up authentication (NextAuth.js) | 5 | Eng 1 |
| T1-007 | Create UI component library foundation | 5 | Eng 2 |
| T1-008 | Set up CI/CD with GitHub Actions | 3 | Eng 1 |
| T1-009 | Configure staging environment | 2 | Eng 1 |
| T1-010 | Add closed_at handling to Opportunity model | 1 | Eng 1 |

### Acceptance Criteria
- [ ] User can complete signup flow and land on dashboard
- [ ] Organization created automatically on first signup
- [ ] User can create Opportunity and see it in list
- [ ] All database tables have RLS policies
- [ ] CI/CD deploys to staging on merge to main

---

## Sprint 2: Core Generation (Weeks 3-4)

**Theme:** Build the proposal generation engine

### Goals
- Implement proposal creation from Opportunity
- Build Context Assembly Engine (basic version)
- Implement SSE streaming for generation progress
- Create proposal viewer UI
- **Implement LLM Provider abstraction layer**

### User Stories (24 points)

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S2-001 | Enter natural language prompt to generate proposal | 8 | Eng 1 |
| S2-002 | See real-time progress while proposal generates | 5 | Eng 2 |
| S2-003 | View generated proposal with slide preview | 5 | Eng 2 |
| S2-004 | See proposal listed under parent Opportunity | 3 | Eng 2 |
| S2-005 | Configure LLM provider for organization | 3 | Eng 1 |

### Technical Tasks (45 points)

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
| T2-012 | Implement active proposal query logic (most recent) | 2 | Eng 1 |
| T2-013 | Add version increment on new proposal creation | 1 | Eng 1 |

### Acceptance Criteria
- [ ] User can generate 5-slide proposal from prompt
- [ ] SSE streams progress states (understanding → crafting → generating → complete)
- [ ] Generated proposal displays in viewer
- [ ] Proposal linked to parent Opportunity
- [ ] Generation completes in <60 seconds
- [ ] **Proposals generate correctly via both Anthropic API and AWS Bedrock**
- [ ] **Organization can be configured to use Bedrock provider**
- [ ] **Most recent proposal is treated as active automatically**
- [ ] **New proposals increment version number correctly**

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
| T3-010 | Add brand preview panel to product editor | 3 | Eng 2 |
| T3-011 | Integrate brand context into Context Assembly Engine | 5 | Eng 1 |
| T3-012 | Add brand guidelines page to KB section | 3 | Eng 2 |
| T3-013 | Implement business model generator service (LLM + web search) | 5 | Eng 1 |
| T3-014 | Build business model API endpoints (GET, POST generate, PUT) | 2 | Eng 1 |
| T3-015 | Create company profile page in Knowledge Base | 4 | Eng 2 |
| T3-016 | Integrate business model into context assembly | 3 | Eng 1 |

### Acceptance Criteria
- [ ] User can paste deal context and see it reflected in proposal
- [ ] User can add products and battlecards to KB
- [ ] KB content automatically retrieved for relevant proposals
- [ ] User can query KB with natural language and get cited answers
- [ ] Vector search returns relevant results in <2 seconds
- [ ] Brand preview visible when creating/editing KB content
- [ ] KB content in proposals uses brand colors and voice automatically
- [ ] Brand guidelines accessible from KB navigation
- [ ] User can generate business model summary via AI (on-demand)
- [ ] User can edit and save business model summary
- [ ] Business model summary included in all proposal generations when available
- [ ] Company profile accessible from Knowledge Base navigation

---

## Sprint 4: Pricing Engine (Weeks 7-8)

**Theme:** Build intelligent pricing generation

### Goals
- Implement 4-scenario pricing matrix
- Build pricing confirmation UX
- Implement governance warnings
- Enable quote table paste/upload

### User Stories (23 points)

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S4-001 | Get auto-calculated pricing for codified products | 5 | Eng 1 |
| S4-002 | See [ENTER VALUE] placeholders for custom pricing | 3 | Eng 1 |
| S4-003 | Confirm/edit pricing in modal before finalizing | 5 | Eng 2 |
| S4-004 | See governance warnings for high discounts | 5 | Eng 1 |
| S4-005 | Paste quote table and use it as-is | 5 | Eng 2 |

### Technical Tasks (39 points)

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

### Acceptance Criteria
- [ ] Codified products auto-calculate with correct math
- [ ] Custom/variable pricing shows clear placeholders
- [ ] Pricing modal allows inline editing
- [ ] Governance warnings appear at correct thresholds (30%, 40%)
- [ ] Pasted quote tables preserve formatting and values

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

### Technical Tasks (47 points)

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
| [Sprint Plan](./SPRINT_PLAN.md) | Detailed spike documentation and alternative approaches |
| [Context Assembly](../architecture/CONTEXT_ASSEMBLY.md) | Token budgets and truncation strategy |
| [LLM Provider Architecture](../architecture/LLM_PROVIDER_ARCHITECTURE.md) | Multi-provider design and embedding migration |
| [API Versioning](../architecture/API_VERSIONING.md) | API versioning and deprecation policy |
| [Rate Limiting](../operations/RATE_LIMITING.md) | Rate limits by plan tier |
| [Backup Strategy](../operations/BACKUP_STRATEGY.md) | Backup and disaster recovery procedures |
| [Monitoring](../operations/MONITORING.md) | Metrics, alerting, and incident response |
| [Secrets Management](../security/SECRETS_MANAGEMENT.md) | Credentials and secrets handling |

---

**Document Version:** 1.1
**Last Updated:** December 2025
**Next Review:** End of Phase 0 (Day 8)

