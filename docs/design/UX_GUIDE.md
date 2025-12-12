# Deeldesk.ai UX Design Guide
**Version:** 1.0  
**For:** Phase 0 Testing & MVP Development  
**Last Updated:** December 2025

---

## Overview

This guide provides a complete responsive UX design system for Deeldesk.ai, covering all key user flows from Phase 0 testing through MVP launch. All designs follow a mobile-first approach and are optimized for accessibility and performance.

---

## Design Files

### 1. **DESIGN_SYSTEM.md**
Complete design system documentation including:
- Design tokens (colors, typography, spacing)
- Component library specifications
- Layout patterns
- Responsive breakpoints
- Animation guidelines
- Accessibility standards

**Use for:** Implementation reference, developer handoff

### 2. **responsive-design.html**
Interactive wireframe covering core user flows:
- Dashboard
- New Proposal Generation
- Proposal Editor
- Share Link functionality
- Mobile bottom sheets
- Progress indicators
- Loading states

**Use for:** Phase 0 user testing, stakeholder demos

### 3. **key-screens.html**
Additional screens for:
- Opportunities List
- Knowledge Base (Products, Battlecards, Playbooks)
- Settings/Organization Configuration
- Public Proposal Viewer

**Use for:** Complete flow testing, feature validation

### 4. **deeldesk-preview.html**
Original wireframe (legacy - use responsive-design.html instead)

---

## Key User Flows

### Flow 1: First-Time User Onboarding
**Target:** <10 minutes to first proposal

1. **Sign Up** → Email/password or Google OAuth
2. **Organization Setup** → Auto-created, user can name it
3. **Dashboard (Empty State)** → Clear CTA: "Create Your First Proposal"
4. **New Proposal** → Simple textarea, no required fields
5. **Generation** → Real-time progress, streaming updates
6. **View Proposal** → Immediate value delivery

**Testing Focus:**
- Time to first proposal
- Friction points
- "Aha moment" identification

---

### Flow 2: Proposal Generation with Context
**Target:** Enhanced proposals with deal context

1. **Create Opportunity** → Name, description, expected value
2. **Add Deal Context** → Paste emails, transcripts, notes
3. **Generate Proposal** → Context automatically included
4. **Review & Edit** → Pricing confirmation, governance warnings
5. **Export/Share** → PPTX, PDF, or shareable link

**Testing Focus:**
- Context integration quality
- Pricing accuracy
- Export fidelity

---

### Flow 3: Knowledge Base Management
**Target:** Build organizational knowledge

1. **Add Products** → Name, description, pricing model
2. **Add Battlecards** → Competitor intelligence
3. **Query KB** → Natural language questions
4. **Auto-Retrieval** → Relevant content in proposals

**Testing Focus:**
- KB content quality in proposals
- Query accuracy
- Vector search performance

---

### Flow 4: Mobile Experience
**Target:** Full functionality on mobile devices

1. **Responsive Layouts** → All screens work on 320px+
2. **Touch Targets** → Minimum 44x44px
3. **Bottom Sheets** → Mobile-native patterns
4. **FAB** → Quick access to new proposal
5. **Swipe Gestures** → Slide navigation

**Testing Focus:**
- Mobile usability
- Touch interaction quality
- Performance on mobile devices

---

## Responsive Breakpoints

### Mobile (320px - 639px)
- Single column layouts
- Bottom sheets for modals
- Floating Action Button (FAB)
- Hamburger menu
- Stacked cards

### Tablet (640px - 1023px)
- Two-column grids where appropriate
- Side navigation (collapsible)
- Larger touch targets
- Optimized spacing

### Desktop (1024px+)
- Three-column proposal editor
- Persistent sidebar navigation
- Hover states
- Keyboard shortcuts
- Multi-panel layouts

### Large Desktop (1280px+)
- Maximum content width (1400px)
- Enhanced spacing
- Additional context panels

---

## Component Usage Guide

### Buttons

**Primary Button** - Main actions
```html
<button class="btn btn-primary">Generate Proposal</button>
```

**Secondary Button** - Alternative actions
```html
<button class="btn btn-secondary">Cancel</button>
```

**FAB** - Mobile-only, quick actions
```html
<button class="fab">+</button>
```

### Cards

**Standard Card** - Content containers
```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content...</p>
</div>
```

### Inputs

**Text Input**
```html
<input type="text" class="input" placeholder="Enter text...">
```

**Textarea**
```html
<textarea class="textarea" placeholder="Enter description..."></textarea>
```

### Progress Indicators

**Progress Bar**
```html
<div class="progress-bar">
  <div class="progress-fill" style="width: 60%;"></div>
</div>
<p class="progress-text">Generating slide 3 of 5...</p>
```

### Loading States

**Spinner**
```html
<div class="spinner"></div>
```

**Streaming Text**
```html
<p class="streaming-text">Generating content...</p>
```

---

## Phase 0 Testing Scenarios

