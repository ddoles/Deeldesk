# Proposal Versioning & Active Proposal Strategy
**Version:** 1.0  
**Status:** MVP Recommendation  
**Last Updated:** December 2025

---

## Current State Analysis

### Database Schema Review

**Opportunities:**
- ✅ Status enum: `'open', 'won', 'lost', 'stalled'`
- ✅ `closed_at` timestamp (when status changes to won/lost)
- ✅ Supports open vs closed distinction

**Proposals:**
- ✅ `version` INTEGER field
- ✅ `parent_version_id` for version chain
- ✅ `opportunity_id` links to parent opportunity
- ✅ `created_at` and `updated_at` timestamps
- ❌ **Missing:** Explicit `is_active` flag or computed active proposal

---

## MVP Recommendation

### Approach: **Computed Active Proposal** (No Schema Changes)

**Rationale:**
- Simplest for MVP
- No database migration needed
- Most recent proposal by `updated_at` is implicitly active
- Can add explicit flag later if needed

### Implementation Strategy

#### 1. Active Proposal Determination

**Logic:** Most recently updated proposal for an opportunity is the "active" one.

```typescript
// lib/db/queries/proposals.ts

export async function getActiveProposal(
  opportunityId: string
): Promise<Proposal | null> {
  return await prisma.proposal.findFirst({
    where: {
      opportunityId,
      status: { in: ['complete', 'draft'] }, // Exclude error/queued
    },
    orderBy: {
      updatedAt: 'desc', // Most recent is active
    },
  });
}

export async function getProposalsForOpportunity(
  opportunityId: string,
  includeActive: boolean = true
) {
  const proposals = await prisma.proposal.findMany({
    where: { opportunityId },
    orderBy: { updatedAt: 'desc' },
  });
  
  // Mark first one as active
  if (proposals.length > 0 && includeActive) {
    proposals[0].isActive = true;
  }
  
  return proposals;
}
```

#### 2. Opportunity Status Management

**Simplified Status Model:**
- **Open:** Opportunity is active, proposals can be created/revised
- **Closed (Won/Lost):** Opportunity is finalized, proposals are read-only

**Status Transitions:**
```
open → won (when deal closes successfully)
open → lost (when deal is lost)
open → stalled (temporary state, can return to open)
won → (locked, no changes)
lost → (locked, no changes)
```

**Implementation:**
```typescript
// lib/db/queries/opportunities.ts

export async function closeOpportunity(
  opportunityId: string,
  status: 'won' | 'lost',
  notes?: string
) {
  return await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      status,
      closedAt: new Date(),
      // Update deal_summary with outcome
      dealSummary: {
        // ... existing summary
        outcome: status,
        closedAt: new Date().toISOString(),
        notes,
      },
    },
  });
}

// Prevent proposal creation/editing for closed opportunities
export async function canEditProposal(
  opportunityId: string
): Promise<boolean> {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: { status: true },
  });
  
  return opp?.status === 'open' || opp?.status === 'stalled';
}
```

---

## UI/UX Design

### Opportunity Detail View

```
┌─────────────────────────────────────────────────┐
│  Acme Bank Opportunity                          │
│  Status: Open                                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Active Proposal                                │
│  ┌──────────────────────────────────────────┐  │
│  │ Proposal v3 (Active)                     │  │
│  │ Updated: 2 hours ago                      │  │
│  │ Status: Complete                         │  │
│  │                                          │  │
│  │ [View] [Edit] [Export] [Share]          │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Proposal History                                │
│  ┌──────────────────────────────────────────┐  │
│  │ v2 - Updated 1 day ago                    │  │
│  │ v1 - Updated 3 days ago                  │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  [Create New Proposal] [Close Opportunity]      │
└─────────────────────────────────────────────────┘
```

### Proposal List View (Within Opportunity)

```
Proposals for Acme Bank

┌─────────────────────────────────────────────────┐
│  v3 (Active)    Complete    2 hours ago    [→]  │
│  v2             Complete    1 day ago      [→]  │
│  v1             Complete    3 days ago     [→]  │
└─────────────────────────────────────────────────┘
```

### Navigation Pattern

**From Opportunity:**
- Default view shows active proposal
- "View All Versions" shows history
- "Create New Proposal" creates v4 (becomes new active)

**From Proposal:**
- Breadcrumb: `Opportunities > Acme Bank > Proposal v3`
- "Version History" button shows all versions
- "Create Revision" creates new version

