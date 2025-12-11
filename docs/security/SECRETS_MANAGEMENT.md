# Secrets Management

**Version:** 1.0
**Status:** MVP Specification
**Last Updated:** December 2025

---

## Overview

This document specifies how secrets and sensitive credentials are managed in Deeldesk.ai across development, staging, and production environments.

---

## Secret Categories

| Category | Examples | Sensitivity | Rotation Frequency |
|----------|----------|-------------|-------------------|
| **API Keys** | Anthropic, OpenAI keys | High | 90 days |
| **Database Credentials** | PostgreSQL passwords | Critical | 30 days |
| **Auth Secrets** | NextAuth secret, JWT keys | Critical | 90 days |
| **OAuth Credentials** | Google client secret | High | Annual |
| **Infrastructure** | AWS access keys | Critical | 30 days |
| **Encryption Keys** | Data encryption keys | Critical | Annual |

---

## Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                            │
│                   (Next.js, BullMQ Worker)                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                    SDK / IAM Role
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AWS Secrets Manager                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  deeldesk/prod/database                                   │   │
│  │  deeldesk/prod/api-keys                                   │   │
│  │  deeldesk/prod/auth                                       │   │
│  │  deeldesk/prod/oauth                                      │   │
│  │  deeldesk/prod/encryption                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                    Automatic Rotation
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AWS Lambda (Rotation)                          │
│               + CloudWatch Events (Schedule)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Development Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                   Local Development                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  .env.local (gitignored)                                        │
│  ├── DATABASE_URL=postgresql://localhost/deeldesk_dev           │
│  ├── ANTHROPIC_API_KEY=sk-ant-dev-...                           │
│  └── NEXTAUTH_SECRET=local-dev-secret                           │
│                                                                  │
│  .env.example (committed, no real values)                       │
│  ├── DATABASE_URL=postgresql://user:pass@host/db                │
│  ├── ANTHROPIC_API_KEY=sk-ant-...                               │
│  └── NEXTAUTH_SECRET=your-secret-here                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AWS Secrets Manager Configuration

### Secret Structure

```json
// deeldesk/prod/database
{
  "host": "deeldesk-prod.xxxx.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "database": "deeldesk",
  "username": "deeldesk_app",
  "password": "ROTATED_PASSWORD",
  "ssl": true
}

// deeldesk/prod/api-keys
{
  "anthropic_api_key": "sk-ant-api...",
  "openai_api_key": "sk-...",
  "tavily_api_key": "tvly-..."
}

// deeldesk/prod/auth
{
  "nextauth_secret": "32_CHAR_RANDOM_STRING",
  "jwt_secret": "32_CHAR_RANDOM_STRING"
}

// deeldesk/prod/oauth
{
  "google_client_id": "xxxx.apps.googleusercontent.com",
  "google_client_secret": "GOCSPX-..."
}
```

### Secret Retrieval

```typescript
// lib/secrets.ts

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

// Cache secrets in memory (refreshed periodically)
const secretCache = new Map<string, { value: any; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getSecret<T>(secretName: string): Promise<T> {
  const cached = secretCache.get(secretName);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const command = new GetSecretValueCommand({
    SecretId: `deeldesk/${process.env.NODE_ENV}/${secretName}`,
  });

  const response = await client.send(command);
  const value = JSON.parse(response.SecretString!);

  secretCache.set(secretName, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return value as T;
}

// Usage
const dbConfig = await getSecret<DatabaseConfig>('database');
const apiKeys = await getSecret<ApiKeys>('api-keys');
```

### IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:deeldesk/prod/*"
      ]
    }
  ]
}
```

---

## Secret Rotation

### Database Password Rotation

**Frequency:** Every 30 days

**Lambda Rotation Function:**
```python
# lambda/rotate-db-password.py

import boto3
import psycopg2
import secrets

