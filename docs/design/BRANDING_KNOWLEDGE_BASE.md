# Corporate Branding in Knowledge Base
**Version:** 1.0  
**Status:** Design Specification  
**Last Updated:** December 2025

---

## Overview

Corporate branding must be consistently applied across the knowledge base to ensure that when KB content is used in proposals, it maintains brand voice, tone, and visual identity. This document outlines where and how branding is integrated into the knowledge base workflow.

---

## Branding Integration Points

### 1. Organization Settings (Primary Configuration)

**Location:** `/settings/organization` → Branding Section

**Stored In:** Dedicated `brand_settings` table (one-to-one with organizations)

**Database Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `primary_color` | VARCHAR(7) | Hex color e.g., "#0033A0" |
| `secondary_color` | VARCHAR(7) | Secondary brand color |
| `accent_color` | VARCHAR(7) | Accent color for highlights |
| `logo_url` | TEXT | URL to organization logo |
| `font_heading` | VARCHAR(100) | Heading font family |
| `font_body` | VARCHAR(100) | Body text font family |
| `tone` | ENUM | 'professional', 'friendly', 'technical', 'consultative' |
| `formality` | ENUM | 'formal', 'casual', 'conversational' |
| `key_messages` | TEXT[] | Array of key brand messages |
| `content_style` | ENUM | 'benefit_focused', 'feature_focused', 'outcome_focused' |
| `competitive_positioning` | ENUM | 'premium', 'value', 'balanced' |
| `additional_guidelines` | JSONB | Flexible JSON for custom guidelines |

**Navigation Path:**
```
Settings → Organization → Branding Tab
```

---

### 2. Knowledge Base Entry Points

#### A. Products (`/knowledge/products`)

**Branding Application:**
- Product descriptions should reflect brand voice
- Pricing presentation uses brand colors
- Feature lists use brand terminology
- Use cases align with brand messaging

**UI Location:**
- When adding/editing products, show "Brand Preview" panel
- Display how product will appear in proposals with brand styling
- Include brand voice suggestions in description editor

**Implementation:**
```typescript
// When creating/editing product
interface ProductForm {
  name: string;
  description: string; // Should match brand voice
  // ... other fields
  brandPreview?: {
    // Shows how it will look in proposal
    styledDescription: string;
    colorScheme: BrandColors;
  }
}
```

#### B. Battlecards (`/knowledge/battlecards`)

**Branding Application:**
- Competitive positioning uses brand messaging
- Win themes reflect brand value propositions
- Differentiators use brand language
- FUD points align with brand positioning

**UI Location:**
- Battlecard editor includes "Brand Alignment" indicator
- Shows how competitive claims match brand guidelines
- Suggests brand-consistent language for differentiators

**Implementation:**
```typescript
// Battlecard with brand context
interface Battlecard {
  competitor_name: string;
  raw_content: string;
  structured_content: {
    differentiators: string[]; // Should use brand language
    win_themes: string[]; // Should align with brand messaging
    // ...
  };
  brand_alignment_score?: number; // 0-100
}
```

#### C. Playbooks (`/knowledge/playbooks`)

**Branding Application:**
- Objection handling uses brand voice
- Sales scripts match brand tone
- Value propositions reflect brand messaging
- Customer-facing language is brand-consistent

**UI Location:**
- Playbook editor shows brand voice guidelines
- Real-time preview of how playbook content appears with brand styling
- Tone checker to ensure brand consistency

---

### 3. Proposal Generation Integration

**Location:** Context Assembly Engine (`lib/ai/context.ts`)

**How Branding is Applied:**

1. **When Retrieving KB Content:**
   - Product descriptions are styled with brand colors
   - Battlecard content uses brand positioning language
   - Playbook content maintains brand voice