---

## Database Considerations

### Option 1: Computed Active (Recommended for MVP)

**Pros:**
- No schema changes
- Simple logic (most recent = active)
- Works immediately

**Cons:**
- Requires query every time
- Can't explicitly mark a proposal as active
- If two proposals updated at same time, ambiguous

**Implementation:**
```sql
-- No schema changes needed
-- Use ORDER BY updated_at DESC, LIMIT 1
```

### Option 2: Add `is_active` Flag (Future Enhancement)

**Pros:**
- Explicit control
- Can mark any proposal as active
- Better performance (indexed query)

**Cons:**
- Requires migration
- Need to manage flag updates
- More complex logic

**Schema Addition:**
```sql
ALTER TABLE proposals 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;

-- Index for active proposal lookup
CREATE INDEX idx_proposals_active 
ON proposals(opportunity_id, is_active) 
WHERE is_active = true;

-- Constraint: Only one active per opportunity
CREATE UNIQUE INDEX idx_proposals_one_active 
ON proposals(opportunity_id) 
WHERE is_active = true;
```

**Recommendation:** Start with Option 1 (computed), add Option 2 in Phase 2 if needed.

---

## API Design

### Endpoints

```typescript
// Get active proposal for opportunity
GET /api/opportunities/:id/proposals/active
Response: { proposal: Proposal | null }

// Get all proposals for opportunity (ordered, first is active)
GET /api/opportunities/:id/proposals
Response: { 
  proposals: Proposal[],
  activeProposalId: string | null 
}

// Create new proposal (becomes active automatically)
POST /api/opportunities/:id/proposals
Body: { prompt: string, ... }
Response: { proposal: Proposal, jobId: string }

// Get specific proposal
GET /api/proposals/:id
Response: { 
  proposal: Proposal,
  isActive: boolean,
  opportunityStatus: 'open' | 'won' | 'lost' | 'stalled'
}

// Close opportunity
PATCH /api/opportunities/:id/close
Body: { status: 'won' | 'lost', notes?: string }
Response: { opportunity: Opportunity }
```

---

## User Workflows

### Workflow 1: Create Initial Proposal

1. User creates opportunity (status: `open`)
2. User creates proposal v1
3. v1 is automatically active (only proposal)
4. User can view/edit/export v1

### Workflow 2: Revise Proposal

1. User views active proposal (v3)
2. User clicks "Create Revision" or "Iterate"
3. System creates v4 with `parent_version_id = v3.id`
4. v4 becomes new active proposal
5. v3 moves to history

### Workflow 3: View Version History

1. User on opportunity detail page
2. Sees "Active Proposal" (v3) at top
3. Scrolls to "Proposal History"
4. Can click any version to view (read-only if not active)
5. Can compare versions side-by-side (Phase 2)

### Workflow 4: Close Opportunity

1. User clicks "Close Opportunity"
2. Selects status: Won or Lost
3. Optionally adds notes
4. Opportunity status changes to `won` or `lost`
5. `closed_at` timestamp set
6. All proposals become read-only
7. Active proposal remains visible but locked

---

## MVP Implementation Tasks

### Sprint 1: Foundation (Updated)

**Additional Task:**
- [ ] T1-010: Add `closed_at` handling to Opportunity model (1 point)

### Sprint 2: Core Generation (Updated)

**Additional Tasks:**
- [ ] T2-012: Implement active proposal query logic (2 points)
- [ ] T2-013: Add version increment on new proposal creation (1 point)

### Sprint 5: Strategy & Export (Updated)

**Additional Tasks:**
- [ ] T5-009: Build proposal version history UI (3 points)
- [ ] T5-010: Add "Create Revision" functionality (3 points)

### Sprint 7: Polish (Updated)

**Additional Tasks:**
- [ ] T7-012: Add opportunity close workflow (3 points)
- [ ] T7-013: Implement read-only state for closed opportunities (2 points)

---

## UI Components

### Active Proposal Badge

```tsx
// components/proposals/ActiveBadge.tsx

export function ActiveBadge() {
  return (
    <span className="badge badge-success">
      Active
    </span>
  );
}
```

### Proposal Version List