def lambda_handler(event, context):
    secret_id = event['SecretId']
    step = event['Step']

    secrets_client = boto3.client('secretsmanager')

    if step == 'createSecret':
        # Generate new password
        new_password = secrets.token_urlsafe(32)
        pending_secret = get_secret(secret_id, 'AWSCURRENT')
        pending_secret['password'] = new_password

        secrets_client.put_secret_value(
            SecretId=secret_id,
            ClientRequestToken=event['ClientRequestToken'],
            SecretString=json.dumps(pending_secret),
            VersionStages=['AWSPENDING']
        )

    elif step == 'setSecret':
        # Update password in database
        current = get_secret(secret_id, 'AWSCURRENT')
        pending = get_secret(secret_id, 'AWSPENDING')

        conn = psycopg2.connect(
            host=current['host'],
            user='admin',  # Admin user for rotation
            password=admin_password,
            database=current['database']
        )
        cur = conn.cursor()
        cur.execute(
            f"ALTER USER {current['username']} PASSWORD %s",
            (pending['password'],)
        )
        conn.commit()

    elif step == 'testSecret':
        # Verify new password works
        pending = get_secret(secret_id, 'AWSPENDING')
        conn = psycopg2.connect(
            host=pending['host'],
            user=pending['username'],
            password=pending['password'],
            database=pending['database']
        )
        conn.close()

    elif step == 'finishSecret':
        # Promote pending to current
        secrets_client.update_secret_version_stage(
            SecretId=secret_id,
            VersionStage='AWSCURRENT',
            MoveToVersionId=event['ClientRequestToken'],
            RemoveFromVersionId=get_current_version(secret_id)
        )
```

### API Key Rotation

**Frequency:** Every 90 days

**Process:**
1. Generate new API key from provider (Anthropic, OpenAI)
2. Update secret in Secrets Manager
3. Application picks up new key on next cache refresh
4. Revoke old key after 24-hour grace period

**Manual Rotation Script:**
```bash
#!/bin/bash
# scripts/rotate-api-key.sh

PROVIDER=$1
NEW_KEY=$2

# Update secret
aws secretsmanager update-secret \
  --secret-id deeldesk/prod/api-keys \
  --secret-string "{\"${PROVIDER}_api_key\": \"${NEW_KEY}\"}"

echo "Secret updated. New key will be picked up within 5 minutes."
echo "Remember to revoke the old key after verifying the new one works."
```

---

## Local Development

### Setup

```bash
# 1. Copy example env file
cp .env.example .env.local

# 2. Get development API keys (limited quota)
# Request from team lead or generate personal keys

# 3. Set up local database
docker-compose up -d postgres

# 4. Populate .env.local with actual values
```

### .env.local Template

```env
# Database (local Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/deeldesk_dev"

# Auth (use different secret for dev)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-only-secret-do-not-use-in-prod"

# AI Services (development keys with lower limits)
ANTHROPIC_API_KEY="sk-ant-api..."
OPENAI_API_KEY="sk-..."

# Redis (local Docker)
REDIS_URL="redis://localhost:6379"

# Optional: AWS for S3 (can use MinIO locally)
S3_ENDPOINT="http://localhost:9000"
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="minioadmin"
```

### Never Commit Secrets

**.gitignore:**
```gitignore
# Environment files with secrets
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
```

**Pre-commit Hook:**
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for potential secrets
if git diff --cached --name-only | xargs grep -l -E '(sk-ant-|sk-|AKIA|password\s*=)' 2>/dev/null; then
  echo "ERROR: Potential secret detected in commit"
  exit 1
fi
```

---

## CI/CD Secrets

### GitHub Actions

**Repository Secrets:**
- `AWS_ACCESS_KEY_ID` — For AWS deployments
- `AWS_SECRET_ACCESS_KEY` — For AWS deployments
- `VERCEL_TOKEN` — For Vercel deployments (if used)

**Usage in Workflow:**
```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy
        run: |
          # Secrets fetched from AWS Secrets Manager at runtime
          # Never pass secrets as environment variables to containers
```

### Vercel (if used)

**Environment Variables:**
- Set in Vercel dashboard (encrypted at rest)
- Different values per environment (Preview, Production)
- Never expose in client-side code

---

## Access Control

### Secret Access Matrix

| Role | Development | Staging | Production |
|------|-------------|---------|------------|
| Developer | Read | Read | No Access |
| Senior Engineer | Read/Write | Read/Write | Read |
| DevOps | Read/Write | Read/Write | Read/Write |
| Engineering Lead | Read/Write | Read/Write | Read/Write |

### Audit Logging

All secret access is logged:

