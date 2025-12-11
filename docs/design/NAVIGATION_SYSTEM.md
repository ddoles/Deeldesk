# Deeldesk.ai Navigation System
**Version:** 1.0  
**Status:** Phase 0 & MVP Ready  
**Last Updated:** December 2025

---

## Navigation Architecture

### Primary Navigation Routes

```
/ (Dashboard)
├── /opportunities
│   ├── /opportunities/[id]
│   │   └── /opportunities/[id]/proposals/[proposalId]
├── /proposals
│   └── /proposals/[id]
├── /knowledge
│   ├── /knowledge/products
│   ├── /knowledge/battlecards
│   ├── /knowledge/playbooks
│   ├── /knowledge/branding          # Brand guidelines for KB content
│   └── /knowledge/company-profile   # Organization business model summary
└── /settings
    ├── /settings/organization
    ├── /settings/profile
    └── /settings/billing
```

### Public Routes
- `/share/[id]` - Public proposal viewer (no navigation)

---

## Navigation Patterns

### 1. Desktop Navigation (1024px+)

**Layout:** Persistent left sidebar + top header

```
┌─────────────────────────────────────────┐
│ Header: Logo | Search | Notifications  │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │  Main Content Area           │
│          │                              │
│ • Home   │                              │
│ • Opps   │                              │
│ • Props  │                              │
│ • KB     │                              │
│ • Settings│                             │
│          │                              │
└──────────┴──────────────────────────────┘
```

**Sidebar Features:**
- Collapsible (icon-only mode)
- Active state indicators
- Badge counts (e.g., "Opportunities (5)")
- Keyboard shortcuts visible
- Organization switcher (if multi-org)

---

### 2. Tablet Navigation (768px - 1023px)

**Layout:** Collapsible sidebar + top header

```
┌─────────────────────────────────────────┐
│ ☰ Logo | Search | Notifications        │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │  Main Content                │
│ (Hidden) │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

**Behavior:**
- Sidebar hidden by default
- Hamburger menu toggles sidebar overlay
- Sidebar slides in from left
- Overlay backdrop when open

---

### 3. Mobile Navigation (320px - 767px)

**Layout:** Top header + bottom navigation bar

```
┌─────────────────────────────────────────┐
│ ☰ Logo | Notifications                  │
├─────────────────────────────────────────┤
│                                         │
│         Main Content                    │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ Home | Opps | + | KB | Settings        │
└─────────────────────────────────────────┘
```

**Bottom Navigation:**
- Always visible (sticky)
- Icon + label
- FAB in center for "New Proposal"
- Active state indicator
- Badge counts on icons

---

## Navigation Components

### Desktop Sidebar

```html
<nav class="sidebar">
  <div class="sidebar-header">
    <Logo />
    <OrganizationSwitcher />
  </div>
  
  <nav class="sidebar-nav">
    <NavItem href="/" icon="home" label="Dashboard" />
    <NavItem href="/opportunities" icon="briefcase" label="Opportunities" badge="5" />
    <NavItem href="/proposals" icon="file-text" label="Proposals" />
    <NavItem href="/knowledge" icon="book" label="Knowledge Base" />
    <NavItem href="/settings" icon="settings" label="Settings" />
  </nav>
  
  <div class="sidebar-footer">
    <UserMenu />
    <KeyboardShortcuts />
  </div>
</nav>
```

**States:**
- **Expanded:** Full width (240px), labels visible
- **Collapsed:** Icon-only (64px), labels hidden on hover
- **Active:** Highlighted background, accent border

---

### Mobile Bottom Navigation

```html
<nav class="bottom-nav">
  <NavItem href="/" icon="home" label="Home" />
  <NavItem href="/opportunities" icon="briefcase" label="Opps" badge="5" />
  <FAB href="/proposals/new" icon="+" />
  <NavItem href="/knowledge" icon="book" label="KB" />
  <NavItem href="/settings" icon="settings" label="Settings" />
</nav>
```

**Features:**
- Fixed to bottom
- Safe area padding (for notched devices)
- Active state indicator (underline)
- Badge counts
- FAB elevated above nav bar

---

### Top Header (All Sizes)

```html
<header class="app-header">
  <div class="header-left">
    <MobileMenuToggle /> <!-- Mobile only -->
    <Logo />
    <Breadcrumbs /> <!-- Contextual -->
  </div>
  
  <div class="header-center">
    <SearchBar /> <!-- Desktop/Tablet only -->
  </div>
  
  <div class="header-right">
    <QuickActions>
      <SafeModeToggle />
      <Notifications />
      <UserMenu />
    </QuickActions>
  </div>
