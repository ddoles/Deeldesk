# Context Assembly Engine Architecture

**Version:** 1.0
**Status:** MVP Specification
**Last Updated:** December 2025

---

## Overview

The Context Assembly Engine is responsible for dynamically retrieving and assembling relevant context for each proposal generation. It ensures that the LLM has access to the right information while staying within token budget limits.

---

## Context Layers

Context is assembled in layers, from foundational (always included) to supplementary (RAG-retrieved and token-budgeted).

```
┌─────────────────────────────────────────────────────────────────┐
│                    Context Assembly Layers                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  6. Historical Patterns      (Phase 2 - winning strategies)     │
│  ─────────────────────────────────────────────────────────────  │
│  5. Playbooks                (RAG-retrieved, 10% budget)        │
│  ─────────────────────────────────────────────────────────────  │
│  4. Competitive/Battlecards  (RAG-retrieved, 20% budget)        │
│  ─────────────────────────────────────────────────────────────  │
│  3. Products                 (RAG-retrieved, 30% budget)        │
│  ─────────────────────────────────────────────────────────────  │
│  2. Deal Context             (RAG-retrieved, 40% budget)        │
│  ─────────────────────────────────────────────────────────────  │
│  1b. Brand Context           (always included, ~200 tokens)     │
│  ─────────────────────────────────────────────────────────────  │
│  1a. Business Model Summary  (always included, ~500 tokens)     │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════│
│                    FOUNDATIONAL (Never Truncated)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Token Budget Allocation

### Total Context Budget

The total context budget depends on the LLM model being used:

| Model | Max Context | Reserved for Output | Available for Context |
|-------|-------------|---------------------|----------------------|
| Claude 3.5 Sonnet | 200K tokens | 4K tokens | ~196K tokens |
| Claude 3.5 Sonnet (Bedrock) | 200K tokens | 4K tokens | ~196K tokens |

**Practical Budget:** While models support large contexts, we target ~32K tokens for optimal performance and cost efficiency.

### Budget Categories

#### 1. Foundational Context (Always Included, Never Truncated)

| Context Type | Target Budget | Max Budget | Source |
|--------------|---------------|------------|--------|
| Company Profile | ~500 tokens | 1,000 tokens | `company_profiles` table |
| Brand Context | ~200 tokens | 500 tokens | `brand_settings` table |
| System Prompt | ~1,000 tokens | 1,500 tokens | Static template |

**Total Foundational:** ~1,700 tokens (reserved, never truncated)

#### 2. RAG-Retrieved Context (Token-Budgeted)

After foundational context, the remaining budget is allocated by percentage:

| Context Type | % of Remaining | Truncation Priority | Notes |
|--------------|----------------|---------------------|-------|
| Deal Context | 40% | 1 (last to truncate) | Most deal-relevant |
| Products | 30% | 2 | Relevant catalog entries |
| Competitive | 20% | 3 | Mentioned competitors only |
| Playbooks | 10% | 4 (first to truncate) | Supplementary guidance |

**Example Budget Calculation (32K target):**
```
Total Target:           32,000 tokens
- Foundational:          1,700 tokens
- Safety Buffer:         1,300 tokens
= Available for RAG:    29,000 tokens

Deal Context:     40% = 11,600 tokens
Products:         30% =  8,700 tokens
Competitive:      20% =  5,800 tokens
Playbooks:        10% =  2,900 tokens
```

---

## Context Sources

### 1a. Company Profile

**Source:** `company_profiles` table (dedicated table, one-to-one with organizations)

**Content:**
- Company overview and summary
- Value proposition
- Target customers
- Key differentiators
- Industry and market segment
- Verification status

**Retrieval:**
```typescript
const companyProfile = await prisma.companyProfile.findUnique({
  where: { organizationId }
});

const companyContext = companyProfile ? {
  summary: companyProfile.summary,
  companyOverview: companyProfile.companyOverview,
  valueProposition: companyProfile.valueProposition,
  targetCustomers: companyProfile.targetCustomers,
  keyDifferentiators: companyProfile.keyDifferentiators,
  industry: companyProfile.industry,
  isVerified: companyProfile.isVerified,
} : null;
```

**Inclusion Rules:**
- Always included when available
- If not set, omitted (not placeholder text)
- Never truncated

---

### 1b. Brand Context

**Source:** `brand_settings` table (dedicated table, one-to-one with organizations)

**Content:**
- Brand voice and tone guidelines
- Key messaging principles
- Content style preferences
- Competitive positioning

**Retrieval:**
```typescript
const brandSettings = await prisma.brandSettings.findUnique({
  where: { organizationId }
});