2. **In Proposal Generation Prompts:**
   ```typescript
   // Retrieve brand settings from dedicated table
   const brandSettings = await prisma.brandSettings.findUnique({
     where: { organizationId }
   });

   const brandContext = {
     colors: {
       primary: brandSettings?.primaryColor,
       secondary: brandSettings?.secondaryColor,
       accent: brandSettings?.accentColor,
     },
     voice: {
       tone: brandSettings?.tone,
       formality: brandSettings?.formality,
       keyMessages: brandSettings?.keyMessages ?? [],
     },
     guidelines: {
       contentStyle: brandSettings?.contentStyle,
       competitivePositioning: brandSettings?.competitivePositioning,
     },
     logo: brandSettings?.logoUrl,
   };

   // Included in system prompt
   const systemPrompt = `
     ...existing prompt...

     BRAND GUIDELINES:
     - Primary Color: ${brandContext.colors.primary}
     - Brand Voice: ${brandContext.voice.tone}
     - Key Messages: ${brandContext.voice.keyMessages.join(', ')}
     - When describing products from knowledge base, use ${brandContext.guidelines.contentStyle} style
     - Competitive positioning should reflect: ${brandContext.guidelines.competitivePositioning}
   `;
   ```

3. **In PPTX Export:**
   - Brand colors applied to slide backgrounds, headers, accents
   - Logo inserted on title slide and footer
   - Typography matches brand guidelines
   - Product descriptions use brand-styled formatting

---

## Navigation Structure

### Updated Knowledge Base Navigation

```
/knowledge
├── /knowledge/products
│   ├── /knowledge/products/new          # Add product (with brand preview)
│   └── /knowledge/products/[id]/edit   # Edit product (with brand preview)
├── /knowledge/battlecards
│   ├── /knowledge/battlecards/new      # Add battlecard (with brand alignment)
│   └── /knowledge/battlecards/[id]/edit # Edit battlecard (with brand alignment)
├── /knowledge/playbooks
│   ├── /knowledge/playbooks/new        # Add playbook (with brand voice checker)
│   └── /knowledge/playbooks/[id]/edit  # Edit playbook (with brand voice checker)
├── /knowledge/branding                 # Branding guidelines for KB
│   ├── Brand Voice Settings
│   ├── Content Style Guide
│   └── Preview Examples
└── /knowledge/company-profile           # Organization business model summary
```

### New Navigation Item: Branding Guidelines

**Location:** `/knowledge/branding` (sub-section of Knowledge Base)

**Purpose:** 
- Show how brand settings affect KB content
- Provide examples of brand-consistent content
- Offer guidance for writing brand-aligned KB entries

**UI Components:**
- Brand voice examples
- Content style guide
- Preview of how KB content appears in proposals
- Brand color palette
- Logo preview

---

## Implementation Plan Updates

### Sprint 3: Context & Knowledge Base (Updated)

**Additional Tasks:**

| ID | Task | Points | Owner |
|----|------|--------|-------|
| T3-010 | Add brand preview panel to product editor | 3 | Eng 2 |
| T3-011 | Implement brand voice checker for battlecards | 3 | Eng 1 |
| T3-012 | Add brand guidelines page to KB section | 3 | Eng 2 |
| T3-013 | Integrate brand context into Context Assembly Engine | 5 | Eng 1 |

**Updated User Stories:**

| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S3-006 | As a user, I can see how my product descriptions will appear with brand styling | 3 | Eng 2 |
| S3-007 | As a user, I can view brand guidelines when creating KB content | 2 | Eng 2 |
| S3-008 | As a user, my proposals automatically use brand colors and voice from KB content | 5 | Eng 1 |

---

## UI/UX Design

### Product Editor with Brand Preview

