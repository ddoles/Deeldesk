# Backup & Disaster Recovery Strategy

**Version:** 1.0
**Status:** MVP Specification
**Last Updated:** December 2025

---

## Overview

This document specifies the backup and disaster recovery (DR) strategy for Deeldesk.ai, ensuring data durability and business continuity.

---

## Recovery Objectives

| Metric | Target | Notes |
|--------|--------|-------|
| **RTO** (Recovery Time Objective) | 4 hours | Maximum acceptable downtime |
| **RPO** (Recovery Point Objective) | 1 hour | Maximum acceptable data loss |
| **MTTR** (Mean Time to Recovery) | 2 hours | Target average recovery time |

### By Plan Tier

| Tier | RTO | RPO | Backup Frequency |
|------|-----|-----|------------------|
| Free | 8 hours | 24 hours | Daily |
| Pro | 4 hours | 4 hours | Every 4 hours |
| Team | 2 hours | 1 hour | Hourly |
| Enterprise | 1 hour | 15 minutes | Continuous (PITR) |

---

## Backup Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Primary Region (us-east-1)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   PostgreSQL     │───▶│   WAL Archive    │                   │
│  │   Primary        │    │   (S3)           │                   │
│  └──────────────────┘    └──────────────────┘                   │
│           │                       │                              │
│           │ Streaming             │                              │
│           │ Replication           │                              │
│           ▼                       │                              │
│  ┌──────────────────┐            │                              │
│  │   PostgreSQL     │            │                              │
│  │   Read Replica   │            │                              │
│  └──────────────────┘            │                              │
│                                   │                              │
│  ┌──────────────────┐            │                              │
│  │     Redis        │            │                              │
│  │   (BullMQ)       │            │                              │
│  └──────────────────┘            │                              │
│           │                       │                              │
│           │ RDB Snapshots         │                              │
│           ▼                       ▼                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    S3 Backup Bucket                         │ │
│  │                    (Cross-region replication)               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                   │                              │
└───────────────────────────────────│──────────────────────────────┘
                                    │
                                    │ Cross-Region Replication
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DR Region (us-west-2)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    S3 Backup Bucket                         │ │
│  │                    (Replica)                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────┐    (Standby - activated on failover)      │
│  │   PostgreSQL     │                                           │
│  │   Standby        │                                           │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Backups (PostgreSQL)

### Backup Types

#### 1. Continuous WAL Archiving (PITR)

Write-Ahead Log archiving enables point-in-time recovery.

**Configuration:**
```sql
-- postgresql.conf
archive_mode = on
archive_command = 'aws s3 cp %p s3://deeldesk-backups/wal/%f'
archive_timeout = 60  -- Archive every 60 seconds minimum
```

**Retention:**
- WAL files: 7 days
- Enables recovery to any point within 7 days

#### 2. Base Backups (Full Snapshots)

**Schedule:**
| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Full backup | Daily at 02:00 UTC | 30 days |
| Weekly backup | Sunday 02:00 UTC | 90 days |
| Monthly backup | 1st of month | 1 year |

**Backup Script:**
```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="deeldesk_full_${TIMESTAMP}"
S3_BUCKET="deeldesk-backups"

# Create backup
pg_basebackup \
  -h $DB_HOST \
  -U $DB_USER \
  -D /tmp/${BACKUP_NAME} \
  -Ft \
  -z \
  -P

# Upload to S3
aws s3 cp /tmp/${BACKUP_NAME}.tar.gz \
  s3://${S3_BUCKET}/full/${BACKUP_NAME}.tar.gz \
  --storage-class STANDARD_IA

# Cleanup
rm -rf /tmp/${BACKUP_NAME}*

# Verify backup
aws s3 ls s3://${S3_BUCKET}/full/${BACKUP_NAME}.tar.gz

echo "Backup completed: ${BACKUP_NAME}"
```

#### 3. Logical Backups (pg_dump)

For schema migrations and selective restores.

**Schedule:** Daily at 03:00 UTC

```bash
#!/bin/bash
# scripts/backup-logical.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d deeldesk \
  -Fc \
  -f /tmp/deeldesk_logical_${TIMESTAMP}.dump

aws s3 cp /tmp/deeldesk_logical_${TIMESTAMP}.dump \
  s3://deeldesk-backups/logical/
```

### Backup Verification