### Scenario A: Cold Start
**User:** New user, zero prior content  
**Goal:** Generate first proposal in <10 minutes

**Steps:**
1. Sign up
2. Land on dashboard
3. Click "New Proposal"
4. Enter prompt: "Acme Bank, $1M budget, security focus"
5. Generate proposal
6. View completed proposal

**Metrics:**
- Time to first proposal
- Task completion rate
- User satisfaction

---

### Scenario B: Minimal Setup
**User:** Adds one battlecard + one product  
**Goal:** Validate KB content appears in proposals

**Steps:**
1. Add product: "Enterprise Plan, $100/seat"
2. Add battlecard: "vs. Snowflake"
3. Generate proposal mentioning competitor
4. Verify battlecard content included
5. Verify product pricing calculated

**Metrics:**
- KB content retrieval accuracy
- Pricing calculation accuracy
- User perception of relevance

---

### Scenario C: Deal Context Integration
**User:** Pastes 500-word email thread  
**Goal:** Validate context enhances proposal

**Steps:**
1. Create opportunity
2. Paste email thread as context
3. Generate proposal
4. Verify deal-specific details appear
5. Check context panel shows pasted content

**Metrics:**
- Context integration quality
- Proposal relevance
- User satisfaction

---

## Accessibility Checklist

### Color Contrast
- [ ] All text meets WCAG 2.1 AA (4.5:1 minimum)
- [ ] Interactive elements have 3:1 contrast
- [ ] Focus indicators are visible

### Keyboard Navigation
- [ ] All interactive elements keyboard accessible
- [ ] Logical tab order
- [ ] Skip links for main content
- [ ] Escape key closes modals

### Screen Readers
- [ ] Semantic HTML elements used
- [ ] ARIA labels where needed
- [ ] Alt text for images
- [ ] Form labels properly associated
- [ ] Status messages announced

### Touch Targets
- [ ] Minimum 44x44px for all touch targets
- [ ] Adequate spacing between targets
- [ ] No overlapping interactive elements

---

## Performance Targets

### Load Times
- **First Contentful Paint:** <1.5s
- **Time to Interactive:** <3s
- **Proposal Generation:** <60s

### Responsiveness
- **Interaction Feedback:** <100ms
- **Page Transitions:** <200ms
- **Animation Frame Rate:** 60fps

### Mobile Performance
- **3G Connection:** Functional in <5s
- **4G Connection:** Functional in <2s
- **Offline Support:** Basic functionality

---

## Implementation Notes

### CSS Framework
Use **Tailwind CSS** with custom configuration matching design tokens.

### Component Library
Build React components using these patterns. Consider **shadcn/ui** as a base.

### Responsive Strategy
1. **Mobile-first CSS** - Start with mobile, enhance for larger screens
2. **Progressive Enhancement** - Core functionality works everywhere
3. **Flexible Layouts** - Use Grid and Flexbox
4. **Container Queries** - Where supported, use for component-level responsiveness

### Testing Tools
- **BrowserStack** - Cross-browser testing
- **Lighthouse** - Performance audits
- **axe DevTools** - Accessibility testing
- **Responsive Design Mode** - Chrome DevTools

---

## Design Iteration Process

### Phase 0 Testing
1. **User Testing** - Test with 5-10 users
2. **Collect Feedback** - Time to value, friction points
3. **Iterate** - Quick fixes based on feedback
4. **Document** - Update wireframes with learnings

### MVP Development
1. **Component Implementation** - Build reusable components
2. **Integration Testing** - Test full flows
3. **Performance Optimization** - Meet targets
4. **Accessibility Audit** - Fix issues

### Post-Launch
1. **Analytics Review** - User behavior data
2. **A/B Testing** - Optimize conversion
3. **Continuous Improvement** - Regular updates

---

## File Structure

```
docs/
├── design/
│   ├── DESIGN_SYSTEM.md          # Complete design system
│   ├── NAVIGATION_SYSTEM.md      # Navigation architecture & patterns
│   ├── BRANDING_KNOWLEDGE_BASE.md # Branding integration spec
│   ├── POTX_BRANDING_ANALYSIS.md # POTX feasibility analysis
│   └── UX_GUIDE.md               # This file
└── wireframes/
    ├── responsive-design.html    # Main interactive wireframe
    ├── key-screens.html          # Additional screens
    └── navigation-demo.html      # Navigation system demo
```

---

## Next Steps

1. **Review Designs** - Stakeholder approval
2. **Phase 0 Testing** - User testing with wireframes
3. **Component Library** - Build React components
4. **Integration** - Integrate into Next.js app
5. **Continuous Testing** - Test on real devices

---

## Questions or Feedback?

For design questions or feedback, refer to:
- **Design System** - `DESIGN_SYSTEM.md`
- **Implementation Plan** - `../planning/IMPLEMENTATION_PLAN.md`

---

**Last Updated:** December 2025  
**Status:** Ready for Phase 0 Testing

