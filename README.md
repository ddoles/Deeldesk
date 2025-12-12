# Deeldesk.ai

**AI-Powered Proposal Generation Platform**  
*The First System of Record for Sales Strategy*

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)

---

## Overview

Deeldesk.ai enables sales professionals to generate professional, brand-compliant proposals in minutes instead of hours. The platform automatically captures the positioning, pricing, and solutioning (PPS) decisions from every proposal, building the first system of record for sales strategy.

### Key Features

- **🚀 AI Proposal Generation** — Natural language to professional slides in <60 seconds
- **📊 Intelligent Pricing** — Auto-calculation with governance warnings
- **🎯 Strategy Capture** — Automatic extraction of positioning, pricing, solutioning decisions
- **💬 Conversational Knowledge** — Query your product catalog, battlecards, and playbooks
- **📤 One-Click Export** — PowerPoint, PDF, or shareable web links
- **🔒 Enterprise Security** — Row-level isolation, SOC 2 ready architecture

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Database** | PostgreSQL 16 + pgvector |
| **ORM** | Prisma |
| **Auth** | NextAuth.js v5 |
| **Queue** | BullMQ + Redis |
| **AI/LLM** | Anthropic Claude 3.5 Sonnet |
| **Embeddings** | OpenAI text-embedding-3-small |
| **Styling** | Tailwind CSS |
| **State** | Zustand |
| **Export** | pptxgenjs, Puppeteer |

---

## Getting Started

### Prerequisites

- **Node.js** 20.x LTS
- **PostgreSQL** 16+ with pgvector extension
- **Redis** 7+
- **pnpm** (recommended) or npm

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/deeldesk.git
cd deeldesk
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/deeldesk?schema=public"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# OAuth Providers (optional for dev)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI Services
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Redis
REDIS_URL="redis://localhost:6379"

# File Storage (S3-compatible)
S3_BUCKET="deeldesk-dev"
S3_REGION="us-east-1"
S3_ENDPOINT="http://localhost:9000"  # For MinIO local dev
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

### 4. Set Up PostgreSQL with pgvector

```bash
# Create database
createdb deeldesk

# Enable pgvector extension
psql -d deeldesk -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Or use Docker:

```bash
docker run -d \
  --name deeldesk-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=deeldesk \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### 5. Set Up Redis

```bash
# Using Docker
docker run -d --name deeldesk-redis -p 6379:6379 redis:7-alpine

# Or install locally (macOS)
brew install redis
brew services start redis
```

### 6. Initialize Database

```bash
# Push schema to database
pnpm db:push

# Generate Prisma client
pnpm db:generate

# (Optional) Seed with sample data
pnpm db:seed
```

