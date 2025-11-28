# Vidlyx Database Configuration

## Database Details

- **Database Name:** vidlyx_dev
- **Location:** Docker Container `timecloq-postgres-core`
- **PostgreSQL Version:** 15 (Alpine)
- **Container IP:** 172.20.0.3
- **Port:** 5432 (internal to Docker)

## Connection Credentials

- **Username:** timecloq_admin
- **Password:** timecloq_secure_password_2024
- **Database:** vidlyx_dev

## Connection String

```
postgresql://timecloq_admin:timecloq_secure_password_2024@172.20.0.3:5432/vidlyx_dev
```

## Environment Variables for .env

```env
DB_HOST=172.20.0.3
DB_PORT=5432
DB_NAME=vidlyx_dev
DB_USER=timecloq_admin
DB_PASSWORD=timecloq_secure_password_2024
```

## Accessing the Database

### From Host Machine (via Docker)

```bash
docker exec -it -e PGPASSWORD=timecloq_secure_password_2024 timecloq-postgres-core psql -U timecloq_admin -d vidlyx_dev
```

### From Application

Use the connection string or environment variables above in your application configuration.

## Schema Information

- **Schema File:** `/home/pgc/vidlyx/database/schema.sql`
- **Total Tables:** 16
- **Extensions Enabled:**
  - uuid-ossp (for UUID generation)
  - pg_trgm (for full-text search)

## Tables Created

1. users (5 indexes)
2. sessions (2 indexes)
3. videos (6 indexes)
4. transcriptions (3 indexes)
5. frames (5 indexes)
6. sections (4 indexes)
7. video_summaries (3 indexes)
8. folders (3 indexes)
9. saves (4 indexes)
10. save_frames (3 indexes)
11. save_transcripts (2 indexes)
12. save_summaries (3 indexes)
13. save_folders (3 indexes)
14. tags (4 indexes)
15. save_tags (3 indexes)
16. analysis_jobs (5 indexes)

## Triggers

The following tables have automatic `updated_at` timestamp triggers:
- users
- videos
- folders
- saves

## Notes

- All tables use UUID primary keys (generated via uuid-ossp extension)
- Full-text search is enabled on `transcriptions.full_text` and `frames.on_screen_text` using pg_trgm
- All foreign keys have CASCADE delete for proper cleanup
- The database is running in a shared Docker container with TimeCloq
