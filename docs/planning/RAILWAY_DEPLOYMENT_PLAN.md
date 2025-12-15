# Railway + Neon Deployment Plan

## Overview

Deploy Deeldesk MVP to Railway with existing Neon database.

| Service | Platform | Notes |
|---------|----------|-------|
| Next.js App | Railway | Main web application |
| BullMQ Worker | Railway | Background job processor |
| PostgreSQL + pgvector | Neon Cloud | Your existing database |
| Redis | Railway | For BullMQ job queue |

---

## Pre-Deployment Checklist

- [ ] Railway account with previous project access
- [ ] Neon database connection string
- [ ] API keys ready (Anthropic, OpenAI, AWS)
- [ ] GitHub repo collaborator added

---

## Step 1: Prepare Neon Database

### 1.1 Create New Database (or reuse existing)

If creating fresh database in Neon:
```sql
-- Connect to Neon and run:
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.2 Get Connection Strings

From Neon Dashboard → Connection Details:
- **DATABASE_URL**: `postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require`
- **DIRECT_URL**: Same as above (needed for Prisma migrations)

**Important**: Use the "pooled" connection string for `DATABASE_URL` if available.

---

## Step 2: Set Up Railway Project

### 2.1 Create New Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `ddoles/Deeldesk`

### 2.2 Add Redis Service

1. In your Railway project, click "+ New"
2. Select "Database" → "Redis"
3. Railway will provision Redis and provide `REDIS_URL`

### 2.3 Configure Web Service

Railway should auto-detect Next.js. Verify settings:

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Start Command | `npm run start` |
| Watch Patterns | Leave default |

### 2.4 Add Worker Service

1. Click "+ New" → "GitHub Repo" (same repo)
2. Rename service to "worker"
3. Configure:

| Setting | Value |
|---------|-------|
| Build Command | `npm install` |
| Start Command | `npm run worker` |

---

## Step 3: Configure Environment Variables

### 3.1 Shared Variables (Both Services)

In Railway → Project Settings → Shared Variables:

```env
# Database (from Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/deeldesk?sslmode=require
DIRECT_URL=postgresql://user:pass@ep-xxx.neon.tech/deeldesk?sslmode=require

# Redis (Railway provides this automatically, reference it)
REDIS_URL=${{Redis.REDIS_URL}}

# AI Services
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-proj-xxx

# AWS Bedrock (optional for enterprise)
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
BEDROCK_CLAUDE_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# Models
DEFAULT_LLM_MODEL=claude-sonnet-4-20250514
DEFAULT_EMBEDDING_MODEL=text-embedding-3-small

# App Settings
NODE_ENV=production
LOG_LEVEL=info
```

### 3.2 Web Service Only Variables

In Railway → Web Service → Variables:

```env
# Auth (Railway provides PORT and domain)
NEXTAUTH_URL=https://your-app.up.railway.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Optional: Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Step 4: Deploy Database Schema

### 4.1 Run Migrations

After first deploy, open Railway CLI or use the web terminal:

```bash
# In Railway shell for web service
npx prisma migrate deploy
```

Or locally with production DATABASE_URL:
```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 4.2 Seed Initial Data (Optional)

```bash
npx prisma db seed
```

---

## Step 5: Verify Deployment

### 5.1 Check Services

- [ ] Web service is running (green status)
- [ ] Worker service is running (green status)
- [ ] Redis is connected

### 5.2 Test Endpoints

```bash
# Health check
curl https://your-app.up.railway.app/api/health

# Auth check
curl https://your-app.up.railway.app/api/auth/session
```

### 5.3 Test Full Flow

1. Sign up / Sign in
2. Create an opportunity
3. Generate a proposal (tests worker + Redis + AI)

---

## Step 6: Add Developer Collaborator

### 6.1 GitHub Access

```
GitHub → Repo Settings → Collaborators → Add people → [developer email]
```

### 6.2 Railway Access

```
Railway → Project Settings → Members → Invite → [developer email]
```

### 6.3 Neon Access (if needed)

```
Neon → Project Settings → Members → Invite
```

---

## Environment Variable Reference

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `DATABASE_URL` | Yes | Neon | PostgreSQL connection (pooled) |
| `DIRECT_URL` | Yes | Neon | PostgreSQL connection (direct) |
| `REDIS_URL` | Yes | Railway | Redis for BullMQ |
| `NEXTAUTH_URL` | Yes | Railway domain | Full app URL |
| `NEXTAUTH_SECRET` | Yes | Generate | Auth encryption key |
| `ANTHROPIC_API_KEY` | Yes | Anthropic | Claude API access |
| `OPENAI_API_KEY` | Yes | OpenAI | Embeddings |
| `AWS_REGION` | No | AWS | Bedrock region |
| `AWS_ACCESS_KEY_ID` | No | AWS | Bedrock auth |
| `AWS_SECRET_ACCESS_KEY` | No | AWS | Bedrock auth |
| `NODE_ENV` | Yes | Set to `production` | Environment mode |

---

## Troubleshooting

### Worker not processing jobs
- Check Redis connection in worker logs
- Verify `REDIS_URL` is set correctly
- Check for queue name mismatch

### Database connection errors
- Verify pgvector extension is enabled
- Check SSL mode in connection string
- Use pooled connection for app, direct for migrations

### Auth redirects failing
- Verify `NEXTAUTH_URL` matches Railway domain exactly
- Check `NEXTAUTH_SECRET` is set

---

## Cost Estimate

| Service | Estimated Cost |
|---------|---------------|
| Railway (2 services) | ~$5-10/month |
| Neon (existing) | Free tier or current plan |
| Redis (Railway) | Included in Railway |
| **Total** | **~$5-10/month** |

---

## Next Steps After Deployment

1. [ ] Set up custom domain (optional)
2. [ ] Configure Google OAuth for production
3. [ ] Set up monitoring/alerting
4. [ ] Create staging environment (duplicate project)