```
┌─────────────────────────────────────────────────┐
│  Edit Product: Enterprise Plan                 │
├──────────────────┬──────────────────────────────┤
│                  │                              │
│  Product Details │  Brand Preview               │
│                  │                              │
│  Name:           │  [Styled Product Card]      │
│  [Enterprise...]│  - Uses brand colors        │
│                  │  - Shows logo                │
│  Description:    │  - Brand voice applied       │
│  [Text area...]  │                              │
│                  │  Preview in Proposal:       │
│  Pricing:        │  [Slide preview]             │
│  [Fields...]     │                              │
│                  │                              │
│  [Save] [Cancel]│                              │
└──────────────────┴──────────────────────────────┘
```

### Brand Guidelines Page

```
/knowledge/branding

┌─────────────────────────────────────────────────┐
│  Brand Guidelines for Knowledge Base            │
├─────────────────────────────────────────────────┤
│                                                  │
│  Brand Voice                                    │
│  ┌──────────────────────────────────────────┐  │
│  │ Tone: Professional                        │  │
│  │ Formality: Formal                         │  │
│  │ Key Messages: Innovation, Trust          │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Content Style Guide                            │
│  ┌──────────────────────────────────────────┐  │
│  │ Product Descriptions: Benefit-focused     │  │
│  │ Competitive Positioning: Premium         │  │
│  │ Example: "Transform your operations..."    │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Visual Branding                               │
│  ┌──────────────────────────────────────────┐  │
│  │ Primary: #0033A0  Secondary: #2c5282     │  │
│  │ [Logo Preview]                           │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Preview Examples                               │
│  ┌──────────────────────────────────────────┐  │
│  │ [How products appear in proposals]       │  │
│  │ [How battlecards appear in proposals]     │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Database Schema

**Dedicated `brand_settings` table** for better queryability, version history support, and cleaner separation:

```sql
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

  -- Brand Voice (enums)
  tone brand_tone,                    -- 'professional', 'friendly', 'technical', 'consultative'
  formality brand_formality,          -- 'formal', 'casual', 'conversational'
  key_messages TEXT[] DEFAULT '{}',   -- Array of key brand messages

  -- Content Guidelines (enums)
  content_style content_style,        -- 'benefit_focused', 'feature_focused', 'outcome_focused'
  competitive_positioning competitive_positioning, -- 'premium', 'value', 'balanced'

  -- Additional guidelines (JSON for flexibility)
  additional_guidelines JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**Prisma Model:**
```prisma
model BrandSettings {
  id             String                 @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  organizationId String                 @unique @map("organization_id") @db.Uuid

  // Visual Branding
  primaryColor   String?                @map("primary_color") @db.VarChar(7)
  secondaryColor String?                @map("secondary_color") @db.VarChar(7)
  accentColor    String?                @map("accent_color") @db.VarChar(7)
  logoUrl        String?                @map("logo_url")

  // Brand Voice
  tone           BrandTone?
  formality      BrandFormality?
  keyMessages    String[]               @default([]) @map("key_messages")

  // Content Guidelines
  contentStyle          ContentStyle?
  competitivePositioning CompetitivePositioning?

  // Relations
  organization   Organization           @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("brand_settings")
}
```

**Benefits of dedicated table:**
- Type-safe enum fields (tone, formality, content_style, competitive_positioning)
- Better queryability (can query organizations by brand characteristics)
- Cleaner API responses (no need to extract from nested JSON)
- Easier to add version history later
- Clear separation from general organization settings

### API Updates

**New Endpoints:**

```
GET  /api/knowledge/branding/guidelines
     Returns brand guidelines for KB content creation

GET  /api/knowledge/branding/preview
     Returns preview of how KB content appears with branding
     Query params: content_type, content_id
```

### Context Assembly Engine Updates

