# Sprint 3 UX Test Plan: Context & Knowledge Base

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

   # Terminal 3: Start the proposal worker
   npm run worker
   ```

2. **Environment Variables Set:**
   - `ANTHROPIC_API_KEY` - Valid Anthropic API key
   - `OPENAI_API_KEY` - Valid OpenAI API key (for embeddings)
   - `REDIS_URL` - Redis connection (default: `redis://localhost:6379`)
   - `DATABASE_URL` - PostgreSQL connection with pgvector extension
   - `AWS_ACCESS_KEY_ID` - (Optional) For Bedrock provider testing
   - `AWS_SECRET_ACCESS_KEY` - (Optional) For Bedrock provider testing
   - `AWS_REGION` - (Optional) For Bedrock provider testing

3. **Test Data:**
   - At least one organization exists
   - At least one opportunity exists under that organization
   - User is logged in with owner/admin role for settings access

---

## Section A: Knowledge Base Navigation

### TC-01: Access Knowledge Base

**Objective:** Verify user can access the Knowledge Base section

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Log in to dashboard | Dashboard loads |Pass|
| 2 | Look for "Knowledge Base" in sidebar | Knowledge Base menu item visible |Pass|
| 3 | Click "Knowledge Base" | Navigates to `/knowledge` |Pass|
| 4 | Check default tab | Redirects to `/knowledge/products` |Pass|

**Notes:** _______________

---

### TC-02: Knowledge Base Tab Navigation

**Objective:** Verify tab navigation between KB sections

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On `/knowledge/products` | Products tab is active (highlighted) | |
| 2 | Click "Battlecards" tab | Navigates to `/knowledge/battlecards` | |
| 3 | Click "Company Profile" tab | Navigates to `/knowledge/company-profile` | |
| 4 | Click "Products" tab | Returns to `/knowledge/products` | |
| 5 | Verify URL changes | URL matches current tab | |

**Notes:** _______________

---

## Section B: Products CRUD

### TC-03: Products List (Empty State)

**Objective:** Verify products list shows empty state correctly

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to `/knowledge/products` | Products page loads | |
| 2 | With no products | Empty state message displays | |
| 3 | Verify "Add Product" button | Button is visible and clickable | |

**Notes:** _______________

---

### TC-04: Create New Product

**Objective:** Verify product creation workflow

**Test Data:**
```
Name: Enterprise Platform
Category: Software
Description: Our flagship enterprise solution with advanced analytics and reporting.
Pricing Model: Per User
Base Price: 99.00
Billing: Monthly
Features:
  - Advanced Analytics
  - Custom Reporting
  - API Access
Use Cases:
  - Enterprise resource planning
  - Team collaboration
```

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Add Product" button | Navigates to `/knowledge/products/new` | |
| 2 | Leave name empty, try submit | Validation error shows | |
| 3 | Fill in product name | Name field accepts input | |
| 4 | Select/enter category | Category field works | |
| 5 | Enter description | Description textarea works | |
| 6 | Select pricing model | Dropdown works | |
| 7 | Enter base price | Number input works | |
| 8 | Select billing frequency | Dropdown works | |
| 9 | Add features (one per line) | Feature inputs work | |
| 10 | Add use cases | Use case inputs work | |
| 11 | Click "Create Product" | Form submits, redirects to products list | |
| 12 | Verify product in list | New product appears in list | |

**Notes:** _______________

---

### TC-05: Edit Existing Product

**Objective:** Verify product editing workflow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On products list | Products display | |
| 2 | Click on a product row or "Edit" | Navigates to `/knowledge/products/[id]` | |
| 3 | Verify form pre-filled | Existing data loads in form | |
| 4 | Modify the description | Field accepts changes | |
| 5 | Add a new feature | Feature added to list | |
| 6 | Click "Save Changes" | Form submits successfully | |
| 7 | Navigate back to list | Updated product shows changes | |

**Notes:** _______________

---

### TC-06: Delete Product

**Objective:** Verify product deletion workflow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On product edit page | Delete button visible | |
| 2 | Click "Delete Product" | Confirmation dialog appears | |
| 3 | Cancel deletion | Dialog closes, product remains | |
| 4 | Click "Delete Product" again | Confirmation dialog appears | |
| 5 | Confirm deletion | Product deleted, redirects to list | |
| 6 | Verify product removed | Product no longer in list | |

**Notes:** _______________

---

## Section C: Battlecards CRUD

