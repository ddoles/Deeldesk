# Sprint 2 UX Test Plan: Core Generation

**Version:** 1.0
**Date:** December 2024
**Tester:** _______________

## Prerequisites

Before testing, ensure:

1. **Services Running:**
   ```bash
   # Terminal 1: Start Next.js dev server
   npm run dev

   # Terminal 2: Start Redis (required for BullMQ)
   redis-server

   # Terminal 3: Start the proposal worker (if separate)
   # Or ensure worker starts with dev server
   ```

2. **Environment Variables Set:**
   - `ANTHROPIC_API_KEY` - Valid Anthropic API key
   - `REDIS_URL` - Redis connection (default: `redis://localhost:6379`)
   - `DATABASE_URL` - PostgreSQL connection

3. **Test Data:**
   - At least one organization exists
   - At least one opportunity exists under that organization
   - User is logged in with access to the opportunity

---

## Test Cases

### TC-01: Navigate to Proposal Generation

**Objective:** Verify user can access proposal generation from an opportunity

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to `/opportunities` | Opportunities list displays |Pass|
| 2 | Click on an opportunity | Opportunity detail page loads |Pass|
| 3 | Look for "Proposals" section or tab | Proposals section is visible |Pass|
| 4 | Click "Generate Proposal" button | Navigates to `/opportunities/[id]/proposals/new` |Pass|

**Notes:** _______________

---

### TC-02: Proposal Generation Form

**Objective:** Verify the proposal generation form works correctly

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On `/opportunities/[id]/proposals/new` | Form displays with prompt textarea |Pass|
| 2 | Leave prompt empty, try to submit | Submit button is disabled (min 10 chars) |Pass|
| 3 | Enter 5 characters | Submit button still disabled |Pass|
| 4 | Enter 10+ characters | Submit button becomes enabled |Pass|
| 5 | Click an example prompt | Prompt textarea fills with example text |Pass|

**Notes:** _______________

---

### TC-03: Submit Proposal Generation

**Objective:** Verify proposal submission triggers generation

**Test Prompt:**
```
Create a proposal for Acme Corp for our enterprise plan with 50 users,
including 24/7 support and custom integrations. The deal is worth $50,000 annually.
```

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Enter the test prompt above | Text appears in textarea |Pass|
| 2 | Click "Generate Proposal" | Button shows "Starting Generation..." |Pass|
| 3 | Wait for redirect | Redirects to `/proposals/[id]` |Pass|
| 4 | Observe progress UI | Progress component displays |Pass|

**Notes:** _______________

---

### TC-04: Generation Progress States

**Objective:** Verify SSE streaming shows correct progress states

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | After submitting proposal | "Queued" state shows briefly |Pass|
| 2 | Wait 1-2 seconds | "Understanding your request..." displays |Pass|
| 3 | Wait 2-3 seconds | "Crafting your proposal..." displays |Pass|
| 4 | Wait for generation | "Generating slides..." with progress |Pass|
| 5 | Generation completes | Progress reaches 100%, viewer loads |Pass|

**Expected Progress Flow:**
- [ ] Queued → Understanding → Crafting → Generating → Complete

**Notes:** _______________

---

### TC-05: Proposal Viewer - Slide Display

**Objective:** Verify generated proposal displays correctly

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | After generation completes | Proposal viewer loads |Pass |
| 2 | Check slide count | At least 5 slides generated | Pass|
| 3 | Verify Title slide (1) | Contains heading and subheading |Pass |
| 4 | Verify Executive Summary (2) | Contains bullet points |Pass |
| 5 | Verify Solution slide (3) | Contains body text or bullets |Pass |
| 6 | Verify Investment slide (4) | Contains pricing info or [ENTER VALUE] |Pass|
| 7 | Verify Next Steps slide (5) | Contains action items |Pass|

**Notes:** _______________

---

### TC-06: Proposal Viewer - Navigation

**Objective:** Verify slide navigation works correctly

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On proposal viewer | First slide (Title) is shown |Pass|
| 2 | Click "Next" button | Advances to slide 2 |Pass|
| 3 | Click thumbnail for slide 4 | Jumps to slide 4 |Pass|
| 4 | Click "Previous" button | Goes back to slide 3 |Pass|
| 5 | On first slide, click "Previous" | Button disabled or no action |Pass|
| 6 | On last slide, click "Next" | Button disabled or no action |Pass|