**Daily verification job:**
```bash
#!/bin/bash
# scripts/verify-backup.sh

# Download latest backup
LATEST=$(aws s3 ls s3://deeldesk-backups/full/ | tail -1 | awk '{print $4}')
aws s3 cp s3://deeldesk-backups/full/${LATEST} /tmp/verify/

# Restore to test database
pg_restore -d deeldesk_verify /tmp/verify/${LATEST}

# Run integrity checks
psql -d deeldesk_verify -c "SELECT COUNT(*) FROM organizations;"
psql -d deeldesk_verify -c "SELECT COUNT(*) FROM proposals;"

# Validate row counts match production (within tolerance)
# Alert if >1% difference

# Cleanup
dropdb deeldesk_verify
rm -rf /tmp/verify/
```

---

## Redis Backups

### RDB Snapshots

**Configuration:**
```
# redis.conf
save 900 1      # Save after 900 sec if at least 1 key changed
save 300 10     # Save after 300 sec if at least 10 keys changed
save 60 10000   # Save after 60 sec if at least 10000 keys changed

dir /var/lib/redis
dbfilename dump.rdb
```

**S3 Upload:**
```bash
#!/bin/bash
# Runs hourly via cron

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp /var/lib/redis/dump.rdb /tmp/redis_${TIMESTAMP}.rdb
aws s3 cp /tmp/redis_${TIMESTAMP}.rdb s3://deeldesk-backups/redis/
rm /tmp/redis_${TIMESTAMP}.rdb
```

**Note:** Redis data (BullMQ jobs) is transient. Jobs can be regenerated from database state. Redis backup is for faster recovery, not critical data protection.

---

## File Storage Backups (S3)

### Primary Bucket Configuration

```
deeldesk-uploads/
├── proposals/          # Generated PPTX/PDF files
├── knowledge/          # Uploaded documents
├── exports/            # User exports
└── logos/              # Organization logos
```

### Replication

**Cross-region replication for durability:**
```json
{
  "Rules": [
    {
      "Status": "Enabled",
      "Priority": 1,
      "DeleteMarkerReplication": { "Status": "Enabled" },
      "Filter": {},
      "Destination": {
        "Bucket": "arn:aws:s3:::deeldesk-uploads-dr",
        "StorageClass": "STANDARD_IA"
      }
    }
  ]
}
```

### Versioning

S3 versioning enabled for accidental deletion protection:
- Versions retained: 30 days
- Delete markers: 7 days

---

## Disaster Recovery Procedures

### Scenario 1: Database Corruption

**Detection:** Integrity check failure or application errors

**Recovery Steps:**
1. Identify corruption timestamp from logs
2. Stop application writes (maintenance mode)
3. Restore from PITR to pre-corruption point
4. Verify data integrity
5. Resume operations

**Estimated Recovery Time:** 1-2 hours

### Scenario 2: Accidental Data Deletion

**Detection:** User report or monitoring alert

**Recovery Steps:**
1. Identify affected records and deletion time
2. Restore specific tables from logical backup, OR
3. Use PITR for point-in-time recovery
4. Merge restored data with current state

**Estimated Recovery Time:** 30 minutes - 2 hours

### Scenario 3: Complete Region Failure

**Detection:** AWS health dashboard or monitoring

**Recovery Steps:**
1. Activate DR region infrastructure
2. Restore database from S3 backups in DR region
3. Update DNS to point to DR region
4. Verify application functionality
5. Communicate status to users

**Estimated Recovery Time:** 2-4 hours

### Scenario 4: Ransomware/Security Breach

**Detection:** Security monitoring or user reports

**Recovery Steps:**
1. Isolate affected systems
2. Identify breach timeline
3. Restore from backup predating breach
4. Rotate all credentials
5. Security audit before resuming

**Estimated Recovery Time:** 4-8 hours

---

## Recovery Runbooks

### Database Point-in-Time Recovery

```bash
#!/bin/bash
# runbooks/pitr-recovery.sh

# 1. Stop application
kubectl scale deployment deeldesk-api --replicas=0

# 2. Create recovery PostgreSQL instance
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier deeldesk-prod \
  --target-db-instance-identifier deeldesk-recovery \
  --restore-time "2025-01-15T10:30:00Z"

# 3. Wait for instance availability
aws rds wait db-instance-available \
  --db-instance-identifier deeldesk-recovery

# 4. Update application config to use recovery instance
# (Manual step - update DATABASE_URL)

# 5. Verify data
psql -h $RECOVERY_HOST -d deeldesk -c "SELECT MAX(created_at) FROM proposals;"

# 6. Restart application
kubectl scale deployment deeldesk-api --replicas=3

# 7. Monitor for issues
```

