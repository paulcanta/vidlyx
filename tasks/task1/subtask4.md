# Task 1 - Subtask 4: Setup Database Schema

## Objective
Create the PostgreSQL database and implement the complete schema for Vidlyx.

## Prerequisites
- Task 1 - Subtask 3 completed (Backend server setup)
- PostgreSQL 14+ installed and running
- psql command available

## Instructions

### 1. Create Database
Create the development database:
```bash
createdb vidlyx_dev
```

### 2. Create Main Schema File
Create `/home/pgc/vidlyx/database/schema.sql` with all tables.

#### Core Tables to Create:

**Users Table:**
- id (UUID, primary key)
- email (unique, not null)
- password_hash
- first_name, last_name
- avatar_url
- role (default: 'user')
- status (pending, active, suspended)
- email_verified (boolean)
- last_login_at
- created_at, updated_at

**Sessions Table (for express-session):**
- sid (primary key)
- sess (JSON)
- expire (timestamp)

**Videos Table:**
- id (UUID, primary key)
- user_id (foreign key to users)
- youtube_id (unique per user)
- title, channel_name, duration
- thumbnail_url
- description
- analysis_status (pending, processing, completed, failed)
- last_accessed_at
- created_at, updated_at

**Transcriptions Table:**
- id (UUID, primary key)
- video_id (foreign key)
- full_text (TEXT)
- segments (JSONB) - timestamped segments array
- transcript_type (manual, auto)
- language
- created_at

**Frames Table:**
- id (UUID, primary key)
- video_id (foreign key)
- timestamp_seconds (DECIMAL)
- frame_path (file path)
- thumbnail_path
- on_screen_text (from OCR)
- scene_description (from vision AI)
- visual_elements (JSONB)
- is_keyframe (boolean)
- created_at

**Sections Table:**
- id (UUID, primary key)
- video_id (foreign key)
- title
- start_time, end_time
- summary (TEXT)
- key_points (JSONB array)
- section_order (integer)
- created_at

**Video Summaries Table:**
- id (UUID, primary key)
- video_id (foreign key, unique)
- full_summary (TEXT)
- key_takeaways (JSONB)
- topics (JSONB)
- created_at

**Folders Table (flat structure):**
- id (UUID, primary key)
- user_id (foreign key)
- name (not null)
- color (optional)
- icon (optional)
- sort_order
- created_at, updated_at

**Saves Table:**
- id (UUID, primary key)
- user_id (foreign key)
- video_id (foreign key)
- title
- auto_title
- notes (TEXT)
- created_at, updated_at

**Save Content Tables:**
- save_frames (save_id, frame_id)
- save_transcripts (save_id, start_time, end_time, text)
- save_summaries (save_id, section_id, excerpt)

**Save Folders (many-to-many):**
- save_id (foreign key)
- folder_id (foreign key)
- added_at

**Tags Table:**
- id (UUID, primary key)
- user_id (foreign key)
- name (unique per user)
- color

**Save Tags (many-to-many):**
- save_id, tag_id

**Analysis Jobs Table:**
- id (UUID, primary key)
- video_id (foreign key)
- job_type (transcription, frames, ocr, vision, correlation, summary)
- status (pending, processing, completed, failed)
- progress (0-100)
- error_message
- started_at, completed_at
- created_at

### 3. Create Indexes
Add indexes for performance:
- idx_videos_user_id
- idx_videos_youtube_id
- idx_transcriptions_video_id
- idx_frames_video_id
- idx_frames_timestamp
- idx_sections_video_id
- idx_saves_user_id
- idx_saves_video_id
- idx_folders_user_id
- idx_save_folders_save_id
- idx_save_folders_folder_id
- idx_sessions_expire

### 4. Create Full-Text Search Indexes
```sql
CREATE INDEX idx_transcriptions_fulltext ON transcriptions
  USING gin(to_tsvector('english', full_text));
CREATE INDEX idx_frames_onscreen_text ON frames
  USING gin(on_screen_text gin_trgm_ops);
```

### 5. Create Update Timestamp Trigger
Create a trigger function to auto-update `updated_at` columns.

### 6. Run Schema
Execute the schema:
```bash
psql -d vidlyx_dev -f /home/pgc/vidlyx/database/schema.sql
```

### 7. Update .env
Ensure your `.env` has correct database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vidlyx_dev
DB_USER=postgres
DB_PASSWORD=your_password
```

## Verification
Connect to database and verify tables:
```bash
psql -d vidlyx_dev -c "\dt"
```

You should see all tables listed. Test the connection from Node.js:
```bash
cd /home/pgc/vidlyx/server
node -e "const db = require('./src/services/db'); db.query('SELECT NOW()').then(r => console.log(r.rows[0])).catch(console.error).finally(() => process.exit())"
```

## Next Steps
Proceed to Task 1 - Subtask 5 (Setup React Frontend Project)

## Estimated Time
45 minutes

## Notes
- Enable uuid-ossp extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- Enable pg_trgm for text search: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- The schema supports flat folders (no nesting)
- Saves can belong to multiple folders (many-to-many)
