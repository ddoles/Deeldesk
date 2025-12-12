-- ============================================================================
-- Deeldesk.ai Database Schema
-- Version: 4.0
-- Database: PostgreSQL 16 with pgvector extension
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Plan tiers for organizations (PLG progression)
CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'team', 'enterprise');

-- Organization membership roles
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');

-- Opportunity status (deal stages)
CREATE TYPE opportunity_status AS ENUM ('open', 'won', 'lost', 'stalled');

-- Proposal generation status
CREATE TYPE proposal_status AS ENUM ('draft', 'queued', 'generating', 'complete', 'error');

-- Deal context source types
CREATE TYPE context_source_type AS ENUM (
  'manual_paste',
  'email',
  'call_transcript', 
  'slack',
  'crm',
  'meeting_notes',
  'document_upload'
);

-- Pricing scenario types (4-scenario matrix)
CREATE TYPE pricing_scenario AS ENUM (
  'fully_codified',      -- Auto-calculate exact quote
  'partially_codified',  -- Known items + [CUSTOM] placeholders
  'opaque_variable',     -- Structure with [ENTER VALUE] placeholders
  'user_provided'        -- Pasted quote table
);

-- Governance action types
CREATE TYPE governance_action AS ENUM (
  'none',
  'warn_only',
  'require_justification',
  'hard_block'
);

-- Job status for async processing
CREATE TYPE job_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Organizations (tenants)
-- Unified entity for all plan tiers (free → pro → team → enterprise)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan_tier plan_tier NOT NULL DEFAULT 'free',
  
  -- Plan limits (nullable = unlimited)
  max_proposals_per_month INTEGER DEFAULT 5,
  max_knowledge_items INTEGER DEFAULT 50,
  max_competitors INTEGER DEFAULT 3,
  
  -- Settings
  settings JSONB NOT NULL DEFAULT '{}',
  -- Example settings:
  -- {
  --   "safe_mode_default": false,
  --   "default_template_id": "uuid",
  --   "brand_colors": { "primary": "#1a365d", "secondary": "#2c5282" },
  --   "default_currency": "USD",
  --   "business_model": {
  --     "summary": "Company business model description...",
  --     "generated_at": "2025-01-15T10:30:00Z",
  --     "generated_by": "ai",
  --     "last_edited_at": "2025-01-16T14:20:00Z",
  --     "last_edited_by": "user_id",
  --     "is_verified": true,
  --     "sources": ["https://company.com", "https://linkedin.com/company/..."],
  --     "confidence": "high"
  --   }
  -- }
  
  -- Feature flags (controlled by plan_tier)
  features JSONB NOT NULL DEFAULT '{}',
  -- Example features:
  -- {
  --   "team_workspaces": false,
  --   "crm_integration": false,
  --   "sso_enabled": false,
  --   "byox_enabled": false
  -- }
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================================================
-- BRANDING & COMPANY PROFILE
-- ============================================================================

-- Brand tone options
CREATE TYPE brand_tone AS ENUM ('professional', 'friendly', 'technical', 'consultative');

-- Brand formality options
CREATE TYPE brand_formality AS ENUM ('formal', 'casual', 'conversational');

-- Content style options
CREATE TYPE content_style AS ENUM ('benefit_focused', 'feature_focused', 'outcome_focused');

-- Competitive positioning options
CREATE TYPE competitive_positioning AS ENUM ('premium', 'value', 'balanced');

-- Generation source tracking
CREATE TYPE generated_by AS ENUM ('ai', 'user');

-- Confidence level for AI-generated content
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

-- Brand Settings (dedicated table for organization branding)
-- One-to-one relationship with organizations
CREATE TABLE brand_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Visual Branding
  primary_color VARCHAR(7),           -- Hex color e.g., "#0033A0"
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  logo_url TEXT,
  favicon_url TEXT,

  -- Typography
  font_heading VARCHAR(100),
  font_body VARCHAR(100),

  -- Brand Voice
  tone brand_tone,
  formality brand_formality,
  key_messages TEXT[] DEFAULT '{}',   -- Array of key brand messages

  -- Content Guidelines
  content_style content_style,
  competitive_positioning competitive_positioning,

  -- Additional guidelines (JSON for flexibility)
  -- Contains: terminology preferences, words to avoid, industry jargon settings
  additional_guidelines JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for brand settings
CREATE INDEX idx_brand_settings_org ON brand_settings(organization_id);