### TC-07: Battlecards List (Empty State)

**Objective:** Verify battlecards list shows empty state correctly

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to `/knowledge/battlecards` | Battlecards page loads | |
| 2 | With no battlecards | Empty state message displays | |
| 3 | Verify "Add Battlecard" button | Button is visible and clickable | |

**Notes:** _______________

---

### TC-08: Create New Battlecard

**Objective:** Verify battlecard creation workflow

**Test Data:**
```
Competitor Name: Acme Proposals
Website: https://acmeproposals.com
Strengths:
  - Strong brand recognition
  - Large customer base
  - Enterprise-grade security
Weaknesses:
  - Slow generation times
  - Limited customization
  - No AI capabilities
Key Differentiators:
  - We offer 10x faster generation
  - Our AI produces higher quality content
  - We have better pricing
Objection Handling:
  - Objection: "We already use Acme"
    Response: "Many customers switch from Acme to us for 10x faster proposals"
Pricing Intel: Enterprise plan starts at $500/month
```

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Add Battlecard" | Navigates to `/knowledge/battlecards/new` | |
| 2 | Leave competitor name empty | Validation error on submit | |
| 3 | Enter competitor name | Field accepts input | |
| 4 | Enter competitor website | URL field works | |
| 5 | Add strengths | Strength inputs work | |
| 6 | Add weaknesses | Weakness inputs work | |
| 7 | Add key differentiators | Differentiator inputs work | |
| 8 | Add objection/response pair | Objection handling works | |
| 9 | Enter pricing intel | Textarea works | |
| 10 | Click "Create Battlecard" | Form submits, redirects to list | |
| 11 | Verify battlecard in list | New battlecard appears | |

**Notes:** _______________

---

### TC-09: Edit Existing Battlecard

**Objective:** Verify battlecard editing workflow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On battlecards list | Battlecards display | |
| 2 | Click on a battlecard | Navigates to edit page | |
| 3 | Verify form pre-filled | Existing data loads | |
| 4 | Add a new weakness | Field added to list | |
| 5 | Modify pricing intel | Text updates | |
| 6 | Click "Save Changes" | Form submits successfully | |
| 7 | Navigate back to list | Updated battlecard shows | |

**Notes:** _______________

---

### TC-10: Delete Battlecard

**Objective:** Verify battlecard deletion workflow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On battlecard edit page | Delete button visible | |
| 2 | Click "Delete Battlecard" | Confirmation dialog appears | |
| 3 | Confirm deletion | Battlecard deleted | |
| 4 | Verify redirect | Returns to battlecards list | |
| 5 | Verify removal | Battlecard no longer in list | |

**Notes:** _______________

---

## Section D: Company Profile

### TC-11: View Company Profile (Empty State)

**Objective:** Verify company profile page loads correctly

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to `/knowledge/company-profile` | Page loads | |
| 2 | With no profile | Empty/create state displays | |
| 3 | Verify organization name | Org name shows at top | |
| 4 | Verify "Generate with AI" button | Button is visible | |

**Notes:** _______________

---

### TC-12: Generate Company Profile with AI

**Objective:** Verify AI-powered profile generation

**Test Data:**
```
Company Name: TechCorp Solutions
Website: https://techcorp.example.com
Industry: Technology
Additional Context: We provide enterprise software solutions for Fortune 500 companies, specializing in cloud migration and digital transformation.
```

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Generate with AI" | Modal or form appears | |
| 2 | Enter company name (or use default) | Field accepts input | |
| 3 | Enter website URL | URL field works | |
| 4 | Select industry | Dropdown or input works | |
| 5 | Enter additional context | Textarea works | |
| 6 | Click "Generate" | Loading state shows | |
| 7 | Wait for generation | AI generates profile (10-30 sec) | |
| 8 | Verify generated content | Profile fields populate | |
| 9 | Check summary | Summary text is relevant | |
| 10 | Check value proposition | Value prop is generated | |
| 11 | Check key differentiators | Differentiators populated | |

**Notes:** _______________

---

### TC-13: Edit Company Profile

**Objective:** Verify manual profile editing

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On company profile page | Profile form visible | |
| 2 | Modify summary text | Field editable | |
| 3 | Modify value proposition | Field editable | |
| 4 | Add/edit key differentiator | List is editable | |
| 5 | Modify target customers | Field editable | |
| 6 | Click "Save Changes" | Form submits | |
| 7 | Refresh page | Changes persist | |

