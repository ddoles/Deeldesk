# Deeldesk.ai Design System
**Version:** 1.0  
**Status:** Phase 0 & MVP Ready  
**Last Updated:** December 2025

---

## Design Principles

1. **Speed First** — Every interaction should feel instant (<100ms feedback)
2. **Zero Cold Start** — Users can generate their first proposal in <10 minutes
3. **Progressive Disclosure** — Show complexity only when needed
4. **Mobile-First** — Responsive from 320px to 2560px+
5. **Accessibility** — WCAG 2.1 AA compliant

---

## Design Tokens

### Colors

```css
/* Primary Brand Colors */
--color-primary: #0033A0;        /* Deep Blue - Trust, Enterprise */
--color-primary-light: #0052CC;   /* Lighter Blue - Interactive */
--color-primary-dark: #002266;   /* Darker Blue - Hover States */

/* Accent Colors */
--color-accent: #00D4C4;         /* Teal - Actions, CTAs */
--color-accent-light: #33E0D0;   /* Light Teal - Hover */
--color-accent-dark: #00B8A8;    /* Dark Teal - Active */

/* Semantic Colors */
--color-success: #10B981;        /* Green - Success states */
--color-warning: #F59E0B;        /* Amber - Warnings */
--color-error: #EF4444;           /* Red - Errors */
--color-info: #3B82F6;            /* Blue - Info messages */

/* Neutral Colors */
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;

/* Background Colors */
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #F9FAFB;
--color-bg-tertiary: #F3F4F6;
--color-bg-overlay: rgba(0, 0, 0, 0.5);

/* Text Colors */
--color-text-primary: #111827;
--color-text-secondary: #6B7280;
--color-text-tertiary: #9CA3AF;
--color-text-inverse: #FFFFFF;
```

### Typography

```css
/* Font Families */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes (Mobile → Desktop) */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing

```css
/* Spacing Scale (4px base) */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Border Radius

```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 9999px;  /* Full circle */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large Desktops */
```

### Transitions

```css
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
```

---

## Component Library

### Navigation Components

**Desktop Sidebar**
```css
.sidebar {
  width: 240px;
  background: var(--color-bg-primary);
  border-right: 1px solid var(--color-gray-200);
  position: fixed;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.nav-item.active {
  background: rgba(0, 212, 196, 0.1);
  color: var(--color-accent);
  border-left: 3px solid var(--color-accent);
}
```

**Mobile Bottom Navigation**
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: space-around;
  padding: 0.5rem;
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  z-index: 100;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  min-width: 44px; /* Touch target */
  text-decoration: none;
  color: var(--color-gray-500);
}

.bottom-nav-item.active {
  color: var(--color-accent);
}

.bottom-nav-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  width: 40px;
  height: 3px;
  background: var(--color-accent);
}
```

**Breadcrumbs**
```css
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
}

.breadcrumb-link {
  color: var(--color-gray-500);
  text-decoration: none;
}

.breadcrumb-link:hover {
  color: var(--color-primary);
}

.breadcrumb-current {
  color: var(--color-gray-900);
  font-weight: var(--font-semibold);
}
```

### Buttons

**Primary Button**
```css
.btn-primary {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  transition: all var(--transition-base);
}

.btn-primary:hover {
  background: var(--color-accent-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

**Secondary Button**
```css
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: var(--space-3) var(--space-6);
}
```

**FAB (Floating Action Button)**
```css
.fab {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: white;
  border: none;
  box-shadow: var(--shadow-xl);
  font-size: var(--text-2xl);
  cursor: pointer;
  z-index: 100;
}

@media (min-width: 1024px) {
  .fab { display: none; }
}
```

### Cards

```css
.card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
}

.card-hover {
  transition: all var(--transition-base);
}

.card-hover:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Input Fields

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: all var(--transition-base);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(0, 212, 196, 0.1);
}
```

### Textarea

```css
.textarea {
  width: 100%;
  padding: var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-family: var(--font-sans);
  resize: vertical;
  min-height: 120px;
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.badge-success {
  background: var(--color-success);
  color: white;
}

.badge-warning {
  background: var(--color-warning);
  color: white;
}
```

### Progress Indicators

```css
.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width var(--transition-slow);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
```

### Loading States

```css
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-200) 0%,
    var(--color-gray-100) 50%,
    var(--color-gray-200) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Bottom Sheet (Mobile)

```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: var(--shadow-2xl);
  transform: translateY(100%);
  transition: transform var(--transition-slow);
  z-index: 1000;
  max-height: 90vh;
  overflow-y: auto;
}

.bottom-sheet.open {
  transform: translateY(0);
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--color-gray-300);
  border-radius: var(--radius-full);
  margin: var(--space-3) auto;
}
```

### Modal

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--space-4);
}

.modal {
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
```