-- Company Profile (AI-generated or user-provided business model summary)
-- Dedicated table for version history, audit trail, and better querying
CREATE TABLE company_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Business Model Summary
  summary TEXT,                       -- Main business model description

  -- Company Details (structured for better querying)
  company_overview TEXT,
  value_proposition TEXT,
  target_customers TEXT,
  revenue_model TEXT,
  key_differentiators TEXT[] DEFAULT '{}',

  -- Industry & Market
  industry VARCHAR(100),
  market_segment VARCHAR(100),
  company_size VARCHAR(50),           -- e.g., "startup", "smb", "enterprise"
  founded_year INTEGER,
  headquarters VARCHAR(255),
  website TEXT,

  -- Generation Metadata
  generated_at TIMESTAMP WITH TIME ZONE,
  generated_by generated_by,
  confidence confidence_level,
  sources TEXT[] DEFAULT '{}',        -- URLs used for generation

  -- Verification
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Edit tracking
  last_edited_at TIMESTAMP WITH TIME ZONE,
  last_edited_by UUID REFERENCES users(id),

  -- Version tracking (for history)
  version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for company profiles
CREATE INDEX idx_company_profiles_org ON company_profiles(organization_id);

-- ============================================================================
-- USERS
-- ============================================================================

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP WITH TIME ZONE,
  name VARCHAR(255),
  image TEXT,
  
  -- Password (nullable for OAuth users)
  password_hash VARCHAR(255),
  
  -- Preferences
  preferences JSONB NOT NULL DEFAULT '{}',
  -- Example preferences:
  -- {
  --   "safe_mode": true,
  --   "theme": "light",
  --   "notifications": { "email": true, "in_app": true }
  -- }
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- Organization Memberships (many-to-many)
-- Enables Linear model: users can belong to multiple organizations
CREATE TABLE organization_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  
  -- Is this the user's default/active organization?
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Invitation tracking
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

-- Indexes for membership lookups
CREATE INDEX idx_org_memberships_org ON organization_memberships(organization_id);
CREATE INDEX idx_org_memberships_user ON organization_memberships(user_id);
CREATE INDEX idx_org_memberships_user_default ON organization_memberships(user_id, is_default) WHERE is_default = true;

-- ============================================================================
-- OPPORTUNITY & PROPOSAL ENTITIES
-- ============================================================================

-- Opportunities (parent entity for all deal-related data)
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status opportunity_status NOT NULL DEFAULT 'open',
  
  -- CRM integration
  external_id VARCHAR(255),           -- e.g., Salesforce Opportunity ID
  external_source VARCHAR(50),        -- 'salesforce', 'hubspot', 'manual'
  external_url TEXT,                  -- Link back to CRM record
  
  -- Deal metadata
  expected_close_date DATE,
  expected_value DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Aggregated deal context (for quick access)
  -- Detailed context in deal_context_items table
  deal_summary JSONB DEFAULT '{}',
  -- Example:
  -- {
  --   "stakeholders": [
  --     { "name": "Jane Smith", "role": "CFO", "type": "economic_buyer" }
  --   ],
  --   "key_requirements": ["SOC 2 compliance", "SSO integration"],
  --   "competitors_mentioned": ["Competitor A", "Competitor B"],
  --   "budget_range": { "min": 50000, "max": 75000, "currency": "USD" }
  -- }
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for opportunity queries
CREATE INDEX idx_opportunities_org ON opportunities(organization_id);
CREATE INDEX idx_opportunities_user ON opportunities(user_id);
CREATE INDEX idx_opportunities_status ON opportunities(organization_id, status);
CREATE INDEX idx_opportunities_external ON opportunities(organization_id, external_source, external_id);

-- Deal Context Items (detailed context for each opportunity)
CREATE TABLE deal_context_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Source information
  source_type context_source_type NOT NULL,
  source_metadata JSONB DEFAULT '{}',
  -- Example for email:
  -- {
  --   "from": "customer@example.com",
  --   "subject": "RE: Proposal Questions",
  --   "date": "2025-01-15T10:30:00Z"
  -- }
  
  -- Content
  raw_content TEXT NOT NULL,          -- Original pasted/imported content
  parsed_content JSONB DEFAULT '{}',  -- Extracted key points
  -- Example parsed_content:
  -- {
  --   "key_points": [
  --     "Budget approved for Q1",
  --     "Need SSO integration",
  --     "Timeline: 3 months implementation"
  --   ],
  --   "stakeholders_mentioned": ["CFO", "IT Director"],
  --   "dates_mentioned": ["2025-03-01"],
  --   "amounts_mentioned": [50000]
  -- }
  
  -- Vector embedding for semantic search
  embedding vector(1536),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for deal context