**Notes:** _______________

---

## Section E: Deal Context Input

### TC-14: Navigate to Deal Context

**Objective:** Verify deal context input is accessible

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to an opportunity | Opportunity page loads | |
| 2 | Look for "Add Context" or similar | Context section visible | |
| 3 | Click "Add Context" | Navigates to context input page | |

**Notes:** _______________

---

### TC-15: Add Deal Context via Paste

**Objective:** Verify pasting deal context works

**Test Data (Email):**
```
From: John Smith <john@acmecorp.com>
Subject: Re: Enterprise Proposal Request

Hi,

We're looking for a solution to help our 200-person sales team generate proposals faster.
Currently it takes 4-6 hours per proposal and we need to cut that to under 30 minutes.

Key requirements:
- Integration with Salesforce
- Custom branding
- Analytics dashboard
- SOC 2 compliance required

Budget is around $50,000/year. Timeline is Q1 next year.

Thanks,
John Smith
VP of Sales, Acme Corp
```

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On add context page | Form displays | |
| 2 | Select source type "Email" | Type selector works | |
| 3 | Paste email content above | Textarea accepts paste | |
| 4 | Add source metadata (optional) | Metadata fields work | |
| 5 | Click "Save Context" | Context saved | |
| 6 | Verify in opportunity | Context item appears in list | |

**Notes:** _______________

---

### TC-16: Add Deal Context via Drag & Drop

**Objective:** Verify drag-and-drop file upload works

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On add context page | Drop zone visible | |
| 2 | Drag text file over drop zone | Drop zone highlights | |
| 3 | Drop the file | File content loads into textarea | |
| 4 | Verify content extracted | Text appears in input | |
| 5 | Save the context | Context saved successfully | |

**Notes:** _______________

---

### TC-17: Multiple Context Items

**Objective:** Verify multiple context items can be added

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Add first context (email) | Saved successfully | |
| 2 | Click "Add Context" again | Form resets | |
| 3 | Select "Meeting Notes" type | Type changes | |
| 4 | Enter meeting notes content | Content accepted | |
| 5 | Save context | Second item saved | |
| 6 | View opportunity | Both context items listed | |
| 7 | Verify different type badges | Each shows correct type | |

**Notes:** _______________

---

## Section F: LLM Provider Selection

### TC-18: Access Provider Settings

**Objective:** Verify LLM provider settings are accessible

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to `/settings` | Settings page loads | |
| 2 | Look for "AI Provider" section | Provider section visible | |
| 3 | Verify current selection | Default shows "Anthropic Direct" | |

**Notes:** _______________

---

### TC-19: Change LLM Provider

**Objective:** Verify provider can be changed (if eligible)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On settings page | Provider options visible | |
| 2 | Check "Anthropic Direct" | Option is selectable | |
| 3 | Check "AWS Bedrock" | Option visible (may be disabled) | |
| 4 | If on Free/Pro tier | Bedrock option disabled with message | |
| 5 | If on Team/Enterprise | Bedrock option selectable | |
| 6 | Select different provider | Selection changes | |
| 7 | Click "Save Changes" | Settings saved | |
| 8 | Refresh page | Selection persists | |

**Notes:** _______________

---

### TC-20: Bedrock Availability Message

**Objective:** Verify Bedrock messaging for plan tiers

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | View Bedrock option on Free tier | Shows "Team/Enterprise only" badge | |
| 2 | Attempt to select | Cannot select if not eligible | |
| 3 | Hover or click for info | Explanation visible | |

**Notes:** _______________

---

## Section G: RAG Integration in Proposals

### TC-21: Proposal with Products in KB

**Objective:** Verify proposals include relevant products from KB

**Setup:** Create at least 2 products:
- "Enterprise Analytics" - data analytics platform
- "Basic Reporting" - simple reporting tool

**Test Prompt:**
```
Create a proposal for a data analytics solution including advanced reporting capabilities.
```

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Ensure products exist in KB | At least 2 products created | |
| 2 | Navigate to opportunity | Opportunity loads | |
| 3 | Start proposal generation | Generation form appears | |
| 4 | Enter test prompt above | Prompt accepted | |
| 5 | Generate proposal | Proposal generates | |
| 6 | Check solution slide | References "Enterprise Analytics" | |
| 7 | Verify relevance | More relevant product featured | |

**Notes:** _______________

---