</header>
```

**Features:**
- Sticky positioning
- Breadcrumbs for deep navigation
- Global search (desktop/tablet)
- Quick actions (Safe Mode, Notifications)
- User menu (avatar dropdown)

---

### Breadcrumbs

**Usage:** Show navigation path for deep pages

```
Dashboard > Opportunities > Acme Bank > Proposal v2
```

**Behavior:**
- Clickable segments
- Truncate if too long
- Mobile: Show only last 2 segments

---

## Contextual Navigation

### Proposal Editor Navigation

**Desktop:**
- Left: Slide thumbnails (vertical scroll)
- Center: Slide canvas
- Right: Context panel with tabs
  - Deal Context
  - Explain Slide
  - Version History

**Mobile:**
- Slide thumbnails: Horizontal scroll at top
- Slide canvas: Full width
- Context: Bottom sheet or modal

---

### Opportunity Detail Navigation

**Tabs:**
- Overview
- Proposals (with version history)
- Deal Context
- Strategy Records

**Mobile:** Convert tabs to segmented control or dropdown

---

## Navigation States

### Active State
- **Desktop Sidebar:** Accent background, left border
- **Mobile Bottom Nav:** Accent underline, icon highlight
- **Breadcrumbs:** Current page in bold

### Hover State
- **Desktop:** Background color change, smooth transition
- **Mobile:** Touch feedback (ripple effect)

### Disabled State
- Grayed out
- No interaction
- Tooltip explaining why (e.g., "Upgrade to Pro")

---

## Keyboard Navigation

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette / search |
| `Cmd/Ctrl + N` | New proposal |
| `Cmd/Ctrl + O` | New opportunity |
| `Cmd/Ctrl + ,` | Open settings |
| `?` | Show keyboard shortcuts |

### Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| `G + D` | Go to Dashboard |
| `G + O` | Go to Opportunities |
| `G + P` | Go to Proposals |
| `G + K` | Go to Knowledge Base |
| `G + S` | Go to Settings |

---

## Accessibility

### ARIA Labels

```html
<nav aria-label="Main navigation">
  <a href="/" aria-current="page">Dashboard</a>
</nav>
```

### Focus Management

- Visible focus indicators
- Logical tab order
- Skip links for main content
- Focus trap in modals

### Screen Reader Support

- Announce active page
- Announce navigation changes
- Descriptive link text
- Hidden labels for icon-only buttons

---

## Responsive Breakpoints

### Mobile (320px - 767px)
- Bottom navigation bar
- Hamburger menu in header
- Full-width content
- Bottom sheets for modals

### Tablet (768px - 1023px)
- Collapsible sidebar
- Top header with search
- Two-column layouts where appropriate

### Desktop (1024px+)
- Persistent sidebar
- Full navigation visible
- Multi-column layouts
- Hover states

---

## Implementation Notes

### Next.js App Router Structure

```
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── (dashboard)/
│   ├── layout.tsx          # Sidebar + Header
│   ├── page.tsx            # Dashboard
│   ├── opportunities/
│   │   ├── page.tsx        # List
│   │   └── [id]/
│   │       └── page.tsx    # Detail
│   ├── proposals/
│   ├── knowledge/
│   └── settings/
└── share/[id]/             # Public (no nav)
```

### Component Structure

```
components/
├── navigation/
│   ├── Sidebar.tsx
│   ├── BottomNav.tsx
│   ├── Header.tsx
│   ├── Breadcrumbs.tsx
│   ├── NavItem.tsx
│   └── UserMenu.tsx
└── layout/
    ├── AppShell.tsx
    └── DashboardLayout.tsx
```

---

## Navigation Flow Examples

### Flow 1: Create New Proposal

**Desktop:**
1. Click "New Proposal" in sidebar
2. OR use `Cmd/Ctrl + N`
3. Navigate to `/proposals/new`
4. Breadcrumb: Dashboard > New Proposal

**Mobile:**
1. Tap FAB (+) in bottom nav
2. Navigate to `/proposals/new`
3. Header shows back button

---

### Flow 2: Navigate to Opportunity

**Desktop:**
1. Click "Opportunities" in sidebar
2. Click opportunity card
3. Breadcrumb: Dashboard > Opportunities > Acme Bank
4. Tabs for Overview, Proposals, Context

**Mobile:**
1. Tap "Opps" in bottom nav
2. Tap opportunity card
3. Full-screen detail view
4. Swipe or tabs for sections

---

### Flow 3: Access Knowledge Base

**Desktop:**
1. Click "Knowledge Base" in sidebar
2. Tabs: Products, Battlecards, Playbooks
3. Breadcrumb: Dashboard > Knowledge Base > Products

**Mobile:**
1. Tap "KB" in bottom nav
2. Segmented control for tabs
3. List view with search

---

## Phase 0 Testing Considerations

### Navigation Usability Tests

1. **Time to Navigate**
   - Can users find Opportunities in <3 seconds?
   - Can users create new proposal in <2 clicks?

2. **Mobile Navigation**
   - Is bottom nav accessible with thumb?
   - Are touch targets large enough (44px)?
   - Does FAB interfere with scrolling?

3. **Keyboard Navigation**
   - Can power users navigate without mouse?
   - Are shortcuts discoverable?
   - Is focus management correct?

4. **Breadcrumb Effectiveness**
   - Do users understand their location?
   - Can users navigate back easily?
   - Are breadcrumbs helpful on mobile?

---

## Design Tokens for Navigation

```css
/* Sidebar */
--sidebar-width: 240px;
--sidebar-width-collapsed: 64px;
--sidebar-bg: var(--color-bg-primary);
--sidebar-border: var(--color-gray-200);

/* Bottom Nav */
--bottom-nav-height: 64px;
--bottom-nav-bg: var(--color-bg-primary);
--bottom-nav-shadow: var(--shadow-lg);

/* Active States */
--nav-active-bg: rgba(0, 212, 196, 0.1);
--nav-active-border: var(--color-accent);
--nav-active-text: var(--color-accent);
```

---

## Future Enhancements (Post-MVP)

1. **Command Palette** - `Cmd/Ctrl + K` for quick navigation
2. **Recent Items** - Quick access to recently viewed proposals
3. **Favorites** - Star frequently used opportunities
4. **Multi-Organization Switcher** - For users in multiple orgs
5. **Custom Navigation** - Let users reorder nav items
6. **Keyboard Shortcuts Modal** - `?` to show all shortcuts

---

**Next Steps:**
1. Implement sidebar component
2. Implement bottom nav component
3. Add breadcrumb component
4. Test on real devices
5. Iterate based on Phase 0 feedback