### 7. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
deeldesk/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/         # Protected routes
│   │   ├── opportunities/   # Opportunity management
│   │   ├── proposals/       # Proposal editor/viewer
│   │   ├── knowledge/       # Knowledge base
│   │   └── settings/        # Settings
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth endpoints
│   │   ├── opportunities/  # Opportunity CRUD
│   │   ├── proposals/      # Proposal generation
│   │   ├── knowledge/      # KB management
│   │   └── stream/         # SSE endpoints
│   ├── share/[id]/         # Public proposal viewer
│   ├── layout.tsx
│   └── page.tsx            # Landing page
│
├── components/
│   ├── ui/                  # Base components (shadcn/ui)
│   ├── proposals/           # Proposal components
│   ├── knowledge/           # KB components
│   ├── opportunities/       # Opportunity components
│   └── shared/              # Shared components
│
├── lib/
│   ├── ai/                  # AI/LLM integration
│   │   ├── anthropic.ts    # Claude client
│   │   ├── embeddings.ts   # Vector embeddings
│   │   ├── context.ts      # Context Assembly Engine
│   │   └── prompts/        # System prompts
│   ├── db/                  # Database utilities
│   │   ├── prisma.ts       # Prisma client
│   │   └── queries/        # Query functions
│   ├── export/              # Export utilities
│   │   ├── pptx.ts         # PowerPoint generation
│   │   └── pdf.ts          # PDF generation
│   ├── pricing/             # Pricing engine
│   ├── auth.ts              # Auth configuration
│   └── utils/               # General utilities
│
├── workers/
│   └── generation.ts        # BullMQ worker
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration history
│
├── types/                   # TypeScript definitions
├── stores/                  # Zustand stores
├── hooks/                   # Custom React hooks
├── tests/                   # Test files
│
├── docs/                    # Documentation
│   ├── Deeldesk_PRD_v4_0.docx
│   └── docs/planning/IMPLEMENTATION_PLAN.md
│
├── CLAUDE.md               # Claude Code context
├── docs/architecture/DATABASE_SCHEMA.sql     # Full schema reference
├── docker-compose.yml      # Local dev services
└── package.json
```

---

## Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start dev server (port 3000)
pnpm dev:worker             # Start BullMQ worker

# Database
pnpm db:push                # Push schema changes (dev)
pnpm db:migrate             # Run migrations (prod)
pnpm db:generate            # Generate Prisma client
pnpm db:studio              # Open Prisma Studio
pnpm db:seed                # Seed sample data
pnpm db:reset               # Reset database (DESTRUCTIVE)

# Testing
pnpm test                   # Run unit tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report
pnpm test:e2e               # E2E tests (Playwright)

# Code Quality
pnpm lint                   # ESLint
pnpm lint:fix               # ESLint with auto-fix
pnpm typecheck              # TypeScript compiler
pnpm format                 # Prettier format
pnpm format:check           # Prettier check

# Building
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm analyze                # Bundle analyzer
```

### Docker Compose (Recommended for Local Dev)

Start all services with Docker:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL 16 with pgvector (port 5432)
- Redis 7 (port 6379)
- MinIO for S3-compatible storage (port 9000, console 9001)

### Running the Worker

Proposal generation runs asynchronously via BullMQ. Start the worker in a separate terminal:

```bash
pnpm dev:worker
```

---

## Architecture Overview

### Data Model (Opportunity-Centric)

```
Organization
    └── User(s)
         └── Opportunity(ies)
              ├── Proposal(s)
              ├── DealContextItem(s)
              └── StrategyRecord(s)
```

All proposals are children of Opportunities, reflecting how deals have multiple iterations.

### Proposal Generation Flow

```
1. User submits prompt
       ↓
2. API creates job, returns 202 + job_id
       ↓
3. BullMQ worker picks up job
       ↓
4. Context Assembly Engine retrieves relevant context
       ↓
5. LLM generates slide content (streamed via SSE)
       ↓
6. Pricing Engine calculates quotes
       ↓
7. Strategy Extraction captures PPS decisions
       ↓
8. Client receives completed proposal
```

### Context Assembly Engine

Dynamically assembles context for each generation. See [docs/architecture/CONTEXT_ASSEMBLY.md](./docs/architecture/CONTEXT_ASSEMBLY.md) for complete documentation.

**Always-Included Context (Foundational):**

| Source | Budget | Content |
|--------|--------|---------|
| Business Model | ~500 tokens | Organization's business model summary |
| Brand Context | ~200 tokens | Voice, tone, colors, guidelines |

**RAG-Retrieved Context (Token-Budgeted):**

| Source | Allocation | Truncation Priority | Content |
|--------|------------|---------------------|---------|
| Deal Context | 40% | 1 (last) | Opportunity-specific info, stakeholders, requirements |
| Products | 30% | 2 | Relevant product catalog entries |
| Competitive | 20% | 3 | Battlecards for mentioned competitors |
| Playbooks | 10% | 4 (first) | Relevant sales playbooks, objection handling |

The Business Model Summary and Brand Context provide foundational company-level context that informs all proposal generations, ensuring consistent positioning and messaging. These are never truncated. When context exceeds limits, RAG-retrieved content is truncated by priority (Playbooks first, Deal Context last).

