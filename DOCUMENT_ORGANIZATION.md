# Document Organization Strategy
**Version:** 1.0  
**Last Updated:** December 2025

---

## Current State Analysis

### Current Structure Issues

1. **Root Directory Clutter** - Planning docs mixed with config files
2. **Inconsistent Naming** - Mix of formats (PascalCase, kebab-case, underscores)
3. **Unclear Separation** - Architecture, planning, and design docs together
4. **Hard to Navigate** - Many files at root level
5. **Docs Folder Underutilized** - Only Word docs, missing markdown docs

---

## Recommended Structure

### Best Practice: Separation of Concerns

```
deeldesk/
├── README.md                    # Project overview (keep at root)
├── CLAUDE.md                    # AI coding context (keep at root)
├── .env.example                 # Config (keep at root)
├── docker-compose.yml           # Config (keep at root)
├── package.json                 # Config (keep at root)
│
├── docs/                        # All documentation
│   ├── planning/               # Project planning documents
│   │   ├── IMPLEMENTATION_PLAN.md
│   │   ├── SPRINT_PLAN.md
│   │   └── CHANGES_SUMMARY.md
│   │
│   ├── architecture/           # Technical architecture
│   │   ├── DATABASE_SCHEMA.sql
│   │   ├── LLM_PROVIDER_ARCHITECTURE.md
│   │   ├── PROPOSAL_VERSIONING_MVP.md
│   │   └── PRD_ADDENDUM_LLM_Data_Privacy.md
│   │
│   ├── product/                # Product requirements
│   │   ├── PRD_v4_0.docx
│   │   └── MRD_v4.docx
│   │
│   ├── design/                 # Design & UX documentation
│   │   ├── DESIGN_SYSTEM.md
│   │   ├── NAVIGATION_SYSTEM.md
│   │   ├── UX_GUIDE.md
│   │   ├── BRANDING_KNOWLEDGE_BASE.md
│   │   └── POTX_BRANDING_ANALYSIS.md
│   │
│   └── wireframes/             # Interactive wireframes
│       ├── responsive-design.html
│       ├── key-screens.html
│       └── navigation-demo.html
│
├── database/                    # Database files
│   ├── schema.sql              # Main schema (moved from root)
│   └── init-db.sql
│
└── [code directories...]       # app/, components/, lib/, etc.
```

---

## Detailed Organization

### 1. Root Directory (Minimal)

**Keep at Root:**
- `README.md` - First file users see
- `CLAUDE.md` - AI context (referenced in README)
- `package.json` - Required by Node.js
- `.env.example` - Standard location
- `docker-compose.yml` - Standard location
- `.gitignore` - Standard location

**Rationale:** Root should only contain essential files that tools/developers expect to find there.

---

### 2. `docs/` Directory Structure

#### `docs/planning/` - Project Planning
```
planning/
├── IMPLEMENTATION_PLAN.md
├── SPRINT_PLAN.md              # Renamed from Deeldesk_Sprint_Plan_Phase0_MVP.md
├── CHANGES_SUMMARY.md
└── ROADMAP.md                  # Future: Phase 2+ planning
```

**Purpose:** High-level project planning, timelines, resource allocation

**Naming Convention:** `UPPERCASE_WITH_UNDERSCORES.md` for planning docs

---

#### `docs/architecture/` - Technical Architecture
```
architecture/
├── DATABASE_SCHEMA.sql
├── LLM_PROVIDER_ARCHITECTURE.md
├── PROPOSAL_VERSIONING_MVP.md
├── PRD_ADDENDUM_LLM_Data_Privacy.md
└── API_DESIGN.md               # Future: API documentation
```

**Purpose:** Technical decisions, system design, architecture patterns

**Naming Convention:** `UPPERCASE_WITH_UNDERSCORES.md` for architecture docs

---

#### `docs/product/` - Product Requirements
```
product/
├── PRD_v4_0.docx
├── MRD_v4.docx
└── FEATURE_SPECS/              # Future: Individual feature specs
    └── [feature-name].md
```

**Purpose:** Product requirements, market research, feature specifications

**Naming Convention:** Keep original Word doc names, add markdown specs as needed

---

#### `docs/design/` - Design & UX
```
design/
├── DESIGN_SYSTEM.md
├── NAVIGATION_SYSTEM.md
├── UX_GUIDE.md
├── BRANDING_KNOWLEDGE_BASE.md
├── POTX_BRANDING_ANALYSIS.md
└── COMPONENT_SPECS/            # Future: Individual component specs
    └── [component-name].md
```