CREATE INDEX idx_deal_context_opp ON deal_context_items(opportunity_id);
CREATE INDEX idx_deal_context_org ON deal_context_items(organization_id);
CREATE INDEX idx_deal_context_embedding ON deal_context_items USING ivfflat (embedding vector_cosine_ops);

-- Proposals (children of Opportunities)
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Version tracking
  version INTEGER NOT NULL DEFAULT 1,
  parent_version_id UUID REFERENCES proposals(id), -- For iteration history
  
  -- Generation
  status proposal_status NOT NULL DEFAULT 'draft',
  prompt TEXT,                        -- User's natural language prompt
  iteration_prompt TEXT,              -- If this is an iteration, the command
  
  -- Generated content
  slides JSONB DEFAULT '[]',
  -- Example slide:
  -- {
  --   "id": "slide_1",
  --   "layout": "title_centered",
  --   "content": {
  --     "title": "Transforming Your Sales Operations",
  --     "subtitle": "A Proposal for Acme Corp"
  --   },
  --   "speaker_notes": "..."
  -- }
  
  -- Pricing data
  pricing_scenario pricing_scenario,
  pricing_data JSONB DEFAULT '{}',
  -- Example:
  -- {
  --   "line_items": [
  --     { "product": "Enterprise Plan", "quantity": 50, "unit_price": 100, "total": 5000 }
  --   ],
  --   "subtotal": 5000,
  --   "discount_percent": 20,
  --   "discount_amount": 1000,
  --   "total": 4000,
  --   "currency": "USD",
  --   "governance_warnings": [
  --     { "type": "warn_only", "message": "Discount exceeds 15% standard threshold" }
  --   ],
  --   "user_confirmed": true,
  --   "confirmed_at": "2025-01-15T10:30:00Z"
  -- }
  
  -- Strategy extraction status
  strategy_extracted BOOLEAN NOT NULL DEFAULT false,
  
  -- Generation metadata
  generation_metadata JSONB DEFAULT '{}',
  -- Example:
  -- {
  --   "model": "claude-3-5-sonnet-20241022",
  --   "tokens_used": { "input": 5000, "output": 3000 },
  --   "generation_time_ms": 45000,
  --   "context_sources": ["products", "battlecards", "deal_context"],
  --   "safe_mode": false
  -- }
  
  -- Sharing
  share_id VARCHAR(32) UNIQUE,        -- Short ID for share links
  share_enabled BOOLEAN NOT NULL DEFAULT false,
  share_password_hash VARCHAR(255),   -- Optional password protection
  
  -- Analytics
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for proposal queries
CREATE INDEX idx_proposals_opp ON proposals(opportunity_id);
CREATE INDEX idx_proposals_org ON proposals(organization_id);
CREATE INDEX idx_proposals_user ON proposals(user_id);
CREATE INDEX idx_proposals_status ON proposals(organization_id, status);
CREATE INDEX idx_proposals_share ON proposals(share_id) WHERE share_id IS NOT NULL;

-- Strategy Records (extracted PPS data from proposals)
CREATE TABLE strategy_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Positioning data
  positioning JSONB DEFAULT '{}',
  -- Example:
  -- {
  --   "primary_value_prop": "cost_reduction",
  --   "target_persona": "CFO",
  --   "key_differentiators": ["compliance", "integration_speed"],
  --   "competitive_positioning": "premium_quality"
  -- }
  
  -- Pricing data
  pricing JSONB DEFAULT '{}',
  -- Example:
  -- {
  --   "total_contract_value": 150000,
  --   "discount_percent": 25,
  --   "term_months": 36,
  --   "products_included": ["enterprise", "professional_services"],
  --   "pricing_strategy": "aggressive"
  -- }
  
  -- Solutioning data
  solutioning JSONB DEFAULT '{}',
  -- Example:
  -- {
  --   "products_proposed": ["Enterprise Plan", "Training Package"],
  --   "implementation_scope": "full",
  --   "customizations_required": ["SSO", "API Integration"],
  --   "professional_services_days": 15
  -- }
  
  -- Competitive data
  competitive JSONB DEFAULT '{}',
  -- Example:
  -- {
  --   "competitors_mentioned": ["Competitor A"],
  --   "win_themes_used": ["compliance_gap", "implementation_speed"],
  --   "objections_addressed": ["price", "integration_complexity"]
  -- }
  
  -- Outcome (populated when opportunity closes)
  outcome opportunity_status,
  outcome_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for strategy records
