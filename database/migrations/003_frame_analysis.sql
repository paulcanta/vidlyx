-- Migration 003: Frame Analysis System
-- Adds frame analysis, video type detection, and frame-transcript linking

-- ============================================================================
-- VIDEO TYPE DETECTION
-- ============================================================================

-- Add video type detection columns to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS detected_type VARCHAR(30);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS type_confidence DECIMAL(3,2);

COMMENT ON COLUMN videos.detected_type IS 'Auto-detected video type (educational, tutorial, review, etc.)';
COMMENT ON COLUMN videos.type_confidence IS 'Confidence score for type detection (0.00-1.00)';

-- ============================================================================
-- KEY POINTS ENHANCEMENT
-- ============================================================================

-- Add category to key_points if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'key_points') THEN
    ALTER TABLE key_points ADD COLUMN IF NOT EXISTS category VARCHAR(20);
    COMMENT ON COLUMN key_points.category IS 'Category: insight, fact, quote, action, warning, tip, concept, etc.';
  END IF;
END $$;

-- ============================================================================
-- SECTIONS ENHANCEMENT
-- ============================================================================

-- Add importance rating to sections
ALTER TABLE sections ADD COLUMN IF NOT EXISTS importance INTEGER DEFAULT 3;
COMMENT ON COLUMN sections.importance IS 'Section importance rating (1-5, where 5 is most important)';

-- Create index for quick key section lookups
CREATE INDEX IF NOT EXISTS idx_sections_importance ON sections(video_id, importance) WHERE importance >= 4;

-- ============================================================================
-- FRAME ANALYSIS STORAGE
-- ============================================================================

-- Frame analysis results table
CREATE TABLE IF NOT EXISTS frame_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frame_id UUID REFERENCES frames(id) ON DELETE CASCADE,
  ocr_text TEXT,
  user_description TEXT,
  ai_analysis JSONB,
  provider VARCHAR(20) DEFAULT 'manual',
  confidence DECIMAL(3,2),
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE frame_analysis IS 'Stores analysis results for captured frames';
COMMENT ON COLUMN frame_analysis.provider IS 'Analysis provider: manual, gemini, anthropic';
COMMENT ON COLUMN frame_analysis.ai_analysis IS 'JSON structure containing AI analysis results';
COMMENT ON COLUMN frame_analysis.confidence IS 'Analysis confidence score (0.00-1.00)';

-- Indexes for frame_analysis
CREATE INDEX IF NOT EXISTS idx_frame_analysis_frame_id ON frame_analysis(frame_id);
CREATE INDEX IF NOT EXISTS idx_frame_analysis_provider ON frame_analysis(provider);

-- ============================================================================
-- FRAME-TRANSCRIPT LINKING
-- ============================================================================

-- Frame to transcript segment links
CREATE TABLE IF NOT EXISTS frame_transcript_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frame_id UUID REFERENCES frames(id) ON DELETE CASCADE,
  transcript_segment_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,2),
  link_type VARCHAR(20) DEFAULT 'temporal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(frame_id, transcript_segment_id)
);

COMMENT ON TABLE frame_transcript_links IS 'Links frames to related transcript segments';
COMMENT ON COLUMN frame_transcript_links.relevance_score IS 'Relevance score (0.00-1.00) based on temporal proximity';
COMMENT ON COLUMN frame_transcript_links.link_type IS 'Link type: temporal, semantic, manual';

-- Indexes for frame_transcript_links
CREATE INDEX IF NOT EXISTS idx_frame_transcript_links_frame ON frame_transcript_links(frame_id);
CREATE INDEX IF NOT EXISTS idx_frame_transcript_links_transcript ON frame_transcript_links(transcript_segment_id);
CREATE INDEX IF NOT EXISTS idx_frame_transcript_links_relevance ON frame_transcript_links(relevance_score DESC);

-- ============================================================================
-- FRAMES TABLE ENHANCEMENTS
-- ============================================================================

-- Add columns to frames table for manual capture support
ALTER TABLE frames ADD COLUMN IF NOT EXISTS is_manual_capture BOOLEAN DEFAULT FALSE;
ALTER TABLE frames ADD COLUMN IF NOT EXISTS capture_description TEXT;
ALTER TABLE frames ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN frames.is_manual_capture IS 'True if frame was manually captured by user';
COMMENT ON COLUMN frames.capture_description IS 'User-provided description for manual captures';
COMMENT ON COLUMN frames.captured_at IS 'Timestamp when frame was manually captured';

-- Index for manual captures
CREATE INDEX IF NOT EXISTS idx_frames_manual_capture ON frames(video_id, is_manual_capture) WHERE is_manual_capture = TRUE;

-- ============================================================================
-- HELPER FUNCTION: Get linked transcript for frame
-- ============================================================================

CREATE OR REPLACE FUNCTION get_linked_transcript(
  p_video_id UUID,
  p_timestamp DECIMAL,
  p_range_seconds INTEGER DEFAULT 15
)
RETURNS TABLE (
  segment_id UUID,
  segment_text TEXT,
  start_time DECIMAL,
  end_time DECIMAL,
  relevance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.text,
    t.start_time,
    t.end_time,
    (1 - ABS(t.start_time - p_timestamp) / p_range_seconds)::DECIMAL(3,2) as relevance
  FROM transcriptions t
  WHERE t.video_id = p_video_id
    AND t.start_time >= (p_timestamp - p_range_seconds)
    AND t.start_time <= (p_timestamp + p_range_seconds)
  ORDER BY ABS(t.start_time - p_timestamp);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_linked_transcript IS 'Returns transcript segments within range of a timestamp with relevance scores';

-- ============================================================================
-- TRIGGER: Update frame_analysis timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_frame_analysis_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_frame_analysis_updated ON frame_analysis;
CREATE TRIGGER trigger_frame_analysis_updated
  BEFORE UPDATE ON frame_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_frame_analysis_timestamp();

-- ============================================================================
-- GRANT PERMISSIONS (adjust user as needed)
-- ============================================================================

-- Grant permissions to application user if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'timecloq_admin') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON frame_analysis TO timecloq_admin;
    GRANT SELECT, INSERT, UPDATE, DELETE ON frame_transcript_links TO timecloq_admin;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO timecloq_admin;
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Migration 003_frame_analysis completed successfully' AS status;