**Purpose:** Design system, UX patterns, user flows, branding guidelines

**Naming Convention:** `UPPERCASE_WITH_UNDERSCORES.md` for design docs

---

#### `docs/wireframes/` - Interactive Prototypes
```
wireframes/
├── responsive-design.html
├── key-screens.html
├── navigation-demo.html
└── assets/                     # Future: Images, videos
    └── screenshots/
```

**Purpose:** Interactive HTML wireframes, prototypes, demos

**Naming Convention:** `kebab-case.html` for wireframes

---

### 3. `database/` Directory

```
database/
├── schema.sql                  # Main schema (moved from DATABASE_SCHEMA.sql)
├── init-db.sql
└── migrations/                 # Future: Manual migrations if needed
    └── [timestamp]_[description].sql
```

**Purpose:** All database-related files in one place

---

## Naming Conventions

### Markdown Files

| Type | Convention | Example |
|------|------------|---------|
| Planning | `UPPERCASE_WITH_UNDERSCORES.md` | `IMPLEMENTATION_PLAN.md` |
| Architecture | `UPPERCASE_WITH_UNDERSCORES.md` | `LLM_PROVIDER_ARCHITECTURE.md` |
| Design | `UPPERCASE_WITH_UNDERSCORES.md` | `DESIGN_SYSTEM.md` |
| Guides | `UPPERCASE_WITH_UNDERSCORES.md` | `UX_GUIDE.md` |

### HTML Files

| Type | Convention | Example |
|------|------------|---------|
| Wireframes | `kebab-case.html` | `responsive-design.html` |
| Demos | `kebab-case-demo.html` | `navigation-demo.html` |

### SQL Files

| Type | Convention | Example |
|------|------------|---------|
| Schema | `schema.sql` or `kebab-case.sql` | `schema.sql` |
| Migrations | `[timestamp]_[description].sql` | `20250115_add_active_flag.sql` |

---

## File Organization Principles

### 1. **Separation of Concerns**
- Planning ≠ Architecture ≠ Design
- Keep related files together
- Clear boundaries between types

### 2. **Scalability**
- Structure supports growth
- Easy to add new categories
- Subdirectories for related files

### 3. **Discoverability**
- Logical grouping
- Consistent naming
- Clear hierarchy

### 4. **Maintenance**
- Easy to find files
- Clear ownership
- Version control friendly

---

## Migration Plan

### Phase 1: Create Structure (5 minutes)

```bash
# Create directories
mkdir -p docs/planning
mkdir -p docs/architecture
mkdir -p docs/product
mkdir -p docs/design
mkdir -p docs/wireframes
mkdir -p database
```

### Phase 2: Move Files (10 minutes)

**Planning:**
```bash
mv IMPLEMENTATION_PLAN.md docs/planning/
mv Deeldesk_Sprint_Plan_Phase0_MVP.md docs/planning/SPRINT_PLAN.md
mv CHANGES_SUMMARY.md docs/planning/
```

**Architecture:**
```bash
mv DATABASE_SCHEMA.sql docs/architecture/
mv LLM_PROVIDER_ARCHITECTURE.md docs/architecture/
mv PROPOSAL_VERSIONING_MVP.md docs/architecture/
mv PRD_ADDENDUM_LLM_Data_Privacy.md docs/architecture/
```

**Product:**
```bash
mv Docs/*.docx docs/product/
rmdir Docs  # Remove old directory
```

**Design:**
```bash
mv Wireframes/*.md docs/design/
mv Wireframes/*.html docs/wireframes/
rmdir Wireframes  # Remove old directory
```

**Database:**
```bash
mv init-db.sql database/
# Keep DATABASE_SCHEMA.sql in docs/architecture/ (reference)
# Or move to database/ and update references
```

### Phase 3: Update References (15 minutes)

**Files to Update:**
1. `README.md` - Update documentation links
2. `CLAUDE.md` - Update file paths
3. `docs/planning/IMPLEMENTATION_PLAN.md` - Update references
4. Any other files referencing moved documents

---

## Recommended Final Structure