CREATE INDEX idx_strategy_proposal ON strategy_records(proposal_id);
CREATE INDEX idx_strategy_opp ON strategy_records(opportunity_id);
CREATE INDEX idx_strategy_org ON strategy_records(organization_id);
CREATE INDEX idx_strategy_outcome ON strategy_records(organization_id, outcome) WHERE outcome IS NOT NULL;

-- ============================================================================
-- KNOWLEDGE BASE ENTITIES
-- ============================================================================

-- Products (product catalog)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Pricing (for codified pricing scenarios)
  pricing_model VARCHAR(50),          -- 'per_seat', 'per_unit', 'flat_fee', 'usage_based'
  base_price DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  billing_frequency VARCHAR(20),      -- 'monthly', 'annual', 'one_time'
  
  -- Detailed pricing tiers
  pricing_tiers JSONB DEFAULT '[]',
  -- Example:
  -- [
  --   { "name": "Starter", "min_seats": 1, "max_seats": 10, "price_per_seat": 29 },
  --   { "name": "Professional", "min_seats": 11, "max_seats": 50, "price_per_seat": 25 },
  --   { "name": "Enterprise", "min_seats": 51, "price_per_seat": 20 }
  -- ]
  
  -- Features and details
  features JSONB DEFAULT '[]',
  -- Example: ["SSO", "API Access", "Priority Support"]
  
  use_cases JSONB DEFAULT '[]',
  -- Example: ["Small business automation", "Enterprise compliance"]
  
  -- For RAG retrieval
  searchable_content TEXT,            -- Concatenated text for full-text search
  embedding vector(1536),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for products
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_active ON products(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_products_category ON products(organization_id, category);
CREATE INDEX idx_products_embedding ON products USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_products_fulltext ON products USING gin (searchable_content gin_trgm_ops);

-- Battlecards (competitive intelligence)
CREATE TABLE battlecards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Competitor info
  competitor_name VARCHAR(255) NOT NULL,
  competitor_website TEXT,
  competitor_logo_url TEXT,
  
  -- Battlecard content (unstructured for MVP)
  raw_content TEXT,                   -- Original pasted/uploaded content
  
  -- Structured content (Phase 2 extraction)
  structured_content JSONB DEFAULT '{}',
  -- Example (Phase 2):
  -- {
  --   "overview": "Enterprise software competitor...",
  --   "strengths": ["Brand recognition", "Feature depth"],
  --   "weaknesses": ["Complex implementation", "High cost"],
  --   "differentiators": ["Our compliance advantage", "Faster time-to-value"],
  --   "win_themes": ["Cost efficiency", "Ease of use"],
  --   "landmines": ["Don't engage on feature count"],
  --   "trap_questions": ["Ask about implementation timeline"],
  --   "fud_points": ["Recent security incident", "Customer churn"]
  -- }
  
  -- For RAG retrieval
  searchable_content TEXT,
  embedding vector(1536),
  
  -- Freshness tracking
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id),
  is_stale BOOLEAN NOT NULL DEFAULT false,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for battlecards
CREATE INDEX idx_battlecards_org ON battlecards(organization_id);
CREATE INDEX idx_battlecards_competitor ON battlecards(organization_id, competitor_name);
CREATE INDEX idx_battlecards_embedding ON battlecards USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_battlecards_fulltext ON battlecards USING gin (searchable_content gin_trgm_ops);

-- Playbooks (sales playbooks, objection handling)
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Categorization
  category VARCHAR(100),              -- 'objection_handling', 'vertical', 'segment', 'use_case'
  vertical VARCHAR(100),              -- 'healthcare', 'financial_services', etc.
  segment VARCHAR(100),               -- 'enterprise', 'mid_market', 'smb'
  
  -- Content
  content TEXT NOT NULL,
  structured_content JSONB DEFAULT '{}',
  
  -- For RAG retrieval
  searchable_content TEXT,
  embedding vector(1536),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for playbooks