```json
{
  "eventTime": "2025-01-15T10:30:00Z",
  "eventSource": "secretsmanager.amazonaws.com",
  "eventName": "GetSecretValue",
  "userIdentity": {
    "type": "AssumedRole",
    "arn": "arn:aws:sts::ACCOUNT_ID:assumed-role/deeldesk-app-role/..."
  },
  "requestParameters": {
    "secretId": "deeldesk/prod/api-keys"
  }
}
```

**CloudTrail Query:**
```sql
SELECT eventTime, userIdentity.arn, requestParameters.secretId
FROM cloudtrail_logs
WHERE eventSource = 'secretsmanager.amazonaws.com'
  AND eventName = 'GetSecretValue'
ORDER BY eventTime DESC
```

---

## Emergency Procedures

### Compromised Secret Response

1. **Immediate:** Rotate the compromised secret
2. **Assess:** Determine exposure scope and duration
3. **Revoke:** Invalidate old credentials
4. **Audit:** Review access logs for unauthorized use
5. **Notify:** Alert affected parties if data breach
6. **Document:** Post-incident report

### Emergency Rotation Script

```bash
#!/bin/bash
# scripts/emergency-rotate.sh

SECRET_TYPE=$1

case $SECRET_TYPE in
  "database")
    echo "Rotating database credentials..."
    aws secretsmanager rotate-secret \
      --secret-id deeldesk/prod/database \
      --rotation-lambda-arn arn:aws:lambda:us-east-1:ACCOUNT_ID:function:rotate-db-password
    ;;

  "anthropic")
    echo "Anthropic key must be manually rotated:"
    echo "1. Go to console.anthropic.com"
    echo "2. Generate new API key"
    echo "3. Run: ./scripts/rotate-api-key.sh anthropic NEW_KEY"
    echo "4. Delete old key in Anthropic console"
    ;;

  "nextauth")
    NEW_SECRET=$(openssl rand -base64 32)
    aws secretsmanager update-secret \
      --secret-id deeldesk/prod/auth \
      --secret-string "{\"nextauth_secret\": \"${NEW_SECRET}\"}"
    echo "NextAuth secret rotated. Restart application to pick up new secret."
    echo "Note: All existing sessions will be invalidated."
    ;;

  *)
    echo "Unknown secret type: $SECRET_TYPE"
    exit 1
    ;;
esac
```

---

## Encryption

### At Rest

- **AWS Secrets Manager:** AES-256 encryption via AWS KMS
- **Database:** RDS encryption enabled (AES-256)
- **S3:** SSE-S3 encryption enabled

### In Transit

- **Application ↔ Secrets Manager:** TLS 1.2+
- **Application ↔ Database:** SSL required
- **Application ↔ Redis:** TLS enabled

### Application-Level Encryption

For sensitive user data (not covered by infrastructure encryption):

```typescript
// lib/encryption.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = await getSecret<{ key: string }>('encryption').then(s =>
  Buffer.from(s.key, 'base64')
);

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const [ivB64, authTagB64, encrypted] = ciphertext.split(':');

  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

---

## Compliance

### SOC 2 Requirements

- [ ] Secrets encrypted at rest and in transit
- [ ] Access logged and auditable
- [ ] Rotation policy documented and enforced
- [ ] Least privilege access model
- [ ] Emergency rotation procedures tested

### GDPR Considerations

- Encryption keys for PII separate from other secrets
- Key deletion procedures for data subject requests
- Audit trail for key access

---

## Checklist

### New Secret Onboarding

- [ ] Create secret in AWS Secrets Manager
- [ ] Configure IAM permissions
- [ ] Add to application retrieval code
- [ ] Set up rotation (if applicable)
- [ ] Document in this file
- [ ] Add to .env.example (without real value)

### Secret Rotation

- [ ] Generate new credential
- [ ] Update in Secrets Manager
- [ ] Verify application picks up new value
- [ ] Revoke old credential
- [ ] Update rotation timestamp in tracking

---

## References

- [AWS Secrets Manager Docs](https://docs.aws.amazon.com/secretsmanager/)
- [BACKUP_STRATEGY.md](../operations/BACKUP_STRATEGY.md) — Backup procedures
- [MONITORING.md](../operations/MONITORING.md) — Access monitoring