const brandContext = brandSettings ? {
  tone: brandSettings.tone,
  formality: brandSettings.formality,
  keyMessages: brandSettings.keyMessages,
  contentStyle: brandSettings.contentStyle,
  competitivePositioning: brandSettings.competitivePositioning,
} : null;
```

**Inclusion Rules:**
- Always included when any brand settings exist
- Never truncated

---

### 2. Deal Context

**Source:** `deal_context_items` table

**Content:**
- Pasted emails, call notes, meeting summaries
- Customer requirements and pain points
- Stakeholder information
- Budget signals

**Retrieval Strategy:**
```typescript
// Retrieve all context items for the opportunity
const contextItems = await prisma.dealContextItem.findMany({
  where: { opportunityId },
  orderBy: { createdAt: 'desc' },
});

// Concatenate and truncate to budget
const dealContext = truncateToTokenBudget(
  contextItems.map(c => c.rawContent).join('\n\n'),
  budgets.dealContext
);
```

**Truncation Rules:**
- Most recent items prioritized
- Truncate oldest items first
- Maintain sentence boundaries when possible

---

### 3. Products

**Source:** `products` table with vector similarity

**Content:**
- Product names and descriptions
- Features and benefits
- Pricing information (if codified)
- Use cases

**Retrieval Strategy:**
```typescript
// Embed the user prompt + deal context for relevance
const queryEmbedding = await generateEmbedding(userPrompt + dealContextSummary);

// Vector similarity search
const relevantProducts = await prisma.$queryRaw`
  SELECT *, embedding <=> ${queryEmbedding}::vector AS distance
  FROM products
  WHERE organization_id = ${organizationId}
    AND is_active = true
  ORDER BY distance
  LIMIT 10
`;

// Truncate to budget
const productContext = truncateToTokenBudget(
  formatProducts(relevantProducts),
  budgets.products
);
```

**Truncation Rules:**
- Lower relevance products removed first
- Core product info preserved over detailed features

---

### 4. Competitive/Battlecards

**Source:** `battlecards` table with competitor mention detection

**Content:**
- Competitor strengths and weaknesses
- Win themes and differentiators
- Objection handling
- Competitive positioning

**Retrieval Strategy:**
```typescript
// Detect mentioned competitors in deal context
const mentionedCompetitors = detectCompetitors(dealContext, knownCompetitors);

// Retrieve battlecards for mentioned competitors
const battlecards = await prisma.battlecard.findMany({
  where: {
    organizationId,
    competitorName: { in: mentionedCompetitors },
    isActive: true,
  },
});

// Also include vector similarity matches
const similarBattlecards = await vectorSearch(queryEmbedding, 'battlecards', 5);

// Dedupe and truncate
const competitiveContext = truncateToTokenBudget(
  formatBattlecards(dedupeById([...battlecards, ...similarBattlecards])),
  budgets.competitive
);
```

**Truncation Rules:**
- Mentioned competitors prioritized over similar matches
- Win themes and differentiators preserved over detailed analysis

---

### 5. Playbooks

**Source:** `playbooks` table with vector similarity

**Content:**
- Sales playbooks for verticals/segments
- Objection handling scripts
- Discovery questions
- Closing strategies

**Retrieval Strategy:**
```typescript
// Vector similarity search
const relevantPlaybooks = await vectorSearch(queryEmbedding, 'playbooks', 5);

// Filter by vertical/segment if known
const filteredPlaybooks = filterByContext(relevantPlaybooks, dealContext);

