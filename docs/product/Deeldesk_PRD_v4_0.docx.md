  
**Product Requirements Document**

**Deeldesk.ai**

AI-Powered Proposal Generation Platform  
*The First System of Record for Sales Strategy*

**Version 4.0**  
December 2025

**Document Status: DRAFT**

**Table of Contents**

[**1\. Product Overview	6**](#heading=)

[1.1 Product Vision	6](#heading=)

[1.2 Core Value Propositions	6](#heading=)

[1.3 Product Scope	7](#heading=)

[In Scope (MVP)	7](#heading=)

[In Scope (Phase 2\)	7](#heading=)

[In Scope (Phase 3\)	7](#heading=)

[Out of Scope (Deferred)	8](#heading=)

[**2\. User Personas & Stories	9**](#heading=)

[2.1 Primary Personas	9](#heading=)

[Persona 1: Alex \- Individual Account Executive	9](#heading=)

[Persona 2: Sarah \- Sales Operations Leader	9](#heading=)

[Persona 3: Jordan \- Sales Engineer (NEW)	9](#heading=)

[2.2 User Stories	9](#heading=)

[Proposal Generation Stories	9](#heading=)

[Conversational Knowledge Access Stories	9](#heading=)

[Pricing Stories	10](#heading=)

[**3\. Functional Requirements: Proposal Generation	11**](#heading=)

[3.1 Proposal Creation	11](#heading=)

[3.2 Proposal Iteration	11](#heading=)

[3.3 Version Control & Export	11](#heading=)

[**4\. Functional Requirements: Deal Context (NEW)	12**](#heading=)

[4.1 Design Philosophy	12](#heading=)

[4.2 Deal Context Acquisition (Phased)	12](#heading=)

[MVP: Manual Context Input	12](#heading=)

[Phase 2: Integration-Based Context	12](#heading=)

[Phase 3: Intelligent Context Synthesis	12](#heading=)

[4.3 Context Hierarchy	12](#heading=)

[**5\. Functional Requirements: Strategy Capture	13**](#heading=)

[5.1 Implicit Data Extraction	13](#heading=)

[5.2 Optional Direct Capture Enhancement	13](#heading=)

[**6\. Functional Requirements: Proposal Pricing	14**](#heading=)

[6.1 Design Principles	14](#heading=)

[6.2 Pricing Scenario Matrix (NEW)	14](#heading=)

[Scenario 1: Simple, Fully Codified Pricing	14](#heading=)

[Scenario 2: Partially Codified Pricing	14](#heading=)

[Scenario 3: Completely Opaque/Variable Pricing	14](#heading=)

[Scenario 4: User Pastes Full Quote Table	14](#heading=)

[6.3 Pricing UX Flow (MVP)	14](#heading=)

[6.4 Governance Warnings	15](#heading=)

[6.5 Pricing Engine Roadmap	15](#heading=)

[**7\. Session Persistence & Error Recovery (NEW)	16**](#heading=)

[7.1 Session Persistence Architecture	16](#heading=)

[MVP: Browser-Local Auto-Save	16](#heading=)

[Phase 2: Server-Side Draft Sync	16](#heading=)

[Phase 3: Real-Time Sync \+ Versioning	16](#heading=)

[7.2 Error Recovery UX	16](#heading=)

[MVP Error Scenarios	16](#heading=)

[Phase 2 Error Handling	16](#heading=)

[Phase 3 Error Handling	16](#heading=)

[**8\. Competitive Battlecard Management (NEW)	17**](#heading=)

[8.1 Overview	17](#heading=)

[8.2 Battlecard Ingestion (Phased)	17](#heading=)

[MVP: Manual Paste/Upload	17](#heading=)

[Phase 2: Structured Battlecard Extraction	17](#heading=)

[Phase 3: Pattern Learning from Wins/Losses	17](#heading=)

[**9\. Functional Requirements: Knowledge Base	18**](#heading=)

[9.1 Product Catalog	18](#heading=)

[9.2 Competitive Intelligence	18](#heading=)

[9.3 Sales Playbooks	18](#heading=)

[**10\. Functional Requirements: Conversational Knowledge Access	19**](#heading=)

[10.1 Query Types	19](#heading=)

[10.2 Conversational Access Requirements	19](#heading=)

[**11\. Data Architecture	20**](#heading=)

[11.1 Tenant Model Philosophy	20](#heading=)

[11.2 Core Entity Hierarchy (UPDATED v4.0)	20](#heading=)

[Why Opportunity-Centric?	20](#heading=)

[11.3 Organization Entity Schema	20](#heading=)

[11.4 Opportunity Entity Schema (NEW)	20](#heading=)

[11.5 Proposal Entity Schema (UPDATED)	20](#heading=)

[11.6 Deal Context Entity Schema (NEW)	21](#heading=)

[11.7 Plan Tier Feature Matrix	21](#heading=)

[11.8 Data Isolation	21](#heading=)

[**12\. Context Assembly Engine	22**](#heading=)

[12.1 Design Principles	22](#heading=)

[12.2 Context Assembly Flow	22](#heading=)

[12.3 Context Assembly Requirements	22](#heading=)

[**13\. RAG & Vector Search Architecture	23**](#heading=)

[13.1 Indexing Strategy	23](#heading=)

[13.2 Hybrid Search	23](#heading=)

[13.3 Embedding Model	23](#heading=)

[**14\. Historical Pattern Store	24**](#heading=)

[14.1 Pattern Types	24](#heading=)

[14.2 Pattern Extraction Flow	24](#heading=)

[14.3 Privacy & Anonymization	24](#heading=)

[**15\. API Specifications	25**](#heading=)

[15.1 Opportunity APIs	25](#heading=)

[15.2 Proposal APIs	25](#heading=)

[15.3 Knowledge Base APIs	25](#heading=)

[**16\. Slide Generation Architecture	26**](#heading=)

[16.1 Two-Layer Architecture	26](#heading=)

[16.2 Slide Layout Taxonomy (20 Layouts)	26](#heading=)

[16.3 Safe Mode Rendering	26](#heading=)

[**17\. Asynchronous Proposal Generation	26**](#heading=)

[17.1 Problem Statement	26](#heading=)

[17.2 Job Submission Flow	26](#heading=)

[17.3 SSE Streaming States	26](#heading=)

[**18\. UI/UX Requirements	27**](#heading=)

[18.1 Core Interfaces	27](#heading=)

[18.2 Performance Requirements	27](#heading=)

[18.3 Accessibility Requirements (NEW)	27](#heading=)

[18.4 Mobile Support (NEW)	27](#heading=)

[**19\. Non-Functional Requirements	28**](#heading=)

[19.1 Performance & Scalability	28](#heading=)

[19.2 Reliability	28](#heading=)

[**20\. Security & Compliance Requirements	28**](#heading=)

[20.1 Authentication & Authorization	28](#heading=)

[20.2 Data Security	28](#heading=)

[20.3 LLM Data Privacy	28](#heading=)

[20.4 BYOX Requirements (Phase 3\)	28](#heading=)

[**21\. MVP Feature Priority (UPDATED v4.0)	29**](#heading=)

[21.1 P0 (Core \- Must Ship)	29](#heading=)

[21.2 P1 (Launch \- Required for GA)	29](#heading=)

[21.3 P2 (Fast Follow \- Post-Launch)	29](#heading=)

[21.4 Deferred to Phase 2	29](#heading=)

[21.5 Out of Scope (Enterprise/Future)	30](#heading=)

[**22\. MVP Success Metrics	31**](#heading=)

[22.1 Quality Metrics	31](#heading=)

[22.2 Performance Metrics	31](#heading=)

[22.3 Business Metrics	31](#heading=)

[**23\. Pricing & Packaging (NEW)	32**](#heading=)

[23.1 Tier Structure	32](#heading=)

[23.2 Free Tier Guardrails	32](#heading=)

[23.3 Referral Program	32](#heading=)

[**24\. Phase 0 Overview	33**](#heading=)

[24.1 Objective	33](#heading=)

[24.2 Deliverables	33](#heading=)

[24.3 Timeline	33](#heading=)

[**25\. Spike 1: Rendering Engine ('Slide Breaker')	33**](#heading=)

[25.1 Task 1.1: Layout Stress Test	33](#heading=)

[25.2 Task 1.2: Complex Quote Stress Test	33](#heading=)

[25.3 Fallback Paths	33](#heading=)

[**26\. Spike 2: Context Window Reasoning	33**](#heading=)

[26.1 Task 2.1: Needle in Haystack	33](#heading=)

[26.2 Task 2.2: Math Integrity	34](#heading=)

[26.3 Task 2.3: Currency Consistency	34](#heading=)

[26.4 Fallback Paths	34](#heading=)

[**27\. Spike 3: PLG User Journey Simulation (NEW)	34**](#heading=)

[27.1 Objective	34](#heading=)

[27.2 Test Scenarios	34](#heading=)

[27.3 Success Criteria	34](#heading=)

[**28\. Go/No-Go Decision Framework	34**](#heading=)

[28.1 Decision Matrix	34](#heading=)

[28.2 Architecture Options	34](#heading=)

[**29\. Technology Stack	36**](#heading=)

[29.1 Backend	36](#heading=)

[29.2 Frontend	36](#heading=)

[29.3 AI/ML	36](#heading=)

[29.4 Infrastructure	36](#heading=)

[**30\. Document Approval	37**](#heading=)

**PART I**

Product Requirements

# **1\. Product Overview**

## **1.1 Product Vision**

Deeldesk.ai is an AI-powered proposal generation platform that enables sales professionals to create high-quality, contextually-aware sales presentations in minutes rather than hours. The platform captures the strategic 'why' behind deal decisions—the positioning, pricing, and solutioning (PPS) choices that determine outcomes—creating the first system of record for sales strategy.

Beyond proposal generation, the platform provides conversational AI access to the entire knowledge base—enabling sellers to query competitive intelligence, pricing patterns, and deal history through natural language. This transforms institutional knowledge from static documents into an interactive strategic advisor.

## **1.2 Core Value Propositions**

* 10x Faster Proposals: Generate professional, brand-compliant proposals in minutes instead of hours

* Zero Cold Start: Individual sellers get immediate value without team adoption or complex setup

* Strategy Capture: Automatically extract positioning, pricing, and solutioning decisions from every proposal

* Conversational Intelligence: Query your entire knowledge base through natural language

* Deal Arc Intelligence: Build comprehensive deal histories that reveal winning patterns

## **1.3 Product Scope**

### **In Scope (MVP)**

* AI-powered proposal generation from natural language prompts

* Opportunity-centric data model with proposals as child entities

* Deal context capture via paste/drag text input

* Natural language iteration and editing

* Conversational access to knowledge base

* Version control with full iteration history

* Export to PowerPoint (.pptx) and PDF

* Personal knowledge base with RAG indexing

* Proposal pricing generation with governance warnings (4-scenario matrix)

* Strategy data extraction from proposals

* Context Assembly Engine for intelligent context retrieval

* Real-time SSE streaming for proposal generation progress

* Browser-local session persistence (auto-save drafts)

* Error recovery UX with graceful degradation

* Manual competitive battlecard paste/upload

* Safe Mode toggle (zero hallucination mode)

* One-Click 'Send as Link' (trackable web version)

### **In Scope (Phase 2\)**

* Win Theme Slide Auto-Generator

* Template Gallery (5 verticals pre-loaded)

* Server-side draft sync (cross-device access)

* Structured battlecard extraction

* Personal Pattern Feedback Loop

* CRM integration (Salesforce, HubSpot)

* Deal context integrations (Gong, Gmail, Slack)

* Basic Deal Arc visualization

* Team workspaces and collaboration

* Real CPQ connectors (Salesforce CPQ, DealHub)

* Mobile-optimized web viewer with edit-in-place

### **In Scope (Phase 3\)**

* Full Deal Arc with multi-source integration

* Pattern analytics and win/loss correlation

* Pricing Rules Engine (multi-axis formulas)

* Quote mirror mode (reverse-engineer pricing logic)

* BYOX (Bring Your Own Everything)

* SSO/SCIM enterprise identity

* Enterprise hierarchy (parent organizations)

* Multi-language support

### **Out of Scope (Deferred)**

* Real-time team collaboration (co-editing)

* Advanced discount governance workflows (approvals)

* Custom domain / white-label

# **2\. User Personas & Stories**

## **2.1 Primary Personas**

### **Persona 1: Alex \- Individual Account Executive**

* Role: Mid-market AE at a B2B SaaS company

* Pain Points: Spends 4-6 hours per deal on proposals, struggles with pricing accuracy, lacks visibility into what works

* Goals: Generate professional proposals quickly, maintain pricing accuracy, learn from winning patterns

* Tech Savvy: High \- comfortable with AI tools, expects modern UX

### **Persona 2: Sarah \- Sales Operations Leader**

* Role: Director of Sales Ops at enterprise software company

* Pain Points: No visibility into deal strategy, inconsistent messaging across team, manual governance

* Goals: Standardize proposal quality, enforce pricing governance, analyze winning patterns

* Tech Savvy: Medium \- needs easy adoption path for team

### **Persona 3: Jordan \- Sales Engineer (NEW)**

* Role: Pre-sales technical resource supporting multiple AEs

* Pain Points: Repetitive technical slides, outdated competitive info, inconsistent ROI calculations

* Goals: Quickly customize technical content, access accurate competitive intelligence

* Tech Savvy: Very High \- expects technical depth and API access

## **2.2 User Stories**

### **Proposal Generation Stories**

* US-PG-001: As a seller, I want to describe my deal in natural language and receive a professional proposal

* US-PG-002: As a seller, I want to iterate on my proposal using natural language commands

* US-PG-003: As a seller, I want the AI to know my company's products and pricing

* US-PG-004: As a seller, I want to paste/drag deal context (emails, notes) into the system

* US-PG-005: As a seller, I want my draft proposals to auto-save so I never lose work

### **Conversational Knowledge Access Stories**

* US-CK-001: As a seller, I want to ask 'What's our best positioning against \[Competitor\]?' and get an instant answer

* US-CK-002: As a seller, I want to ask 'What discount range wins healthcare enterprise deals?'

* US-CK-003: As a seller, I want to ask 'How should I respond when they say we're too expensive?'

### **Pricing Stories**

* US-PR-001: As a seller, I want to specify quantity and discount so accurate pricing appears in my proposal

* US-PR-002: As a seller, I want to see warnings if my discount exceeds policy

* US-PR-003: As a seller, I want to paste my quote table and have the system use it as-is

* US-PR-004: As a seller, I want clear \[ENTER VALUE\] placeholders for custom/usage-based pricing

# **3\. Functional Requirements: Proposal Generation**

## **3.1 Proposal Creation**

The proposal creation flow is triggered from an Opportunity context. Each proposal is a child entity of an Opportunity, enabling multiple proposal versions and iterations per deal.

| Req ID | Requirement | Priority |
| ----- | ----- | ----- |
| FR-PG-001 | User creates proposal from Opportunity context with natural language prompt | P0 |
| FR-PG-002 | System retrieves relevant context via Context Assembly Engine | P0 |
| FR-PG-003 | LLM generates slide content with brand styling applied | P0 |
| FR-PG-004 | Real-time SSE streaming shows generation progress | P0 |
| FR-PG-005 | Strategy extraction runs automatically on completion | P0 |
| FR-PG-006 | Draft auto-saves to browser localStorage every 30 seconds | P0 |
| FR-PG-007 | User can paste/drag deal context text before generation | P0 |

## **3.2 Proposal Iteration**

| Req ID | Requirement | Priority |
| ----- | ----- | ----- |
| FR-PI-001 | User edits proposals via natural language commands | P0 |
| FR-PI-002 | System maintains full version history | P0 |
| FR-PI-003 | User can revert to any previous version | P1 |
| FR-PI-004 | Per-slide regeneration without full proposal rebuild | P1 |

## **3.3 Version Control & Export**

| Req ID | Requirement | Priority |
| ----- | ----- | ----- |
| FR-VC-001 | Export to PowerPoint (.pptx) with full fidelity | P0 |
| FR-VC-002 | Export to PDF | P0 |
| FR-VC-003 | One-click 'Send as Link' generates trackable web version | P0 |
| FR-VC-004 | Web version captures open/scroll analytics | P1 |

# **4\. Functional Requirements: Deal Context (NEW)**

## **4.1 Design Philosophy**

Deal context is the critical input that transforms generic proposals into deal-winning, personalized content. Traditional approaches assume sellers will manually input all context during prompt time—this is insufficient. Deal context is embedded across emails, calendar events, presentation materials, call recordings, notes, and chat threads.

The MVP prioritizes zero-friction context capture, with progressive enhancement in later phases.

## **4.2 Deal Context Acquisition (Phased)**

### **MVP: Manual Context Input**

* Paste/drag text box for unstructured deal context (emails, notes, requirements)

* Text is parsed, chunked, and associated with the Opportunity

* Key points extracted and stored for context assembly

* No integrations required—works immediately for any seller

### **Phase 2: Integration-Based Context**

* CRM integration: Salesforce Opportunity ID auto-populates deal metadata

* Conversation intelligence: Gong/Chorus/Zoom transcript auto-ingest

* Email integration: Gmail/Outlook thread association

* Chat integration: Slack relevant thread capture

* Light parsing \+ chunking into Deal Timeline

### **Phase 3: Intelligent Context Synthesis**

* Multi-source context fusion across all integrations

* Automatic key point extraction and summarization

* Stakeholder identification and sentiment analysis

* Deal risk signal detection

## **4.3 Context Hierarchy**

Context Assembly follows a priority hierarchy for proposal generation:

1. Session Context: Current prompt, selected template, user preferences

2. Deal Context: Opportunity-specific information (stakeholders, requirements, timeline, budget)

3. Business Context: Company products, pricing, competitive intelligence, playbooks

4. Historical Patterns: Winning strategies from similar deals (Phase 2+)

# **5\. Functional Requirements: Strategy Capture**

## **5.1 Implicit Data Extraction**

Strategy capture is the core differentiator. The system must extract positioning, pricing, and solutioning (PPS) decisions from proposals without requiring sellers to fill out forms. Every proposal becomes a data point for pattern learning.

| Data Type | Extraction Source | Example |
| ----- | ----- | ----- |
| Positioning | Value prop slides, executive summary | "Positioned as cost-reduction play for CFO audience" |
| Pricing | Quote tables, pricing slides | "30% discount, 3-year term, Q4 closing incentive" |
| Solutioning | Product slides, architecture diagrams | "Enterprise tier \+ Professional Services \+ Training" |
| Competitive | Why-us slides, objection handling | "Against Competitor X, emphasized compliance" |
| Stakeholders | Deal context, meeting notes | "CFO (economic), CTO (technical), VP Ops (champion)" |

## **5.2 Optional Direct Capture Enhancement**

To enrich strategy data without mandatory forms, the system offers optional AI-suggested annotations:

* Post-generation prompt: 'Is this pricing aggressive, standard, or conservative?'

* Quick thumbs-up/down on AI-suggested positioning tags

* Optional 'deal notes' field after proposal completion

*Philosophy: Suggestions, not requirements. Sellers who engage get richer Deal Arcs; those who don't still contribute data through implicit extraction.*

# **6\. Functional Requirements: Proposal Pricing**

## **6.1 Design Principles**

Proposal Pricing generates credible pricing content without replacing CPQ. Philosophy: guardrails, not gates—warn on policy violations but don't hard-block unless legally required.

**Key Principle: The system must handle pricing uncertainty gracefully, never hallucinating values it doesn't know.**

## **6.2 Pricing Scenario Matrix (NEW)**

The pricing engine behavior varies based on the codification level of the customer's pricing model:

### **Scenario 1: Simple, Fully Codified Pricing**

Example: Standard/Professional/Enterprise seat-based tiers

* MVP Behavior: Auto-calculate exact quote table (list price → discount → total) with governance warnings

* Strategy Capture: Full PPS extraction (products, discount %, bundle logic)

### **Scenario 2: Partially Codified Pricing**

Example: PS days, add-ons with fixed fees, some variable components

* MVP Behavior: Auto-calculate known line items, leave \[CUSTOM\] rows blank with note 'Add PS estimate'

* Strategy Capture: Capture everything except custom $ amounts

### **Scenario 3: Completely Opaque/Variable Pricing**

Example: Usage-based, revenue-share, custom SKUs

* MVP Behavior: Generate beautiful pricing slide structure with headers and value messaging, but all $ fields \= \[ENTER VALUE\] or pre-filled with user's last-used number

* Strategy Capture: Prompt user immediately after generation for Total Contract Value or line-item amounts; parse discount % if user types '$1.37M @ 28% discount'

### **Scenario 4: User Pastes Full Quote Table**

Example: Seller has quote from CPQ or spreadsheet

* MVP Behavior: Allow direct paste/upload of pricing table, keep as-is

* Strategy Capture: Parse pasted numbers for strategy signals (SKUs, discount depth, PS attachment)

## **6.3 Pricing UX Flow (MVP)**

1. Generation finishes → streaming ends

2. If any pricing line is uncertain → orange banner appears: 'Pricing includes custom/usage-based elements. Please confirm final numbers.'

3. One-click modal pops with pricing table pre-rendered but editable (like Google Sheets light)

4. Seller types or pastes real numbers → hits Confirm → slide updates instantly

5. All user-entered numbers saved and parsed for Deal Arc / pattern learning

## **6.4 Governance Warnings**

| Threshold | Action | UX Treatment |
| ----- | ----- | ----- |
| 0-30% discount | No warning | Green checkmark |
| 30-40% discount | WARN\_ONLY | Yellow banner with policy note |
| \>40% discount | REQUIRE\_JUSTIFICATION | Modal requesting justification text |
| Legal/compliance violation | HARD\_BLOCK | Red banner, generation blocked |

*Note: HARD\_BLOCK reserved for legal/compliance only (e.g., ITAR), NOT discount limits.*

## **6.5 Pricing Engine Roadmap**

| Phase | Capability |
| ----- | ----- |
| MVP | 4-scenario matrix, manual confirmation, governance warnings |
| Phase 2 | Real CPQ connectors (Salesforce CPQ, DealHub) for auto-fill |
| Phase 3 | Pricing Rules Engine (multi-axis formulas, bundle detection, geo floors) |
| Phase 4 | Quote mirror mode—ingest signed quotes and reverse-engineer pricing logic |

# **7\. Session Persistence & Error Recovery (NEW)**

## **7.1 Session Persistence Architecture**

Sellers work across devices and sessions. The system must preserve work-in-progress without friction.

### **MVP: Browser-Local Auto-Save**

* Auto-save draft to localStorage every 30 seconds during active editing

* On return, prompt: 'Resume your draft for \[Opportunity Name\]?'

* Store prompt inputs, selected template, user edits—not full rendered output

* Drafts expire after 7 days

* localStorage limit (\~5MB) sufficient for draft metadata

### **Phase 2: Server-Side Draft Sync**

* Persist drafts to database tied to user \+ opportunity

* Enable cross-device access

* Add 'Drafts' section to dashboard with last-edited timestamp

### **Phase 3: Real-Time Sync \+ Versioning**

* Full version history per proposal

* 'Restore previous version' capability

* Conflict resolution for team collaboration

## **7.2 Error Recovery UX**

**Core Principle: Never lose user work. Every error state has a single clear action.**

### **MVP Error Scenarios**

| Scenario | MVP Behavior |
| ----- | ----- |
| Generation fails mid-stream (API timeout) | Preserve all inputs. Display: 'Generation interrupted. Your inputs are saved.' Button: 'Retry'. If retry fails twice: 'Save draft and try later.' |
| Context too large (token limit) | Pre-flight validation before generation. If over limit: 'Your deal context is too detailed. Consider summarizing \[section\] or removing older notes.' |
| Partial success (3 of 5 slides generated) | Display completed slides. Placeholder for failed: '\[Slide 4\] failed to generate. \[Retry this slide\]'. Per-slide retry without full rebuild. |

### **Phase 2 Error Handling**

* Graceful degradation: If primary LLM unavailable, queue request with notification: 'High demand—your proposal will be ready in \~2 minutes.'

* Background processing with email/push notification on completion

### **Phase 3 Error Handling**

* Predictive intervention: Monitor generation confidence in real-time

* If model struggling (high uncertainty), pause and request clarification before producing low-quality output

# **8\. Competitive Battlecard Management (NEW)**

## **8.1 Overview**

Competitive intelligence is critical for effective proposals. The system must make battlecard content accessible for generation without requiring complex setup.

## **8.2 Battlecard Ingestion (Phased)**

### **MVP: Manual Paste/Upload**

* Settings → Competitive Intelligence → Add Competitor

* Paste text or upload single doc (PDF/DOCX/TXT)

* Basic chunking, stored as unstructured text

* Tagged by competitor name for retrieval

* Inline addition during generation: 'Add competitive context' → paste snippet

* Option to save inline content to competitor library

*No extraction magic—just searchable context for generation.*

### **Phase 2: Structured Battlecard Extraction**

* AI parses uploaded battlecards into structured fields:

*   \- Key differentiators

*   \- Landmines and trap questions

*   \- Win themes

*   \- FUD points (Fear, Uncertainty, Doubt)

* Enables smarter retrieval and Win Theme Slide Auto-Generator

* Battlecard freshness tracking: Flag content \>90 days old

* Optional integration with Klue/Crayon APIs for auto-refresh

### **Phase 3: Pattern Learning from Wins/Losses**

* Correlate battlecard content with deal outcomes

* Surface insights: 'When you mention \[Competitor X compliance gap\], win rate increases 23%'

* Automatic win theme recommendations based on deal characteristics

# **9\. Functional Requirements: Knowledge Base**

The Knowledge Base is the persistent foundation layer—the 'always available' context. All content is indexed for both structured queries and semantic search via RAG.

## **9.1 Product Catalog**

| Req ID | Requirement | Priority |
| ----- | ----- | ----- |
| FR-KB-001 | Store product definitions with features, benefits, pricing tiers | P0 |
| FR-KB-002 | Support product relationships (bundles, dependencies) | P1 |
| FR-KB-003 | Version control for product changes | P2 |

## **9.2 Competitive Intelligence**

| Req ID | Requirement | Priority |
| ----- | ----- | ----- |
| FR-KB-004 | Store battlecards tagged by competitor | P0 |
| FR-KB-005 | Manual paste/upload per competitor | P0 |
| FR-KB-006 | Structured field extraction (Phase 2\) | P2 |

## **9.3 Sales Playbooks**

| Req ID | Requirement | Priority |
| ----- | ----- | ----- |
| FR-KB-007 | Store playbooks by vertical, segment, use case | P1 |
| FR-KB-008 | Objection handling scripts with RAG indexing | P1 |
| FR-KB-009 | Win/loss analysis templates | P2 |

# **10\. Functional Requirements: Conversational Knowledge Access**

Enables users to query the entire knowledge base through natural language chat.

## **10.1 Query Types**

* Product queries: 'What's included in the Enterprise tier?'

* Competitive queries: 'How do we compare to \[Competitor\] on security?'

* Pricing queries: 'What's the typical discount for healthcare enterprise?'

* Objection handling: 'How do I respond when they say we're too expensive?'

* Deal pattern queries (Phase 2): 'What positioning works best for CFO audiences?'

## **10.2 Conversational Access Requirements**

| Req ID | Requirement | Priority |
| ----- | ----- | ----- |
| FR-CA-001 | Natural language query interface | P0 |
| FR-CA-002 | Hybrid search: vector similarity \+ structured filters | P0 |
| FR-CA-003 | Source citations in responses | P0 |
| FR-CA-004 | Context-aware follow-up questions | P1 |
| FR-CA-005 | Query history and saved queries | P2 |

**PART II**

Data & API Architecture

# **11\. Data Architecture**

UPDATED in v4.0: Opportunity-centric data model with proposals as child entities. Unified Organization entity with plan\_tier-based feature gating.

## **11.1 Tenant Model Philosophy**

Deeldesk uses a single Organization entity rather than separate tenant types for prosumer, team, and enterprise users. This enables seamless PLG (Product-Led Growth) upgrades without data migration.

**Key Design Principles:**

* Single Entity Type: One 'Organization' concept handles all user types

* Plan Tier Controls Features: Feature access determined by plan\_tier, not architecture

* Seamless Upgrade Path: Users grow from free → pro → team → enterprise without migration

* Linear Model: Single user account can access multiple organizations

## **11.2 Core Entity Hierarchy (UPDATED v4.0)**

The data model is Opportunity-centric. All deal-related entities (proposals, deal context, strategy records) are children of Opportunities.

Organization → User(s) → Opportunity(ies) → Proposal(s)

### **Why Opportunity-Centric?**

* Reflects real sales process: multiple proposals per deal, evolving context over time

* Enables Deal Arc construction at the Opportunity level

* Supports CRM integration (Salesforce Opportunity ID mapping)

* Maintains deal context across proposal iterations

## **11.3 Organization Entity Schema**

organizations {  id: UUID PRIMARY KEY  name: VARCHAR(255)  slug: VARCHAR(100) UNIQUE  plan\_tier: ENUM('free', 'pro', 'team', 'enterprise')  settings: JSONB  created\_at: TIMESTAMP  updated\_at: TIMESTAMP}

## **11.4 Opportunity Entity Schema (NEW)**

opportunities {  id: UUID PRIMARY KEY  organization\_id: UUID REFERENCES organizations(id)  user\_id: UUID REFERENCES users(id)  name: VARCHAR(255)  external\_id: VARCHAR(255)  \-- CRM Opportunity ID  external\_source: VARCHAR(50)  \-- 'salesforce', 'hubspot', 'manual'  status: ENUM('open', 'won', 'lost', 'stalled')  deal\_context: JSONB  \-- Parsed context from paste/integrations  stakeholders: JSONB  \-- Identified stakeholders  metadata: JSONB  created\_at: TIMESTAMP  updated\_at: TIMESTAMP}

## **11.5 Proposal Entity Schema (UPDATED)**

proposals {  id: UUID PRIMARY KEY  opportunity\_id: UUID REFERENCES opportunities(id)  \-- Parent relationship  organization\_id: UUID REFERENCES organizations(id)  user\_id: UUID REFERENCES users(id)  version: INTEGER  status: ENUM('draft', 'generating', 'complete', 'error')  prompt: TEXT  slides: JSONB  pricing\_data: JSONB  strategy\_extracted: BOOLEAN DEFAULT false  created\_at: TIMESTAMP  updated\_at: TIMESTAMP}

## **11.6 Deal Context Entity Schema (NEW)**

deal\_context\_items {  id: UUID PRIMARY KEY  opportunity\_id: UUID REFERENCES opportunities(id)  source\_type: ENUM('manual\_paste', 'email', 'call\_transcript', 'slack', 'crm')  raw\_content: TEXT  parsed\_content: JSONB  \-- Key points extracted  embedding: VECTOR(1536)  \-- For semantic search  created\_at: TIMESTAMP}

## **11.7 Plan Tier Feature Matrix**

| Feature | Free | Pro ($29/mo) | Team | Enterprise |
| ----- | ----- | ----- | ----- | ----- |
| Proposals per month | 5 | Unlimited | Unlimited | Unlimited |
| Knowledge base items | 50 | 500 | Unlimited | Unlimited |
| Battlecard competitors | 3 | 20 | Unlimited | Unlimited |
| Deal context integrations | Manual only | Manual only | CRM, Gong | All |
| Team workspaces | No | No | Yes | Yes |
| SSO/SCIM | No | No | No | Yes |
| BYOX options | No | No | No | Yes |

## **11.8 Data Isolation**

* Row-Level Security: All queries filtered by organization\_id at database level

* Vector Search Isolation: All pgvector searches include organization\_id filter

* Enterprise Options: Dedicated schema or database for air-gap deployments (Phase 3\)

# **12\. Context Assembly Engine**

The orchestration layer that dynamically assembles the right context for each AI interaction.

## **12.1 Design Principles**

* Relevance Filtering: Retrieve what's relevant, not everything

* Hierarchical Override: Deal-specific context overrides company defaults

* Token Budget Management: Finite context windows require prioritization

* Recency Weighting: Recent deal context prioritized over older items

## **12.2 Context Assembly Flow**

1. Receive prompt with Opportunity ID

2. Load Deal Context from opportunity.deal\_context \+ deal\_context\_items

3. Retrieve relevant Product Catalog items (semantic \+ structured)

4. Retrieve relevant Competitive Intelligence (if competitors mentioned)

5. Apply token budget allocation (deal context: 40%, products: 30%, competitive: 20%, playbooks: 10%)

6. Assemble final context payload for LLM

## **12.3 Context Assembly Requirements**

| Req ID | Requirement | Priority |
| ----- | ----- | ----- |
| FR-CA-001 | Semantic search across all indexed content | P0 |
| FR-CA-002 | Token budget enforcement with configurable allocation | P0 |
| FR-CA-003 | Hierarchical override (deal \> company defaults) | P0 |
| FR-CA-004 | Recency weighting for deal context items | P1 |
| FR-CA-005 | Configurable retrieval limits per content type | P1 |

# **13\. RAG & Vector Search Architecture**

## **13.1 Indexing Strategy**

* Products: Indexed by name, description, features, use cases

* Battlecards: Indexed by competitor name, differentiators, weaknesses, win themes

* Deal Context: Indexed by content with opportunity\_id metadata filter

* Playbooks: Indexed by vertical, segment, objection type

## **13.2 Hybrid Search**

* Semantic Search: Vector similarity using pgvector

* Structured Filters: Exact match on metadata for precision

* Keyword Search: Full-text search via pg\_trgm

* Reranking: Cross-encoder reranking of top candidates

## **13.3 Embedding Model**

Default: OpenAI text-embedding-3-small (1536 dimensions)

Phase 3 BYOL: Support for custom embedding endpoints

# **14\. Historical Pattern Store**

Captures anonymized patterns from completed deals for pattern-based queries.

## **14.1 Pattern Types**

* Positioning Patterns: Value propositions and differentiators that correlate with wins

* Pricing Patterns: Discount ranges and terms that win by segment

* Solution Patterns: Product configurations by use case

* Risk Signals: Early warning indicators from lost deals

## **14.2 Pattern Extraction Flow**

1. Opportunity marked as won/lost

2. Strategy records from all proposals aggregated

3. Patterns extracted and anonymized

4. Patterns indexed for conversational queries

## **14.3 Privacy & Anonymization**

* Customer names, contact info, and specific deal values anonymized

* Patterns aggregated at segment/vertical level

* Enterprise option: Patterns isolated to organization (no cross-org learning)

# **15\. API Specifications**

## **15.1 Opportunity APIs**

POST /api/opportunities  Create new opportunity with optional CRM external\_idGET /api/opportunities/:id  Retrieve opportunity with deal contextPATCH /api/opportunities/:id  Update opportunity metadata, statusPOST /api/opportunities/:id/context  Add deal context item (paste/upload)

## **15.2 Proposal APIs**

POST /api/opportunities/:opportunity\_id/proposals  Create proposal for opportunity (returns job\_id)GET /api/proposals/:id  Retrieve proposal with slides, pricingGET /api/proposals/:id/stream  SSE endpoint for generation progressPOST /api/proposals/:id/iterate  Submit iteration commandGET /api/proposals/:id/export?format=pptx|pdf  Export proposalPOST /api/proposals/:id/share  Generate shareable web link

## **15.3 Knowledge Base APIs**

POST /api/knowledge/products  Add/update productPOST /api/knowledge/battlecards  Add/update battlecardPOST /api/knowledge/query  Natural language knowledge queryGET /api/knowledge/search?q=...\&type=...  Hybrid search across knowledge base

**PART III**

Technical Design

# **16\. Slide Generation Architecture**

## **16.1 Two-Layer Architecture**

* Content Layer: LLM generates slide content, structure, speaker notes

* Rendering Layer: pptxgenjs transforms content into formatted slides

## **16.2 Slide Layout Taxonomy (20 Layouts)**

* Opening: title\_centered, title\_with\_image, agenda

* Content: single\_point, bullet\_list, two\_column, content\_with\_image

* Data: comparison\_table, pricing\_table, pricing\_tiers, roi\_calculator, timeline

* Closing: quote, case\_study, next\_steps, contact

## **16.3 Safe Mode Rendering**

If pptxgenjs fails on complex layouts, system retries with simplified layouts. Yellow banner displayed: 'Some layouts were simplified for compatibility.'

# **17\. Asynchronous Proposal Generation**

## **17.1 Problem Statement**

60-second generation target will timeout synchronous HTTP. Solution: Asynchronous Job Queue with BullMQ \+ Redis.

## **17.2 Job Submission Flow**

1. Client POSTs to /api/opportunities/:id/proposals

2. Server creates Proposal record (status: QUEUED), pushes to BullMQ

3. Server returns 202 Accepted with { job\_id, status\_url }

4. Client connects to SSE endpoint for real-time progress

## **17.3 SSE Streaming States**

* understanding\_context → crafting\_narrative → generating\_slide\_N\_of\_M → applying\_branding → complete

* Error states: context\_error, generation\_error, rendering\_error

**PART IV**

Quality & Operations

# **18\. UI/UX Requirements**

## **18.1 Core Interfaces**

* Dashboard: Opportunity list, recent proposals, quick actions

* Opportunity View: Deal context, proposal history, Deal Arc (Phase 2\)

* Proposal Editor: Generation prompt, slide preview, iteration chat

* Knowledge Base: Product catalog, battlecards, playbooks

* Settings: Profile, organization, integrations, Safe Mode toggle

## **18.2 Performance Requirements**

| Metric | Target |
| ----- | ----- |
| Time to Interactive | \< 3s on 3G |
| Proposal Generation | \< 60s; streaming preview within 5s |
| Knowledge Query | \< 5s for typical queries |
| Draft Auto-Save | Every 30 seconds, \< 100ms operation |
| Export Generation | \< 10s for PPTX, \< 15s for PDF |

## **18.3 Accessibility Requirements (NEW)**

* WCAG 2.1 AA compliance for all core interfaces

* Keyboard navigation for all actions

* Screen reader compatibility

* Color contrast ratios meeting accessibility standards

## **18.4 Mobile Support (NEW)**

* MVP: Responsive web viewer for proposals (read-only)

* Phase 2: Mobile-optimized viewer with edit-in-place for text

* Phase 2: Quick text edits on mobile (no full generation)

# **19\. Non-Functional Requirements**

## **19.1 Performance & Scalability**

* Support 1,000 concurrent proposal generations

* 99.9% uptime SLA

* Horizontal scaling for generation workers

* CDN for static assets and exported files

## **19.2 Reliability**

* Automatic retry for transient LLM failures (3 attempts)

* Graceful degradation when LLM unavailable

* Draft persistence independent of generation success

* Database backups with 30-day retention

# **20\. Security & Compliance Requirements**

## **20.1 Authentication & Authorization**

* Email/password with MFA option

* OAuth 2.0 (Google, Microsoft)

* SAML 2.0 SSO for enterprise (Phase 3\)

* Role-based access: Admin, Manager, User, Viewer

## **20.2 Data Security**

* Encryption at rest (AES-256) and in transit (TLS 1.3)

* Row-level security at database layer

* Organization isolation verified on every request including vector searches

* No cross-organization data leakage in pattern learning

## **20.3 LLM Data Privacy**

* Default: Anthropic Claude via API (data not used for training)

* Phase 3 BYOL: AWS Bedrock or Google Vertex AI for enhanced privacy

* Phase 3 Air-Gap: Complete on-premise deployment option

## **20.4 BYOX Requirements (Phase 3\)**

* BYOD: Customer-provided PostgreSQL

* BYOS: Customer-provided S3-compatible storage

* BYOL: Customer-provided LLM endpoint

* Air-Gap: Complete on-premise deployment

**PART V**

Release Phases & Acceptance Criteria

# **21\. MVP Feature Priority (UPDATED v4.0)**

## **21.1 P0 (Core \- Must Ship)**

| Feature | Description | Dependency |
| ----- | ----- | ----- |
| Opportunity-centric data model | Proposals as children of Opportunities | None |
| Proposal generation | Natural language → professional slides | None |
| Paste/drag deal context | Manual context input for any seller | None |
| Pricing engine (4-scenario) | Handle codified to opaque pricing gracefully | None |
| SSE streaming | Real-time generation progress | None |
| Context Assembly Engine | Intelligent context retrieval | None |
| Strategy extraction | Automatic PPS capture from proposals | None |

## **21.2 P1 (Launch \- Required for GA)**

| Feature | Description | Dependency |
| ----- | ----- | ----- |
| Browser-local session persistence | Auto-save drafts, resume on return | P0 |
| Error recovery UX | Graceful handling of all failure modes | P0 |
| Manual battlecard paste/upload | Competitive context without integrations | P0 |
| Safe Mode toggle | Zero hallucination mode for enterprise AEs | P0 |
| One-Click 'Send as Link' | Trackable web version of proposals | P0 |
| Export (PPTX, PDF) | Standard output formats | P0 |
| Conversational knowledge access | Natural language KB queries | P0 |

## **21.3 P2 (Fast Follow \- Post-Launch)**

| Feature | Description | Dependency |
| ----- | ----- | ----- |
| Win Theme Slide Auto-Generator | AI-generated competitive slides | Battlecards populated |
| Template Gallery (5 verticals) | Pre-loaded professional templates | P0 |
| 'Explain This Slide' button | Show reasoning and sources | P0 |
| Referral program | Viral growth mechanism | P0 |

## **21.4 Deferred to Phase 2**

* Personal Pattern Feedback Loop (requires data accumulation)

* Server-side draft sync

* Structured battlecard extraction

* CRM integrations (Salesforce, HubSpot)

* Deal context integrations (Gong, Gmail, Slack)

* Team workspaces and collaboration

* Mobile-optimized editing

* Multi-language support

## **21.5 Out of Scope (Enterprise/Future)**

* Real-time team collaboration (co-editing)

* Advanced discount governance workflows (approvals)

* Custom domain / white-label

* BYOX options

# **22\. MVP Success Metrics**

## **22.1 Quality Metrics**

| Metric | Target | Measurement |
| ----- | ----- | ----- |
| Pricing hallucination rate | 0% | Automated eval on golden dataset |
| Feature hallucination rate | \<5% | Automated eval on golden dataset |
| Competitive claim accuracy | \>90% | Automated eval on golden dataset |

## **22.2 Performance Metrics**

| Metric | Target | Measurement |
| ----- | ----- | ----- |
| Time to first proposal (new user) | \<10 minutes | Analytics funnel |
| Proposal generation time | \<60 seconds | P95 latency monitoring |
| Streaming first content | \<5 seconds | P95 latency monitoring |

## **22.3 Business Metrics**

| Metric | Target | Measurement |
| ----- | ----- | ----- |
| Free → Pro conversion | \>5% | Cohort analysis |
| Weekly active proposals | \>3 per active user | Product analytics |
| NPS score | \>40 | In-app survey |

# **23\. Pricing & Packaging (NEW)**

## **23.1 Tier Structure**

| Tier | Price | Proposals/Month | Key Features |
| ----- | ----- | ----- | ----- |
| Free | $0 | 5 | Core generation, manual context, 3 competitors |
| Pro | $29/month | Unlimited | All Free \+ 20 competitors, priority generation |
| Team | $79/user/month | Unlimited | All Pro \+ team workspaces, CRM integration, analytics |
| Enterprise | Custom | Unlimited | All Team \+ SSO, BYOX, dedicated support |

## **23.2 Free Tier Guardrails**

* 5 proposals/month (generous for trial, forces conversion for power users)

* 50 knowledge base items

* 3 competitor battlecards

* Manual deal context only (no integrations)

* Community support only

## **23.3 Referral Program**

* 'Invite 3 colleagues → both get \+20 proposals free' or 1 month Pro

* Referral tracking from Day 1

* In-app prompts after successful proposal generation

**PART VI**

Phase 0: Technical De-Risking

# **24\. Phase 0 Overview**

## **24.1 Objective**

Validate highest-risk technical assumptions before committing to full MVP build: Programmatic Slide Generation, Context Window Reasoning, Pricing/Math Integrity.

## **24.2 Deliverables**

* Execution logs and generated artifacts (.pptx files)

* Final Go/No-Go Technical Report

* Architecture recommendation for MVP

## **24.3 Timeline**

1-week Sprint 0 timebox.

# **25\. Spike 1: Rendering Engine ('Slide Breaker')**

## **25.1 Task 1.1: Layout Stress Test**

* Create comparison table with complex row content

* Test overflow, footer overlap

* Unicode handling: 'ROI: 50% ↑', '€1,500', '日本語'

## **25.2 Task 1.2: Complex Quote Stress Test**

* 25 line items with grouped headers

* $0.00 handling (free items)

* Wide columns: 'Implementation of Phase 2 Data Migration Services'

## **25.3 Fallback Paths**

* Fallback A: Template injection with docxtemplater

* Fallback B: HTML-to-image with puppeteer (tables not editable)

# **26\. Spike 2: Context Window Reasoning**

## **26.1 Task 2.1: Needle in Haystack**

* 1,500 words battlecard with buried fact

* 1,000 words product specs with buried requirement

* 5 emails with buried budget

Prompt: 'Write pricing bullet addressing budget and Competitor X security weakness.'

Success: Mentions Enterprise Tier, checks $50k, mentions SSO cost.

## **26.2 Task 2.2: Math Integrity**

* Context: Quote total $151,200 (no breakdown)

* Prompt: 'Write summary highlighting investment.'

* Success: States '$151,200' exactly. Failure: Says '\~$150k'.

## **26.3 Task 2.3: Currency Consistency**

* Context: Budget '£50,000' but quote in USD

* Expected: AI flags mismatch—does NOT hallucinate conversion

## **26.4 Fallback Paths**

* Fallback A: Map-Reduce (two-pass extraction)

* Fallback B: Tool Use (get\_quote\_total function)

# **27\. Spike 3: PLG User Journey Simulation (NEW)**

## **27.1 Objective**

Validate signup-to-first-proposal time target (\<10 minutes).

## **27.2 Test Scenarios**

* Scenario A: User with no prior content (cold start)

* Scenario B: User uploads one battlecard \+ one product doc

* Scenario C: User pastes deal context from email thread

## **27.3 Success Criteria**

* Time to first useful proposal: \<10 minutes for all scenarios

* Onboarding friction points identified and documented

* 'Aha moment' occurs within first proposal

# **28\. Go/No-Go Decision Framework**

## **28.1 Decision Matrix**

| Spike | Green (Go) | Yellow (Proceed with caution) | Red (No-Go) |
| ----- | ----- | ----- | ----- |
| Rendering | All layouts render correctly | Minor fallbacks needed | Major layouts fail |
| Context Reasoning | 0% math drift, 95%+ fact retrieval | 5-10% issues with mitigation | \>10% issues |
| PLG Journey | \<10 min to first proposal | 10-15 min with clear fixes | \>15 min |

## **28.2 Architecture Options**

* Option A: Native Generation \+ Full Context (Ideal)

* Option B: Template Injection \+ Map-Reduce (Robust)

* Option C: Hybrid Approach (Native text \+ Image tables)

# **29\. Technology Stack**

## **29.1 Backend**

* Runtime: Node.js 20 LTS

* Framework: Next.js 14 (App Router)

* Database: PostgreSQL 16 with pgvector

* Queue: BullMQ \+ Redis

* File Storage: S3-compatible (AWS S3 or R2)

## **29.2 Frontend**

* Framework: React 18 \+ Next.js

* Styling: Tailwind CSS

* State: Zustand

* Real-time: SSE for streaming

## **29.3 AI/ML**

* LLM: Anthropic Claude 3.5 Sonnet (default)

* Embeddings: OpenAI text-embedding-3-small

* Phase 3 BYOL: AWS Bedrock, Google Vertex AI

## **29.4 Infrastructure**

* Hosting: Vercel (frontend) \+ AWS/GCP (backend services)

* CDN: CloudFront or Cloudflare

* Monitoring: Datadog or equivalent

# **30\. Document Approval**

This document requires approval from the following stakeholders:

| Role | Name | Date | Signature |
| ----- | ----- | ----- | ----- |
| Product Owner |  |  |  |
| Engineering Lead |  |  |  |
| Design Lead |  |  |  |
| QA Lead |  |  |  |

*— End of Document —*