CREATE INDEX idx_playbooks_org ON playbooks(organization_id);
CREATE INDEX idx_playbooks_category ON playbooks(organization_id, category);
CREATE INDEX idx_playbooks_vertical ON playbooks(organization_id, vertical);
CREATE INDEX idx_playbooks_embedding ON playbooks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_playbooks_fulltext ON playbooks USING gin (searchable_content gin_trgm_ops);

-- ============================================================================
-- TEMPLATES
-- ============================================================================

-- Proposal Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = system template
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Categorization
  vertical VARCHAR(100),              -- 'saas', 'healthcare', 'financial_services', etc.
  is_system BOOLEAN NOT NULL DEFAULT false, -- System-provided templates
  
  -- Template content
  slide_structure JSONB NOT NULL DEFAULT '[]',
  -- Example:
  -- [
  --   { "layout": "title_centered", "purpose": "opening" },
  --   { "layout": "agenda", "purpose": "overview" },
  --   { "layout": "bullet_list", "purpose": "challenges" },
  --   { "layout": "two_column", "purpose": "solution" },
  --   { "layout": "pricing_table", "purpose": "investment" },
  --   { "layout": "next_steps", "purpose": "closing" }
  -- ]
  
  -- Styling
  brand_settings JSONB DEFAULT '{}',
  -- Example:
  -- {
  --   "primary_color": "#1a365d",
  --   "secondary_color": "#2c5282",
  --   "font_heading": "Arial",
  --   "font_body": "Arial",
  --   "logo_url": "https://..."
  -- }
  
  -- Usage tracking
  use_count INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for templates
CREATE INDEX idx_templates_org ON templates(organization_id);
CREATE INDEX idx_templates_system ON templates(is_system) WHERE is_system = true;
CREATE INDEX idx_templates_vertical ON templates(vertical);

-- ============================================================================
-- GOVERNANCE & PRICING CONFIGURATION
-- ============================================================================

-- Governance Policies
CREATE TABLE governance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Scope
  name VARCHAR(255) NOT NULL,
  scope_type VARCHAR(50) NOT NULL,    -- 'global', 'product_family', 'region', 'segment'
  scope_value VARCHAR(255),           -- e.g., product family name, region code
  
  -- Priority (higher = takes precedence)
  priority INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Governance Rules
CREATE TABLE governance_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES governance_policies(id) ON DELETE CASCADE,
  
  -- Rule definition
  rule_type VARCHAR(50) NOT NULL,     -- 'max_discount', 'min_margin', 'required_approval'
  operator VARCHAR(20) NOT NULL,      -- 'gt', 'gte', 'lt', 'lte', 'eq'
  threshold DECIMAL(10, 4) NOT NULL,  -- e.g., 0.30 for 30%
  
  -- Target roles (who this applies to)
  target_roles JSONB DEFAULT '[]',    -- ['member', 'manager'] or [] for all
  
  -- Action
  action governance_action NOT NULL DEFAULT 'warn_only',
  message_template TEXT,              -- "Discount of {value}% exceeds {threshold}% limit"
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for governance
CREATE INDEX idx_governance_policies_org ON governance_policies(organization_id);
CREATE INDEX idx_governance_rules_policy ON governance_rules(policy_id);

-- ============================================================================
-- ASYNC JOB QUEUE
-- ============================================================================

-- Jobs (for BullMQ tracking and debugging)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Job info
  type VARCHAR(50) NOT NULL,          -- 'proposal_generation', 'export', 'ingestion'
  status job_status NOT NULL DEFAULT 'queued',
  
  -- Reference to related entity
  reference_type VARCHAR(50),         -- 'proposal', 'battlecard', etc.
  reference_id UUID,
  
  -- Job data
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  
  -- Progress tracking (for SSE)
  progress INTEGER DEFAULT 0,         -- 0-100
  progress_message TEXT,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for jobs
CREATE INDEX idx_jobs_org ON jobs(organization_id);
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status IN ('queued', 'processing');
CREATE INDEX idx_jobs_reference ON jobs(reference_type, reference_id);

-- ============================================================================
-- ANALYTICS & TRACKING
-- ============================================================================

-- Proposal Views (for shared proposals)
CREATE TABLE proposal_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  
  -- Viewer info (anonymous)
  viewer_ip_hash VARCHAR(64),         -- Hashed IP for uniqueness
  viewer_user_agent TEXT,
  
  -- View data
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  time_spent_seconds INTEGER,
  max_scroll_depth INTEGER,           -- 0-100 percentage
  slides_viewed JSONB DEFAULT '[]'    -- Array of slide IDs viewed
);