// Truncate to budget
const playbookContext = truncateToTokenBudget(
  formatPlaybooks(filteredPlaybooks),
  budgets.playbooks
);
```

**Truncation Rules:**
- Lowest relevance playbooks removed first
- This is first category to be truncated when over budget

---

## Overflow Handling

### Detection

```typescript
interface ContextBudgetStatus {
  totalTokens: number;
  budgetLimit: number;
  isOverBudget: boolean;
  truncatedCategories: string[];
  truncationDetails: {
    category: string;
    originalTokens: number;
    finalTokens: number;
    itemsRemoved: number;
  }[];
}
```

### Truncation Order

When context exceeds budget, truncation follows this priority:

1. **Playbooks** (first to truncate) — Supplementary, least deal-specific
2. **Competitive** — Important but can be summarized
3. **Products** — Core but can reduce detail level
4. **Deal Context** (last to truncate) — Most deal-relevant
5. **Brand Context** — Never truncated
6. **Business Model** — Never truncated

### User Warning

When significant truncation occurs (>20% of any category), warn the user:

```typescript
if (budgetStatus.truncatedCategories.length > 0) {
  yield {
    type: 'warning',
    code: 'CONTEXT_TRUNCATED',
    message: 'Some context was truncated due to size limits.',
    details: budgetStatus.truncationDetails,
    suggestions: [
      'Consider removing older deal context items',
      'Focus on most relevant products',
    ],
  };
}
```

### Logging

All truncation events are logged for monitoring:

```typescript
logger.info('Context assembled', {
  organizationId,
  opportunityId,
  totalTokens: budgetStatus.totalTokens,
  truncated: budgetStatus.isOverBudget,
  truncatedCategories: budgetStatus.truncatedCategories,
});
```

---

## Assembly Process

### Complete Flow

```typescript
// lib/ai/context.ts

export async function assembleContext(
  opportunityId: string,
  organizationId: string,
  userPrompt: string,
  options: AssemblyOptions = {}
): Promise<AssembledContext> {
  const opportunity = await getOpportunity(opportunityId);

  // 1. Foundational context from dedicated tables (always included)
  const [companyProfile, brandSettings] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { organizationId } }),
    prisma.brandSettings.findUnique({ where: { organizationId } }),
  ]);

  const companyContext = companyProfile ? {
    summary: companyProfile.summary,
    companyOverview: companyProfile.companyOverview,
    valueProposition: companyProfile.valueProposition,
    targetCustomers: companyProfile.targetCustomers,
    keyDifferentiators: companyProfile.keyDifferentiators,
    industry: companyProfile.industry,
    isVerified: companyProfile.isVerified,
  } : null;

  const brandContext = brandSettings ? {
    tone: brandSettings.tone,
    formality: brandSettings.formality,
    keyMessages: brandSettings.keyMessages,
    contentStyle: brandSettings.contentStyle,
    competitivePositioning: brandSettings.competitivePositioning,
  } : null;

  // 2. Calculate remaining budget
  const foundationalTokens = countTokens(
    JSON.stringify(companyContext) + JSON.stringify(brandContext)
  );
  const remainingBudget = options.targetBudget - foundationalTokens - SAFETY_BUFFER;

  // 3. Calculate category budgets
  const budgets = calculateBudgets(remainingBudget);

  // 4. Generate query embedding
  const queryEmbedding = await generateEmbedding(userPrompt);

  // 5. Retrieve RAG context (parallel)
  const [dealContext, products, competitive, playbooks] = await Promise.all([
    retrieveDealContext(opportunityId, budgets.dealContext),
    retrieveProducts(organizationId, queryEmbedding, budgets.products),
    retrieveCompetitive(organizationId, queryEmbedding, dealContext, budgets.competitive),
    retrievePlaybooks(organizationId, queryEmbedding, budgets.playbooks),
  ]);

  // 6. Assemble final context
  return {
    companyProfile: companyContext,
    brandContext,
    dealContext,
    products,
    competitive,
    playbooks,
    budgetStatus: calculateBudgetStatus(...),
  };
}
```

### Interface Definition

```typescript
interface AssembledContext {
  // Foundational (never truncated) - from dedicated tables
  companyProfile: CompanyProfileContext | null;
  brandContext: BrandContext | null;

  // RAG-retrieved (token-budgeted)
  dealContext: string;
  products: ProductContext[];
  competitive: BattlecardContext[];
  playbooks: PlaybookContext[];

  // Metadata
  budgetStatus: ContextBudgetStatus;
  retrievalMetrics: {
    dealContextItems: number;
    productsRetrieved: number;
    battlecardsRetrieved: number;
    playbooksRetrieved: number;
  };
}

