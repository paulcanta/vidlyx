# Vidlyx Database Quick Reference

## Quick Access

### Connect to Database
```bash
docker exec -it -e PGPASSWORD=timecloq_secure_password_2024 \
  timecloq-postgres-core \
  psql -U timecloq_admin -d vidlyx_dev
```

### Verify Schema
```bash
/home/pgc/vidlyx/database/verify-schema.sh
```

### Run Schema (if needed)
```bash
docker exec -i -e PGPASSWORD=timecloq_secure_password_2024 \
  timecloq-postgres-core \
  psql -U timecloq_admin -d vidlyx_dev < /home/pgc/vidlyx/database/schema.sql
```

## Connection Details

```env
DB_HOST=172.20.0.3
DB_PORT=5432
DB_NAME=vidlyx_dev
DB_USER=timecloq_admin
DB_PASSWORD=timecloq_secure_password_2024
```

## Database Stats

- **Tables:** 16
- **Indexes:** 58
- **Foreign Keys:** 19
- **Triggers:** 4
- **Extensions:** uuid-ossp, pg_trgm

## Tables Overview

### Core
- users
- sessions
- videos

### Analysis
- transcriptions
- frames
- sections
- video_summaries
- analysis_jobs

### User Content
- saves
- folders
- tags

### Relationships
- save_frames
- save_transcripts
- save_summaries
- save_folders
- save_tags

## Common Queries

### List all tables
```sql
\dt
```

### Describe a table
```sql
\d table_name
```

### Count records
```sql
SELECT COUNT(*) FROM table_name;
```

### View indexes
```sql
\di
```

## Files

- `schema.sql` - Complete database schema
- `DATABASE_INFO.md` - Detailed connection info
- `verify-schema.sh` - Verification script
- `IMPLEMENTATION_REPORT.md` - Full implementation details
- `QUICK_REFERENCE.md` - This file

## Support

For detailed information, see:
- Full docs: `/home/pgc/vidlyx/database/IMPLEMENTATION_REPORT.md`
- Connection info: `/home/pgc/vidlyx/database/DATABASE_INFO.md`