### Full Database Restore

```bash
#!/bin/bash
# runbooks/full-restore.sh

# 1. Download latest backup
LATEST=$(aws s3 ls s3://deeldesk-backups/full/ | tail -1 | awk '{print $4}')
aws s3 cp s3://deeldesk-backups/full/${LATEST} /tmp/restore/

# 2. Extract backup
tar -xzf /tmp/restore/${LATEST}

# 3. Stop PostgreSQL
systemctl stop postgresql

# 4. Replace data directory
rm -rf /var/lib/postgresql/16/main/*
mv /tmp/restore/base/* /var/lib/postgresql/16/main/

# 5. Configure recovery
cat > /var/lib/postgresql/16/main/recovery.signal << EOF
# Recovery configuration
EOF

cat >> /var/lib/postgresql/16/main/postgresql.auto.conf << EOF
restore_command = 'aws s3 cp s3://deeldesk-backups/wal/%f %p'
recovery_target_time = '2025-01-15 10:30:00 UTC'
EOF

# 6. Start PostgreSQL
systemctl start postgresql

# 7. Wait for recovery to complete
while [ -f /var/lib/postgresql/16/main/recovery.signal ]; do
  sleep 10
done

echo "Recovery complete"
```

---

## Backup Monitoring

### Metrics to Track

| Metric | Alert Threshold |
|--------|-----------------|
| Backup job failure | Any failure |
| Backup age | >25 hours (daily) |
| Backup size anomaly | >20% change |
| WAL archive lag | >5 minutes |
| Verification failure | Any failure |

### Alerting

```yaml
# alerts/backup-alerts.yaml
groups:
  - name: backup-alerts
    rules:
      - alert: BackupJobFailed
        expr: backup_job_last_success_timestamp < (time() - 86400)
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "Database backup has not succeeded in 24 hours"

      - alert: WALArchiveLag
        expr: pg_wal_archive_lag_seconds > 300
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "WAL archiving is lagging by more than 5 minutes"
```

---

## Retention Policy

| Data Type | Retention | Storage Class |
|-----------|-----------|---------------|
| Daily full backups | 30 days | S3 Standard-IA |
| Weekly full backups | 90 days | S3 Standard-IA |
| Monthly full backups | 1 year | S3 Glacier |
| WAL archives | 7 days | S3 Standard |
| Logical backups | 30 days | S3 Standard-IA |
| Redis snapshots | 7 days | S3 Standard |

### Lifecycle Policies

```json
{
  "Rules": [
    {
      "ID": "TransitionToIA",
      "Status": "Enabled",
      "Filter": { "Prefix": "full/" },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        }
      ]
    },
    {
      "ID": "TransitionToGlacier",
      "Status": "Enabled",
      "Filter": { "Prefix": "monthly/" },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "ID": "ExpireOldBackups",
      "Status": "Enabled",
      "Filter": { "Prefix": "full/" },
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

---

## Testing Schedule

| Test Type | Frequency | Owner |
|-----------|-----------|-------|
| Backup verification | Daily (automated) | DevOps |
| Table restore drill | Weekly | DevOps |
| Full recovery drill | Monthly | DevOps + Eng |
| DR failover drill | Quarterly | All Teams |

### Recovery Drill Checklist

- [ ] Notify stakeholders of drill
- [ ] Document start time
- [ ] Execute recovery runbook
- [ ] Verify data integrity
- [ ] Verify application functionality
- [ ] Document end time and issues
- [ ] Update runbook if needed
- [ ] Report results to stakeholders

---

## Compliance Considerations

### SOC 2

- Daily backup verification logs retained for audit
- Access to backups logged and reviewed
- Encryption at rest (S3 SSE-S3) and in transit (TLS)
- Backup retention meets data retention requirements

### GDPR

- User deletion requests applied to backups within 30 days
- Backups encrypted to protect PII
- Cross-region replication only within compliant regions

---

## References

- [DATABASE_SCHEMA.sql](../architecture/DATABASE_SCHEMA.sql) — Database schema
- [MONITORING.md](./MONITORING.md) — Monitoring configuration
- [SECRETS_MANAGEMENT.md](../security/SECRETS_MANAGEMENT.md) — Credential management
