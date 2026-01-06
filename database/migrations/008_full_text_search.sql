-- ============================================================================
-- Task 8 Subtask 1: Full-Text Search Implementation
-- Migration for adding PostgreSQL full-text search capabilities
-- ============================================================================

-- Add tsvector column to videos table for full-text search
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add tsvector column to saves table for full-text search
ALTER TABLE saves
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add tsvector column to transcriptions table for full-text search
ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add tsvector column to frames table for full-text search (on_screen_text)
ALTER TABLE frames
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN indexes for fast full-text search
CREATE INDEX IF NOT EXISTS idx_videos_search_vector
ON videos USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_saves_search_vector
ON saves USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_transcriptions_search_vector
ON transcriptions USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_frames_search_vector
ON frames USING gin(search_vector);

-- ============================================================================
-- Trigger Functions to Auto-Update Search Vectors
-- ============================================================================

-- Function to update videos search vector
-- Includes: title, description, channel_name
CREATE OR REPLACE FUNCTION videos_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.channel_name, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update saves search vector
-- Includes: title, notes
CREATE OR REPLACE FUNCTION saves_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update transcriptions search vector
-- Includes: full_text
CREATE OR REPLACE FUNCTION transcriptions_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.full_text, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update frames search vector
-- Includes: on_screen_text, scene_description
CREATE OR REPLACE FUNCTION frames_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.on_screen_text, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.scene_description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Apply Triggers
-- ============================================================================

-- Trigger for videos table
DROP TRIGGER IF EXISTS videos_search_vector_trigger ON videos;
CREATE TRIGGER videos_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description, channel_name
  ON videos
  FOR EACH ROW
  EXECUTE FUNCTION videos_search_vector_update();

-- Trigger for saves table
DROP TRIGGER IF EXISTS saves_search_vector_trigger ON saves;
CREATE TRIGGER saves_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, notes
  ON saves
  FOR EACH ROW
  EXECUTE FUNCTION saves_search_vector_update();

-- Trigger for transcriptions table
DROP TRIGGER IF EXISTS transcriptions_search_vector_trigger ON transcriptions;
CREATE TRIGGER transcriptions_search_vector_trigger
  BEFORE INSERT OR UPDATE OF full_text
  ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION transcriptions_search_vector_update();

-- Trigger for frames table
DROP TRIGGER IF EXISTS frames_search_vector_trigger ON frames;
CREATE TRIGGER frames_search_vector_trigger
  BEFORE INSERT OR UPDATE OF on_screen_text, scene_description
  ON frames
  FOR EACH ROW
  EXECUTE FUNCTION frames_search_vector_update();

-- ============================================================================
-- Update Existing Records
-- ============================================================================

-- Update search vectors for existing videos
UPDATE videos
SET search_vector =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(channel_name, '')), 'C')
WHERE search_vector IS NULL;

-- Update search vectors for existing saves
UPDATE saves
SET search_vector =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(notes, '')), 'B')
WHERE search_vector IS NULL;

-- Update search vectors for existing transcriptions
UPDATE transcriptions
SET search_vector =
  setweight(to_tsvector('english', COALESCE(full_text, '')), 'B')
WHERE search_vector IS NULL;

-- Update search vectors for existing frames
UPDATE frames
SET search_vector =
  setweight(to_tsvector('english', COALESCE(on_screen_text, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(scene_description, '')), 'C')
WHERE search_vector IS NULL;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN videos.search_vector IS 'Full-text search vector for video title, description, and channel name';
COMMENT ON COLUMN saves.search_vector IS 'Full-text search vector for save title and notes';
COMMENT ON COLUMN transcriptions.search_vector IS 'Full-text search vector for transcript full text';
COMMENT ON COLUMN frames.search_vector IS 'Full-text search vector for frame OCR text and scene description';

-- ============================================================================
-- Verification Queries (uncomment to test)
-- ============================================================================

-- Test search on videos
-- SELECT id, title, ts_rank(search_vector, query) AS rank
-- FROM videos, plainto_tsquery('english', 'tutorial') query
-- WHERE search_vector @@ query
-- ORDER BY rank DESC
-- LIMIT 10;

-- Test search on transcriptions with highlighting
-- SELECT
--   t.id,
--   v.title,
--   ts_headline('english', t.full_text, query, 'MaxWords=50, MinWords=25') AS headline
-- FROM transcriptions t
-- JOIN videos v ON t.video_id = v.id
-- CROSS JOIN plainto_tsquery('english', 'machine learning') query
-- WHERE t.search_vector @@ query
-- LIMIT 10;