**Notes:** _______________

---

### TC-07: Proposal Version Increment

**Objective:** Verify new proposals increment version number

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Note current proposal version | Version displayed (e.g., "v1") |Pass|
| 2 | Click "Create New Version" | Navigates to generation form |Pass|
| 3 | Enter a new prompt | Prompt accepted |Pass|
| 4 | Submit and wait for generation | New proposal generates |Pass|
| 5 | Check version number | Version is incremented (e.g., "v2") |Pass|

**Notes:** _______________

---

### TC-08: Proposals List View

**Objective:** Verify proposals list under opportunity

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to `/opportunities/[id]/proposals` | Proposals list displays |pass|
| 2 | Check proposal cards | Shows version, status, date |fail no date shown|
| 3 | Verify status badges | Correct colors for each status |pass|
| 4 | Click "View Proposal" on complete one | Opens proposal viewer |pass|
| 5 | Verify breadcrumb | Shows opportunity name |pass|

**Status Badge Colors:**
- Draft: Gray
- Queued: Yellow
- Generating: Blue
- Complete: Green
- Error: Red

**Notes:** _______________

---

### TC-09: Generation Error Handling

**Objective:** Verify error states are handled gracefully

**To simulate error:** Temporarily set invalid `ANTHROPIC_API_KEY`

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Submit proposal with invalid API key | Generation starts |pass|
| 2 | Wait for error | Error state displays |pass|
| 3 | Check error UI | Shows "Generation Failed" message |pass|
| 4 | Verify action buttons | "Go Back" and "Try Again" present |pass|
| 5 | Click "Try Again" | Navigates to generation form |pass|

**Notes:** _______________

---

### TC-10: Context Assembly Verification

**Objective:** Verify proposal uses opportunity context

**Setup:** Create opportunity with specific details:
- Name: "Enterprise Deal - TechCorp"
- Description: "Cloud migration project for 500 employees"

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Generate proposal for this opportunity | Generation completes |pass|
| 2 | Check Title slide | Mentions "TechCorp" or opportunity name |pass|
| 3 | Check content slides | References deal details | |
| 4 | Verify no hallucinated prices | Uses [ENTER VALUE] for unknown prices | |

**Notes:** _______________

---

### TC-11: Prompt Display

**Objective:** Verify generation prompt is saved and displayed

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Generate proposal with unique prompt | Generation completes | |
| 2 | View completed proposal | Scroll to bottom | |
| 3 | Find "Generation Prompt" section | Prompt card is visible | |
| 4 | Verify prompt text | Matches what was entered | |

**Notes:** _______________

---

### TC-12: Concurrent Generation (Edge Case)

**Objective:** Verify system handles multiple generations

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open two browser tabs | Both on different opportunities | |
| 2 | Start generation in Tab 1 | Progress shows | |
| 3 | Start generation in Tab 2 | Progress shows independently | |
| 4 | Wait for both to complete | Both complete successfully | |
| 5 | Verify correct slides in each | Each has appropriate content | |

**Notes:** _______________

---

## Performance Benchmarks

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Time to first progress update | < 2 seconds | | |
| Total generation time (5 slides) | < 60 seconds | | |
| Progress UI update frequency | Every 2-3 seconds | | |
| Slide viewer load time | < 1 second | | |

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Summary

| Test Case | Result | Issues Found |
|-----------|--------|--------------|
| TC-01: Navigate to Generation | | |
| TC-02: Generation Form | | |
| TC-03: Submit Generation | | |
| TC-04: Progress States | | |
| TC-05: Slide Display | | |
| TC-06: Navigation | | |
| TC-07: Version Increment | | |
| TC-08: Proposals List | | |
| TC-09: Error Handling | | |
| TC-10: Context Assembly | | |
| TC-11: Prompt Display | | |
| TC-12: Concurrent Generation | | |

**Overall Result:** _______________

**Critical Issues:**
1. _______________
2. _______________

**Minor Issues:**
1. _______________
2. _______________

**Tester Signature:** _______________ **Date:** _______________