```
deeldesk/
├── README.md
├── CLAUDE.md
├── .env.example
├── docker-compose.yml
├── package.json
│
├── docs/
│   ├── README.md              # Documentation index
│   │
│   ├── planning/
│   │   ├── IMPLEMENTATION_PLAN.md
│   │   ├── SPRINT_PLAN.md
│   │   └── CHANGES_SUMMARY.md
│   │
│   ├── architecture/
│   │   ├── DATABASE_SCHEMA.sql
│   │   ├── LLM_PROVIDER_ARCHITECTURE.md
│   │   ├── PROPOSAL_VERSIONING_MVP.md
│   │   └── PRD_ADDENDUM_LLM_Data_Privacy.md
│   │
│   ├── product/
│   │   ├── PRD_v4_0.docx
│   │   └── MRD_v4.docx
│   │
│   ├── design/
│   │   ├── DESIGN_SYSTEM.md
│   │   ├── NAVIGATION_SYSTEM.md
│   │   ├── UX_GUIDE.md
│   │   ├── BRANDING_KNOWLEDGE_BASE.md
│   │   └── POTX_BRANDING_ANALYSIS.md
│   │
│   └── wireframes/
│       ├── responsive-design.html
│       ├── key-screens.html
│       └── navigation-demo.html
│
├── database/
│   ├── schema.sql
│   └── init-db.sql
│
└── [code directories...]
```

---

## Documentation Index

Create `docs/README.md` to help navigation:

```markdown
# Deeldesk.ai Documentation

## Quick Links

### Planning
- [Implementation Plan](./planning/IMPLEMENTATION_PLAN.md)
- [Sprint Plan](./planning/SPRINT_PLAN.md)

### Architecture
- [Database Schema](./architecture/DATABASE_SCHEMA.sql)
- [LLM Provider Architecture](./architecture/LLM_PROVIDER_ARCHITECTURE.md)
- [Proposal Versioning](./architecture/PROPOSAL_VERSIONING_MVP.md)

### Design
- [Design System](./design/DESIGN_SYSTEM.md)
- [Navigation System](./design/NAVIGATION_SYSTEM.md)
- [UX Guide](./design/UX_GUIDE.md)

### Wireframes
- [Responsive Design](./wireframes/responsive-design.html)
- [Key Screens](./wireframes/key-screens.html)
```

---

## Best Practices Summary

### ✅ Do

1. **Group by Purpose** - Planning, architecture, design separate
2. **Consistent Naming** - Follow conventions within each category
3. **Clear Hierarchy** - Logical folder structure
4. **Documentation Index** - `docs/README.md` for navigation
5. **Keep Root Clean** - Only essential files at root
6. **Version Control** - All docs in git (except sensitive)

### ❌ Don't

1. **Mix Concerns** - Don't put planning docs with design docs
2. **Inconsistent Naming** - Don't mix naming conventions
3. **Deep Nesting** - Don't go more than 3-4 levels deep
4. **Duplicate Files** - Don't keep files in multiple places
5. **Generic Names** - Don't use "misc" or "other" folders
6. **Ignore Structure** - Don't add files without considering organization

---

## Future Scalability

### As Project Grows

**Add Subdirectories:**
```
docs/
├── planning/
│   └── sprints/              # Individual sprint plans
├── architecture/
│   └── decisions/            # ADRs (Architecture Decision Records)
├── design/
│   └── components/           # Individual component specs
└── wireframes/
    └── versions/             # Version history of wireframes
```

**Add New Categories:**
```
docs/
├── api/                      # API documentation
├── deployment/               # Deployment guides
├── testing/                 # Test plans and strategies
└── runbooks/                # Operational runbooks
```

---

## Benefits of This Structure

1. **Clear Organization** - Easy to find what you need
2. **Scalable** - Can grow without restructuring
3. **Professional** - Follows industry best practices
4. **Maintainable** - Easy to update and reorganize
5. **Onboarding** - New team members can navigate easily
6. **Version Control** - Git-friendly structure

---

## Implementation Checklist

- [ ] Create directory structure
- [ ] Move planning documents
- [ ] Move architecture documents
- [ ] Move product documents
- [ ] Move design documents
- [ ] Move wireframes
- [ ] Move database files
- [ ] Update README.md with new paths
- [ ] Update CLAUDE.md with new paths
- [ ] Create docs/README.md index
- [ ] Update all internal references
- [ ] Test all links work
- [ ] Commit changes to git

---

**Recommendation:** Implement this structure before starting development. It will save time and confusion as the project grows.