interface CompanyProfileContext {
  summary: string | null;
  companyOverview: string | null;
  valueProposition: string | null;
  targetCustomers: string | null;
  keyDifferentiators: string[];
  industry: string | null;
  isVerified: boolean;
}

interface BrandContext {
  tone: 'professional' | 'friendly' | 'technical' | 'consultative' | null;
  formality: 'formal' | 'casual' | 'conversational' | null;
  keyMessages: string[];
  contentStyle: 'benefit_focused' | 'feature_focused' | 'outcome_focused' | null;
  competitivePositioning: 'premium' | 'value' | 'balanced' | null;
}
```

---

## Performance Considerations

### Parallel Retrieval

All RAG retrievals happen in parallel to minimize latency:

```typescript
const [dealContext, products, competitive, playbooks] = await Promise.all([
  retrieveDealContext(...),
  retrieveProducts(...),
  retrieveCompetitive(...),
  retrievePlaybooks(...),
]);
```

### Caching

- **Organization settings:** Cached for 5 minutes (brand, business model rarely change)
- **Embeddings:** Cached indefinitely (content-addressed)
- **Vector search results:** Not cached (query-dependent)

### Target Latency

| Operation | Target P95 |
|-----------|------------|
| Total context assembly | <2 seconds |
| Embedding generation | <500ms |
| Vector search (per table) | <200ms |
| Token counting | <50ms |

---

## Testing

### Unit Tests

```typescript
describe('Context Assembly', () => {
  it('should never truncate foundational context', async () => {
    const context = await assembleContext(oppId, orgId, prompt, {
      targetBudget: 1000, // Very small budget
    });

    expect(context.businessModel).toBe(fullBusinessModel);
    expect(context.brandContext).toEqual(fullBrandContext);
    expect(context.budgetStatus.truncatedCategories).not.toContain('businessModel');
    expect(context.budgetStatus.truncatedCategories).not.toContain('brandContext');
  });

  it('should truncate playbooks before deal context', async () => {
    const context = await assembleContext(oppId, orgId, prompt, {
      targetBudget: 5000,
    });

    if (context.budgetStatus.isOverBudget) {
      const truncationOrder = context.budgetStatus.truncatedCategories;
      const playbookIndex = truncationOrder.indexOf('playbooks');
      const dealIndex = truncationOrder.indexOf('dealContext');

      if (playbookIndex !== -1 && dealIndex !== -1) {
        expect(playbookIndex).toBeLessThan(dealIndex);
      }
    }
  });
});
```

### Integration Tests

- Test with realistic context sizes
- Verify token counts are accurate
- Test truncation behavior at various budget levels

---

## Monitoring

### Metrics to Track

| Metric | Alert Threshold |
|--------|-----------------|
| Context assembly latency P95 | >3 seconds |
| Truncation rate | >30% of requests |
| Foundational context missing | >10% of requests |
| Token budget exceeded | Any occurrence |

### Logging Format

```json
{
  "event": "context_assembled",
  "organizationId": "uuid",
  "opportunityId": "uuid",
  "totalTokens": 28500,
  "budgetLimit": 32000,
  "foundationalTokens": 1650,
  "ragTokens": 26850,
  "truncated": false,
  "latencyMs": 1250,
  "categories": {
    "businessModel": 480,
    "brandContext": 170,
    "dealContext": 10500,
    "products": 8200,
    "competitive": 5400,
    "playbooks": 2600
  }
}
```

---

## Future Enhancements (Phase 2+)

1. **Historical Patterns** — Include winning strategies from similar deals
2. **Dynamic Budget Adjustment** — Adjust budgets based on deal stage/complexity
3. **Context Quality Scoring** — Measure and improve retrieval relevance
4. **User Preferences** — Allow users to adjust category priorities
5. **Multi-turn Context** — Maintain context across proposal iterations

---

## References

- [CLAUDE.md](../../CLAUDE.md) — Project context
- [LLM Provider Architecture](./LLM_PROVIDER_ARCHITECTURE.md) — Provider abstraction
- [Business Model Summary](../planning/BUSINESS_MODEL_SUMMARY_IMPLEMENTATION.md) — Business model feature
- [Branding Knowledge Base](../design/BRANDING_KNOWLEDGE_BASE.md) — Brand context feature
