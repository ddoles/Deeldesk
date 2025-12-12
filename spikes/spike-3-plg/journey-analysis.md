# Spike 3: PLG User Journey Simulation

**Date:** December 12, 2025
**Status:** Complete
**Objective:** Validate <10 minute time-to-first-proposal for PLG motion

---

## Executive Summary

This spike analyzes the planned user journey from signup to first proposal generation. Since the application is not yet built, this is a **design analysis** based on wireframes and UX documentation.

**Key Finding:** The planned journey achieves **~4-5 minutes** to first proposal for cold start users, well under the 10-minute target.

---

## Scenario A: Cold Start (Zero Content)

**User Profile:** New user with no KB, no brand settings, no deal context
**Target:** <10 minutes to first proposal

### Journey Map

| Step | Screen | User Action | Time Est. | Clicks |
|------|--------|-------------|-----------|--------|
| 1 | Landing Page | Click "Sign Up" | 5s | 1 |
| 2 | Sign Up | Enter email/password OR Google OAuth | 30s | 2-3 |
| 3 | Email Verify | Click verification link (if email) | 20s | 1 |
| 4 | Dashboard | View empty state, see "Create Proposal" CTA | 5s | 0 |
| 5 | Dashboard | Click "New Proposal" button | 2s | 1 |
| 6 | New Proposal | Type prompt (e.g., "Acme Bank, $1M budget") | 30s | 0 |
| 7 | New Proposal | Click "Generate" | 2s | 1 |
| 8 | Generation | Watch progress (streaming) | 45-60s | 0 |
| 9 | Proposal View | See completed proposal | 5s | 0 |

**Total Time: ~2.5-3 minutes** (excluding generation wait)
**Total Clicks: 6-7**
**Including Generation: ~4 minutes**

### Cold Start Default Behavior

When user has ZERO content, the system should:

| Element | Default Behavior |
|---------|------------------|
| **Template** | System "Professional" template (neutral colors) |
| **Brand Colors** | Deeldesk defaults (#4361EE primary, #2D3748 text) |
| **Brand Voice** | Professional, consultative tone |
| **Products** | Generic value propositions, [PRODUCT] placeholders |
| **Pricing** | [ENTER PRICING] placeholders throughout |
| **Competitor Info** | Generic competitive positioning |

### Friction Points Identified

| Issue | Severity | Mitigation |
|-------|----------|------------|
| No brand customization | Low | "Good enough" defaults, customize later |
| No product catalog | Medium | Generic templates still valuable |
| No pricing data | Medium | Clear [ENTER VALUE] placeholders |
| No competitor intel | Low | Generic positioning, placeholder battlecards |

### "Aha Moment" Analysis

**Primary Aha:** User sees a complete, professional-looking 5-slide proposal generated from a single prompt.

**Triggers:**
1. Streaming text appearing in real-time (engagement)
2. Proposal structure matches expectations (executive summary → solution → pricing)
3. Professional formatting and layout
4. "This would have taken me 2 hours to create"

**Risk:** If placeholders are too prominent, user may feel underwhelmed.

**Mitigation:** Default content should be genuinely useful, not just placeholders.

---

## Scenario B: Minimal Setup (1 Battlecard + 1 Product)

**User Profile:** User uploads basic KB content before generating
**Target:** <10 minutes total

### Journey Map

| Step | Screen | User Action | Time Est. | Clicks |
|------|--------|-------------|-----------|--------|
| 1-4 | (Signup) | Same as Scenario A | 60s | 4-5 |
| 5 | Dashboard | Click "Knowledge Base" | 2s | 1 |
| 6 | KB Home | Click "Add Product" | 2s | 1 |
| 7 | Add Product | Enter name, description, pricing | 60s | 3 |
| 8 | Add Product | Click "Save" | 2s | 1 |
| 9 | KB Home | Click "Add Battlecard" | 2s | 1 |
| 10 | Add Battlecard | Paste competitor info | 45s | 2 |
| 11 | Add Battlecard | Click "Save" | 2s | 1 |
| 12 | KB Home | Click "New Proposal" (nav) | 2s | 1 |
| 13 | New Proposal | Type prompt mentioning competitor | 30s | 0 |
| 14 | New Proposal | Click "Generate" | 2s | 1 |
| 15 | Generation | Watch progress | 45-60s | 0 |
| 16 | Proposal View | Verify KB content included | 10s | 0 |

**Total Time: ~5-6 minutes** (excluding generation)
**Total Clicks: 14-15**
**Including Generation: ~6-7 minutes**

### Validation Criteria

| Check | Expected Result |
|-------|-----------------|
| Product name appears in proposal | ✅ Product mentioned by name |
| Product pricing used (if codified) | ✅ Exact pricing from KB |
| Competitor mentioned in battlecard | ✅ Competitive positioning included |
| Battlecard strengths/weaknesses | ✅ Our advantages highlighted |

### Friction Points Identified

| Issue | Severity | Mitigation |
|-------|----------|------------|
| Many clicks to add KB content | Medium | Bulk import option (Phase 2) |
| Context switch (KB → Proposal) | Low | Quick access from any screen |
| Unclear what to add first | Medium | Onboarding wizard suggestion |

---

## Scenario C: Deal Context Paste

**User Profile:** User pastes email thread as deal context
**Target:** <10 minutes with context integration

### Journey Map

| Step | Screen | User Action | Time Est. | Clicks |
|------|--------|-------------|-----------|--------|
| 1-4 | (Signup) | Same as Scenario A | 60s | 4-5 |
| 5 | Dashboard | Click "New Opportunity" | 2s | 1 |
| 6 | New Opp | Enter name, description | 20s | 2 |
| 7 | New Opp | Click "Save" | 2s | 1 |
| 8 | Opp Detail | Click "Add Context" | 2s | 1 |
| 9 | Context Panel | Paste 500-word email thread | 10s | 1 |
| 10 | Context Panel | Click "Save Context" | 2s | 1 |
| 11 | Opp Detail | Click "Generate Proposal" | 2s | 1 |
| 12 | New Proposal | Type refinement prompt | 15s | 0 |
| 13 | New Proposal | Click "Generate" | 2s | 1 |
| 14 | Generation | Watch progress | 45-60s | 0 |
| 15 | Proposal View | Verify context reflected | 10s | 0 |

**Total Time: ~4-5 minutes** (excluding generation)
**Total Clicks: 12-13**
**Including Generation: ~5-6 minutes**

### Context Integration Validation

| Check | Expected Result |
|-------|-----------------|
| Customer name from email | ✅ Mentioned in proposal |
| Budget mentioned in email | ✅ Reflected in pricing section |
| Pain points from email | ✅ Addressed in solution |
| Timeline from email | ✅ Implementation timeline matches |
| Stakeholders from email | ✅ Decision-maker references |

### Friction Points Identified

| Issue | Severity | Mitigation |
|-------|----------|------------|
| Must create Opportunity first | Low | Can paste context directly in prompt |
| Context panel separate from prompt | Low | Combined view option |
| No feedback on context parsing | Medium | Show extracted entities |

---

## Scenario D: Returning User (Day 2)

**User Profile:** User returns next day with saved KB
**Target:** <5 minutes to second proposal

### Journey Map

| Step | Screen | User Action | Time Est. | Clicks |
|------|--------|-------------|-----------|--------|
| 1 | Landing | Click "Sign In" | 2s | 1 |
| 2 | Sign In | Enter credentials | 15s | 2 |
| 3 | Dashboard | See existing opportunities | 3s | 0 |
| 4 | Dashboard | Click "New Proposal" | 2s | 1 |
| 5 | New Proposal | Type prompt | 20s | 0 |
| 6 | New Proposal | Click "Generate" | 2s | 1 |
| 7 | Generation | Watch progress | 45-60s | 0 |
| 8 | Proposal View | See completed proposal | 5s | 0 |

**Total Time: ~1-2 minutes** (excluding generation)
**Total Clicks: 5**
**Including Generation: ~2-3 minutes**

### Returning User Benefits

| Benefit | Description |
|---------|-------------|
| Saved KB content | Products, battlecards automatically included |
| Brand settings | Colors, voice already configured |
| Past proposals | Can duplicate/iterate |
| Draft persistence | Resume incomplete work |

---

## Time-to-Value Summary

| Scenario | Clicks | Time (excl. gen) | Time (incl. gen) | Target | Status |
|----------|--------|------------------|------------------|--------|--------|
| A: Cold Start | 6-7 | ~3 min | ~4 min | <10 min | ✅ PASS |
| B: Minimal Setup | 14-15 | ~6 min | ~7 min | <10 min | ✅ PASS |
| C: Deal Context | 12-13 | ~5 min | ~6 min | <10 min | ✅ PASS |
| D: Returning User | 5 | ~2 min | ~3 min | <5 min | ✅ PASS |

---

## Critical Design Decisions

### 1. What Happens with Zero KB?

**Decision:** Generate useful proposal with intelligent defaults.

```
User Prompt: "Proposal for Acme Bank, $1M budget, security focus"

System extracts:
- Customer: Acme Bank
- Budget: $1,000,000
- Focus: Security

System generates:
- Title slide with "Acme Bank" prominently
- Executive summary addressing security concerns
- Solution overview with security-focused messaging
- Pricing section with [ENTER YOUR PRICING] placeholders
- Next steps with clear CTAs
```

### 2. How Do We Handle Missing Pricing?

**Decision:** Clear placeholders, not hallucinated numbers.

```
Without KB pricing:
"Investment: [ENTER YOUR PRICING]"
"Total: [CALCULATE BASED ON YOUR RATES]"

With KB pricing (50 users × $99/user/month):
"Investment: $4,950/month ($59,400 annually)"
```

### 3. What's the Minimum Viable Proposal?

**Decision:** 5 slides that provide immediate value:

1. **Title Slide** - Customer name, date, your company
2. **Executive Summary** - Key points, value proposition
3. **Solution Overview** - What you're proposing
4. **Investment** - Pricing (or placeholders)
5. **Next Steps** - Clear call to action

---

## Onboarding Recommendations

### Quick Wins (Implement in Sprint 1-2)

1. **Empty State CTA:** Large, clear "Create Your First Proposal" button
2. **Smart Defaults:** Professional template, neutral colors
3. **Inline Help:** Tooltips explaining each section
4. **Progress Indicator:** Show % complete during generation

### Medium-Term (Sprint 3-4)

1. **Guided Setup:** "Add a product to improve your proposals"
2. **Sample Content:** Pre-populated example battlecard
3. **Context Tips:** "Paste an email to personalize your proposal"

### Future Enhancements (Phase 2)

1. **Onboarding Wizard:** Step-by-step setup flow
2. **Template Gallery:** Industry-specific templates
3. **Import Tools:** Bulk KB import from docs/spreadsheets

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User expects too much from cold start | Medium | Medium | Set expectations in onboarding |
| Placeholders feel unfinished | Medium | Medium | Make placeholders actionable |
| Generation takes >60s | Low | High | Show engaging progress UI |
| User doesn't return after first try | Medium | High | Email with proposal, value reinforcement |

---

## Acceptance Criteria Results

| Test | Green | Yellow | Red | **Result** |
|------|-------|--------|-----|------------|
| Cold start | <10 min | 10-12 min | >12 min | ✅ **~4 min** |
| Minimal setup | <10 min | 10-12 min | >12 min | ✅ **~7 min** |
| Deal context | <10 min | 10-12 min | >12 min | ✅ **~6 min** |
| Decisions before first proposal | <5 | 5-7 | >7 | ✅ **3-4** |

---

## Recommendation

**GO** - The planned PLG journey meets all acceptance criteria:

- All scenarios complete in <10 minutes
- Cold start users get value in ~4 minutes
- Click counts are reasonable (6-15 depending on scenario)
- Clear "aha moment" when proposal generates
- Friction points identified and mitigatable

### Key Success Factors

1. **Streaming UI** - Real-time generation keeps users engaged
2. **Smart Defaults** - Useful output even with zero KB
3. **Clear Placeholders** - [ENTER VALUE] not hallucinated numbers
4. **Fast Generation** - Target <60s total generation time

---

## Artifacts

- Journey flow diagrams (embedded above)
- Click count analysis
- Time estimates per step
- Risk assessment matrix
- Design recommendations