---

## Layout Patterns

### App Shell

```css
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-main {
  flex: 1;
  padding: var(--space-6);
}

@media (min-width: 1024px) {
  .app-layout {
    display: grid;
    grid-template-columns: 240px 1fr;
  }
  
  .app-sidebar {
    background: var(--color-bg-secondary);
    border-right: 1px solid var(--color-gray-200);
    padding: var(--space-6);
  }
}
```

### Dashboard Grid

```css
.dashboard-grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Proposal Editor Layout

```css
.proposal-editor {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .proposal-editor {
    grid-template-columns: 200px 1fr 300px;
  }
}

.slide-thumbnails {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.slide-canvas {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  min-height: 600px;
  padding: var(--space-8);
}

.context-panel {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}
```

---

## Responsive Patterns

### Mobile-First Navigation

```css
/* Mobile: Hamburger Menu */
.mobile-nav {
  display: block;
}

.desktop-nav {
  display: none;
}

@media (min-width: 1024px) {
  .mobile-nav {
    display: none;
  }
  
  .desktop-nav {
    display: flex;
  }
}
```

### Responsive Typography

```css
.heading-1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

@media (min-width: 768px) {
  .heading-1 {
    font-size: var(--text-4xl);
  }
}

@media (min-width: 1024px) {
  .heading-1 {
    font-size: var(--text-5xl);
  }
}
```

### Touch Targets

```css
/* Minimum 44x44px for touch targets */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## Animation Guidelines

### Micro-interactions

- **Hover:** 150ms ease-in-out
- **Click/Tap:** 100ms ease-out
- **Page Transitions:** 200ms ease-in-out
- **Loading:** Continuous, smooth animations

### Motion Principles

1. **Purposeful** — Every animation serves a purpose
2. **Subtle** — Don't distract from content
3. **Fast** — Users should never wait for animations
4. **Natural** — Use easing, not linear

---

## Accessibility

### Color Contrast

- **Text on Background:** Minimum 4.5:1 ratio
- **Large Text:** Minimum 3:1 ratio
- **Interactive Elements:** Minimum 3:1 ratio

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Focus indicators must be visible
- Tab order must be logical

### Screen Readers

- Semantic HTML elements
- ARIA labels where needed
- Alt text for images
- Form labels properly associated

---

## Phase 0 Testing Considerations

### What to Test

1. **Time to First Proposal** — Can users generate a proposal in <10 minutes?
2. **Mobile Usability** — Are all features accessible on mobile?
3. **Error States** — Are error messages clear and actionable?
4. **Loading States** — Do users understand what's happening?
5. **Onboarding Flow** — Is the first-time experience smooth?

### Metrics to Track

- Time to first proposal
- Task completion rate
- Error rate
- User satisfaction (NPS)
- Mobile vs Desktop usage

---

## Implementation Notes

### CSS Framework

Use Tailwind CSS with custom configuration matching these tokens.

### Component Library

Build React components using these design tokens. Consider using shadcn/ui as a base.

### Responsive Strategy

1. Mobile-first CSS
2. Progressive enhancement
3. Touch-friendly targets (44px minimum)
4. Flexible layouts (Grid/Flexbox)

---

**Next Steps:**
1. Create HTML wireframes for all key screens
2. Build component library in React
3. Implement responsive layouts
4. Test on real devices (Phase 0)
5. Iterate based on user feedback