### TC-22: Proposal with Battlecards in KB

**Objective:** Verify proposals include competitive intelligence

**Setup:** Create battlecard for "Competitor X"

**Test Prompt:**
```
Create a proposal for Acme Corp. They mentioned they're also looking at Competitor X.
```

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Ensure battlecard exists | Battlecard for Competitor X | |
| 2 | Enter test prompt | Mentions competitor | |
| 3 | Generate proposal | Proposal generates | |
| 4 | Check content slides | References our differentiators | |
| 5 | Verify no negative language | Doesn't bash competitor directly | |
| 6 | Verify competitive positioning | Uses battlecard insights | |

**Notes:** _______________

---

### TC-23: Proposal with Company Profile

**Objective:** Verify proposals include company profile context

**Setup:** Create company profile with:
- Value proposition: "10x faster proposals with AI"
- Key differentiators: ["AI-powered", "Enterprise-ready", "SOC 2 compliant"]

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Ensure company profile exists | Profile saved | |
| 2 | Generate any proposal | Proposal generates | |
| 3 | Check title slide | References company name | |
| 4 | Check solution slides | Mentions value proposition | |
| 5 | Verify differentiators | Key differentiators referenced | |

**Notes:** _______________

---

### TC-24: Proposal with Deal Context

**Objective:** Verify proposals use deal-specific context

**Setup:** Add deal context to opportunity with specific requirements

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Add context with "$50,000 budget" | Context saved | |
| 2 | Add context with "200 users" | Context saved | |
| 3 | Generate proposal | Proposal generates | |
| 4 | Check investment slide | References pricing appropriately | |
| 5 | Check solution slide | References user count | |
| 6 | Verify context reflected | Deal details in proposal | |

**Notes:** _______________

---

## Section H: Embedding Generation

### TC-25: Verify Embedding Generation on Create

**Objective:** Verify embeddings are generated when content is created

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Create new product | Product saved | |
| 2 | Check server logs | Embedding generation logged | |
| 3 | Verify no errors | No embedding errors in console | |
| 4 | Create battlecard | Battlecard saved | |
| 5 | Check server logs | Embedding generation logged | |

**Notes:** _______________

---

### TC-26: Verify Embedding Update on Edit

**Objective:** Verify embeddings regenerate when content changes

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Edit product description | Save changes | |
| 2 | Check server logs | Embedding regeneration logged | |
| 3 | Edit battlecard content | Save changes | |
| 4 | Check server logs | Embedding regeneration logged | |

**Notes:** _______________

---

## Performance Benchmarks

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Products list load time | < 1 second | | |
| Battlecards list load time | < 1 second | | |
| Company profile load time | < 1 second | | |
| AI profile generation time | < 30 seconds | | |
| Product create (with embedding) | < 3 seconds | | |
| Battlecard create (with embedding) | < 3 seconds | | |
| Deal context save (with embedding) | < 3 seconds | | |
| RAG-enhanced proposal generation | < 90 seconds | | |

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
| TC-01: Access Knowledge Base | | |
| TC-02: KB Tab Navigation | | |
| TC-03: Products Empty State | | |
| TC-04: Create Product | | |
| TC-05: Edit Product | | |
| TC-06: Delete Product | | |
| TC-07: Battlecards Empty State | | |
| TC-08: Create Battlecard | | |
| TC-09: Edit Battlecard | | |
| TC-10: Delete Battlecard | | |
| TC-11: Company Profile Empty | | |
| TC-12: AI Profile Generation | | |
| TC-13: Edit Company Profile | | |
| TC-14: Navigate to Deal Context | | |
| TC-15: Add Context via Paste | | |
| TC-16: Add Context via Drag/Drop | | |
| TC-17: Multiple Context Items | | |
| TC-18: Access Provider Settings | | |
| TC-19: Change LLM Provider | | |
| TC-20: Bedrock Availability | | |
| TC-21: Proposal with Products | | |
| TC-22: Proposal with Battlecards | | |
| TC-23: Proposal with Profile | | |
| TC-24: Proposal with Deal Context | | |
| TC-25: Embedding on Create | | |
| TC-26: Embedding on Edit | | |

**Overall Result:** _______________

**Critical Issues:**
1. _______________
2. _______________
3. _______________

**Minor Issues:**
1. _______________
2. _______________
3. _______________

**Recommendations:**
1. _______________
2. _______________

**Tester Signature:** _______________ **Date:** _______________