```tsx
// components/proposals/ProposalVersionList.tsx

export function ProposalVersionList({ 
  proposals, 
  activeProposalId 
}: {
  proposals: Proposal[];
  activeProposalId: string | null;
}) {
  return (
    <div className="version-list">
      {proposals.map(proposal => (
        <div 
          key={proposal.id}
          className={`version-item ${proposal.id === activeProposalId ? 'active' : ''}`}
        >
          <div>
            <span>v{proposal.version}</span>
            {proposal.id === activeProposalId && <ActiveBadge />}
          </div>
          <div className="version-meta">
            {formatDate(proposal.updatedAt)}
          </div>
          <Link href={`/proposals/${proposal.id}`}>View</Link>
        </div>
      ))}
    </div>
  );
}
```

### Opportunity Status Badge

```tsx
// components/opportunities/OpportunityStatusBadge.tsx

export function OpportunityStatusBadge({ status }: { status: OpportunityStatus }) {
  const variants = {
    open: { label: 'Open', className: 'badge-info' },
    won: { label: 'Won', className: 'badge-success' },
    lost: { label: 'Lost', className: 'badge-error' },
    stalled: { label: 'Stalled', className: 'badge-warning' },
  };
  
  const variant = variants[status];
  
  return (
    <span className={`badge ${variant.className}`}>
      {variant.label}
    </span>
  );
}
```

---

## Edge Cases & Considerations

### Edge Case 1: Multiple Proposals Updated Simultaneously

**Scenario:** Two proposals updated at exact same timestamp.

**Solution:**
```typescript
// Use created_at as tiebreaker
orderBy: [
  { updatedAt: 'desc' },
  { createdAt: 'desc' }
]
```

### Edge Case 2: Proposal in Error State

**Scenario:** Most recent proposal failed generation.

**Solution:**
```typescript
// Exclude error/queued from active consideration
where: {
  status: { in: ['complete', 'draft'] }
}
```

### Edge Case 3: User Wants to Reactivate Old Proposal

**Scenario:** User wants v2 to be active instead of v3.

**MVP Solution:** Not supported. User must create new revision based on v2.

**Phase 2 Solution:** Add `is_active` flag, allow manual activation.

### Edge Case 4: Closed Opportunity Reopened

**Scenario:** Opportunity marked "lost" but deal reopens.

**Solution:**
```typescript
export async function reopenOpportunity(opportunityId: string) {
  return await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      status: 'open',
      closedAt: null,
    },
  });
}
```

---

## Future Enhancements (Post-MVP)

### Phase 2 Features

1. **Explicit Active Flag**
   - Add `is_active` column
   - Allow manual activation of any version
   - UI: "Set as Active" button

2. **Version Comparison**
   - Side-by-side diff view
   - Highlight changes between versions
   - Show what changed (pricing, content, etc.)

3. **Version Branching**
   - Create alternative proposal paths
   - "What if" scenarios
   - A/B testing different approaches

4. **Version Labels**
   - User-defined labels: "Initial", "Revised Pricing", "Final"
   - Search/filter by label

5. **Bulk Operations**
   - Export all versions
   - Archive old versions
   - Delete draft versions

---

## Acceptance Criteria

### MVP Requirements

- [ ] Most recent proposal (by `updated_at`) is treated as active
- [ ] Opportunity status can be set to `won` or `lost`
- [ ] Closed opportunities prevent new proposal creation
- [ ] Proposal version history visible in opportunity detail
- [ ] Active proposal clearly marked in UI
- [ ] Creating new proposal increments version number
- [ ] New proposal automatically becomes active
- [ ] Closed opportunities show read-only proposals

### Success Metrics

- Users can easily identify active proposal
- Version history is accessible
- Opportunity closure workflow is clear
- No confusion about which proposal to use

---

## Summary

### MVP Approach: **Computed Active Proposal**

1. **No Schema Changes** - Use existing `updated_at` timestamp
2. **Simple Logic** - Most recent proposal = active
3. **Clear UI** - Badge and visual distinction for active proposal
4. **Version History** - Show all proposals, ordered by recency
5. **Opportunity Closure** - Lock editing when opportunity closed

### Implementation Effort

- **Sprint 1:** Add closed_at handling (1 point)
- **Sprint 2:** Active proposal logic (3 points)
- **Sprint 5:** Version history UI (6 points)
- **Sprint 7:** Close workflow (5 points)
- **Total:** ~15 points across 4 sprints

### Future: Explicit Active Flag

If users need more control, add `is_active` flag in Phase 2. MVP approach is sufficient for launch.

---

**Recommendation:** Proceed with computed active proposal approach. It's simple, works with existing schema, and can be enhanced later if needed.