-- Index for proposal views
CREATE INDEX idx_proposal_views_proposal ON proposal_views(proposal_id);
CREATE INDEX idx_proposal_views_time ON proposal_views(proposal_id, viewed_at);

-- Usage Tracking (for plan limits)
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Usage counts
  proposals_generated INTEGER NOT NULL DEFAULT 0,
  knowledge_items_count INTEGER NOT NULL DEFAULT 0,
  competitors_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(organization_id, period_start)
);

-- Index for usage tracking
CREATE INDEX idx_usage_org_period ON usage_tracking(organization_id, period_start);

-- ============================================================================
-- NEXTAUTH.JS TABLES
-- ============================================================================

-- Accounts (OAuth providers)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user ON accounts(user_id);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Verification Tokens (email verification, password reset)
CREATE TABLE verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  
  PRIMARY KEY (identifier, token)
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_context_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE battlecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be created in application code or migrations
-- based on the specific authentication approach used.
-- Example policy (create in migration):
--
-- CREATE POLICY "Users can only access their organization's data"
--   ON opportunities
--   FOR ALL
--   USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_settings_updated_at BEFORE UPDATE ON brand_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_profiles_updated_at BEFORE UPDATE ON company_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_memberships_updated_at BEFORE UPDATE ON organization_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategy_records_updated_at BEFORE UPDATE ON strategy_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_battlecards_updated_at BEFORE UPDATE ON battlecards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playbooks_updated_at BEFORE UPDATE ON playbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_governance_policies_updated_at BEFORE UPDATE ON governance_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Optional - System Templates)
-- ============================================================================

-- System templates (5 verticals as per PRD)
INSERT INTO templates (name, description, vertical, is_system, slide_structure) VALUES
('SaaS Standard', 'Standard template for SaaS sales proposals', 'saas', true, 
 '[{"layout":"title_centered","purpose":"opening"},{"layout":"agenda","purpose":"overview"},{"layout":"bullet_list","purpose":"challenges"},{"layout":"two_column","purpose":"solution"},{"layout":"comparison_table","purpose":"differentiation"},{"layout":"pricing_table","purpose":"investment"},{"layout":"timeline","purpose":"implementation"},{"layout":"next_steps","purpose":"closing"}]'::jsonb),

('Financial Services', 'Compliance-focused template for financial services', 'financial_services', true,
 '[{"layout":"title_centered","purpose":"opening"},{"layout":"agenda","purpose":"overview"},{"layout":"bullet_list","purpose":"compliance_challenges"},{"layout":"two_column","purpose":"solution"},{"layout":"comparison_table","purpose":"security"},{"layout":"case_study","purpose":"proof"},{"layout":"pricing_table","purpose":"investment"},{"layout":"next_steps","purpose":"closing"}]'::jsonb),

('Healthcare', 'HIPAA-aware template for healthcare organizations', 'healthcare', true,
 '[{"layout":"title_centered","purpose":"opening"},{"layout":"agenda","purpose":"overview"},{"layout":"bullet_list","purpose":"patient_outcomes"},{"layout":"two_column","purpose":"solution"},{"layout":"roi_calculator","purpose":"value"},{"layout":"case_study","purpose":"proof"},{"layout":"pricing_table","purpose":"investment"},{"layout":"next_steps","purpose":"closing"}]'::jsonb),

('Manufacturing', 'Operations-focused template for manufacturing', 'manufacturing', true,
 '[{"layout":"title_centered","purpose":"opening"},{"layout":"agenda","purpose":"overview"},{"layout":"bullet_list","purpose":"operational_challenges"},{"layout":"two_column","purpose":"solution"},{"layout":"roi_calculator","purpose":"efficiency_gains"},{"layout":"timeline","purpose":"implementation"},{"layout":"pricing_table","purpose":"investment"},{"layout":"next_steps","purpose":"closing"}]'::jsonb),

('Public Sector', 'Procurement-ready template for government', 'public_sector', true,
 '[{"layout":"title_centered","purpose":"opening"},{"layout":"agenda","purpose":"overview"},{"layout":"bullet_list","purpose":"mission_alignment"},{"layout":"two_column","purpose":"solution"},{"layout":"comparison_table","purpose":"compliance"},{"layout":"pricing_tiers","purpose":"investment"},{"layout":"timeline","purpose":"implementation"},{"layout":"next_steps","purpose":"closing"}]'::jsonb);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