```typescript
// lib/ai/context.ts

export async function assembleContext(
  opportunityId: string,
  organizationId: string
): Promise<AssembledContext> {
  // Retrieve brand settings from dedicated table
  const brandSettings = await prisma.brandSettings.findUnique({
    where: { organizationId }
  });

  const brandContext = brandSettings ? {
    colors: {
      primary: brandSettings.primaryColor,
      secondary: brandSettings.secondaryColor,
      accent: brandSettings.accentColor,
    },
    voice: {
      tone: brandSettings.tone,
      formality: brandSettings.formality,
      keyMessages: brandSettings.keyMessages,
    },
    guidelines: {
      contentStyle: brandSettings.contentStyle,
      competitivePositioning: brandSettings.competitivePositioning,
    },
    logo: brandSettings.logoUrl,
  } : null;

  // Retrieve KB content
  const products = await getRelevantProducts(opportunityId);
  const battlecards = await getRelevantBattlecards(opportunityId);
  const playbooks = await getRelevantPlaybooks(opportunityId);

  // Apply brand styling to KB content (if brand settings exist)
  const brandedProducts = brandContext
    ? products.map(p => ({
        ...p,
        styledDescription: applyBrandVoice(p.description, brandContext.voice),
        brandColors: brandContext.colors
      }))
    : products;

  return {
    // ... other context
    products: brandedProducts,
    battlecards: brandContext ? applyBrandPositioning(battlecards, brandContext) : battlecards,
    playbooks: brandContext ? applyBrandVoice(playbooks, brandContext.voice) : playbooks,
    brandContext
  };
}
```

---

## User Workflow

### Creating Branded KB Content

1. **Navigate to Knowledge Base**
   - `/knowledge/products` or `/knowledge/battlecards`

2. **View Brand Guidelines** (Optional)
   - Click "Brand Guidelines" link in KB section
   - Review brand voice, style guide, examples

3. **Create/Edit Content**
   - Fill in content fields
   - Brand preview panel shows how it will appear
   - Brand voice checker suggests improvements

4. **Save**
   - Content stored with organization_id
   - Brand context automatically applied when used in proposals

### Using Branded KB in Proposals

1. **Generate Proposal**
   - KB content automatically retrieved
   - Brand context included in generation prompt
   - LLM uses brand voice and colors

2. **View Proposal**
   - Brand colors applied to slides
   - Logo inserted automatically
   - KB content styled with brand formatting

3. **Export**
   - PPTX/PDF uses brand colors and logo
   - Consistent brand identity throughout

---

## Acceptance Criteria

### Sprint 3 Updates

- [ ] Brand preview panel visible in product editor
- [ ] Brand guidelines page accessible from KB navigation
- [ ] Brand voice checker suggests improvements for battlecards
- [ ] KB content in proposals uses brand colors and voice
- [ ] Brand context included in Context Assembly Engine
- [ ] Logo automatically inserted in proposal exports

---

## Future Enhancements (Post-MVP)

1. **Brand Voice AI Assistant**
   - Suggests brand-consistent language while typing
   - Real-time brand alignment scoring

2. **Brand Templates for KB**
   - Pre-filled templates with brand voice
   - Industry-specific brand templates

3. **Brand Compliance Dashboard**
   - Shows % of KB content aligned with brand
   - Flags content that needs brand review

4. **Multi-Brand Support**
   - Different brands for different product lines
   - Brand selection per opportunity

---

## Summary

**Where Branding is Addressed:**

1. **Configuration:** `/settings/organization` → Branding tab
2. **Knowledge Base:** 
   - Brand preview in product/battlecard/playbook editors
   - Brand guidelines page at `/knowledge/branding`
3. **Proposal Generation:** Brand context automatically applied via Context Assembly Engine
4. **Navigation:** Branding guidelines accessible from KB section

**Key Integration Points:**
- Organization settings store brand configuration
- KB editors show brand preview
- Context Assembly Engine applies brand to KB content
- Proposal generation uses branded KB content
- Exports maintain brand identity

---

**Next Steps:**
1. Update Sprint 3 tasks to include branding integration
2. Design brand preview UI components
3. Implement brand context in Context Assembly Engine
4. Add brand guidelines page to navigation
5. Test brand consistency across KB → Proposal flow