---

## API Reference

### Opportunities

```
GET    /api/opportunities           # List user's opportunities
POST   /api/opportunities           # Create opportunity
GET    /api/opportunities/:id       # Get opportunity details
PATCH  /api/opportunities/:id       # Update opportunity
DELETE /api/opportunities/:id       # Delete opportunity
POST   /api/opportunities/:id/context   # Add deal context
```

### Proposals

```
POST   /api/opportunities/:id/proposals  # Start generation (returns job_id)
GET    /api/proposals/:id                # Get proposal
GET    /api/proposals/:id/export         # Export (PPTX/PDF)
POST   /api/proposals/:id/iterate        # Submit iteration
POST   /api/proposals/:id/share          # Create share link
GET    /api/stream/:jobId                # SSE progress stream
```

### Knowledge Base

```
GET    /api/knowledge/products      # List products
POST   /api/knowledge/products      # Add product
GET    /api/knowledge/battlecards   # List battlecards
POST   /api/knowledge/battlecards   # Add battlecard
POST   /api/knowledge/query         # Natural language query
GET    /api/knowledge/business-model # Get organization business model summary
POST   /api/knowledge/business-model/generate  # Generate business model with AI
PUT    /api/knowledge/business-model # Update business model summary
```

---

## Configuration

### Plan Tiers

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| Proposals/month | 5 | ∞ | ∞ | ∞ |
| KB items | 50 | 500 | ∞ | ∞ |
| Competitors | 3 | 20 | ∞ | ∞ |
| Team workspaces | ❌ | ❌ | ✓ | ✓ |
| CRM integration | ❌ | ❌ | ✓ | ✓ |
| SSO/SCIM | ❌ | ❌ | ❌ | ✓ |
| BYOX | ❌ | ❌ | ❌ | ✓ |

### Safe Mode

Enable Safe Mode in settings to eliminate AI hallucinations:
- Uses `[VERIFY]` placeholders for uncertain content
- Prices show `[ENTER VALUE]` when not in context
- Competitive claims require battlecard source

---

## Testing

### Unit Tests

```bash
pnpm test
```

Tests use Vitest with mocked external services.

### E2E Tests

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run Playwright tests
pnpm test:e2e
```

### Manual Testing

1. Open Prisma Studio: `pnpm db:studio`
2. Use the seed script for sample data: `pnpm db:seed`

---

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis configured with persistence
- [ ] S3 bucket created with CORS policy
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Error tracking (Sentry) configured
- [ ] Monitoring and alerting set up

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Configure environment variables in Vercel dashboard.

### Docker Deployment

```bash
docker build -t deeldesk .
docker run -p 3000:3000 --env-file .env.production deeldesk
```

---

## Contributing

1. Create a feature branch from `main`
2. Make changes following the coding conventions in `CLAUDE.md`
3. Write tests for new functionality
4. Ensure all tests pass: `pnpm test`
5. Ensure linting passes: `pnpm lint`
6. Submit a pull request

### Commit Convention

```
feat: add proposal export to PDF
fix: correct pricing calculation for bundles
docs: update API reference
refactor: simplify context assembly
test: add integration tests for proposals
chore: update dependencies
```

---

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** — Claude Code context and coding conventions
- **[docs/architecture/DATABASE_SCHEMA.sql](./docs/architecture/DATABASE_SCHEMA.sql)** — Full database schema
- **[PRD v4.0](./docs/product/Deeldesk_PRD_v4_0.docx)** — Product requirements
- **[Implementation Plan](./docs/planning/IMPLEMENTATION_PLAN.md)** — Development timeline and execution plan

---

## Support

- **Issues**: GitHub Issues
- **Email**: support@deeldesk.ai

---

## License

Proprietary. All rights reserved.

---

Built with ❤️ by the Deeldesk team
