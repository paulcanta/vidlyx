-- ============================================================================
-- Task 3 Subtask 5: Frame Analysis Pipeline Migrations
-- Comprehensive migration script for all pipeline-related database changes
-- ============================================================================

-- Migration 1: Add analysis columns to frames table
-- ============================================================================

-- Add ocr_confidence column (0-100 confidence score)
ALTER TABLE frames
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(5, 2);

-- Add ocr_words column (detailed word-level OCR data)
ALTER TABLE frames
ADD COLUMN IF NOT EXISTS ocr_words JSONB;

-- Add content_type column (categorization from vision analysis)
ALTER TABLE frames
ADD COLUMN IF NOT EXISTS content_type VARCHAR(100);

-- Add raw_analysis column (full raw vision analysis response)
ALTER TABLE frames
ADD COLUMN IF NOT EXISTS raw_analysis JSONB;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_frames_ocr_confidence
ON frames(ocr_confidence) WHERE ocr_confidence IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_frames_content_type
ON frames(content_type) WHERE content_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_frames_raw_analysis
ON frames USING gin(raw_analysis);

-- Add comments for documentation
COMMENT ON COLUMN frames.ocr_confidence IS 'OCR confidence score (0-100) from Tesseract';
COMMENT ON COLUMN frames.ocr_words IS 'Detailed word-level OCR data including bounding boxes and confidence';
COMMENT ON COLUMN frames.content_type IS 'Content type classification from vision analysis (e.g., code, presentation_slide, diagram)';
COMMENT ON COLUMN frames.raw_analysis IS 'Full raw vision analysis response from Gemini API';


-- Migration 2: Add result and updated_at columns to analysis_jobs table
-- ============================================================================

-- Add result column to analysis_jobs table
ALTER TABLE analysis_jobs
ADD COLUMN IF NOT EXISTS result JSONB;

-- Add updated_at column if not exists
ALTER TABLE analysis_jobs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add index for result queries
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_result
ON analysis_jobs USING gin(result);

-- Add trigger for updated_at (only if it doesn't exist)
DROP TRIGGER IF EXISTS update_analysis_jobs_updated_at ON analysis_jobs;
CREATE TRIGGER update_analysis_jobs_updated_at
    BEFORE UPDATE ON analysis_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON COLUMN analysis_jobs.result IS 'Job result data including statistics and output information';


-- Migration 3: Add visual_overview column to videos table
-- ============================================================================

-- Add visual_overview column to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS visual_overview JSONB;

-- Add index for visual_overview queries
CREATE INDEX IF NOT EXISTS idx_videos_visual_overview
ON videos USING gin(visual_overview);

-- Add comment for documentation
COMMENT ON COLUMN videos.visual_overview IS 'Aggregated visual analysis overview including content types, keyframes, and statistics';


-- ============================================================================
-- Verification Queries (uncomment to run)
-- ============================================================================

-- Verify frames table columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'frames'
-- AND column_name IN ('ocr_confidence', 'ocr_words', 'content_type', 'raw_analysis')
-- ORDER BY column_name;

-- Verify analysis_jobs table columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'analysis_jobs'
-- AND column_name IN ('result', 'updated_at')
-- ORDER BY column_name;

-- Verify videos table columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'videos'
-- AND column_name = 'visual_overview';

-- ============================================================================
-- Sample Data Structures (for reference)
-- ============================================================================

/*

-- Example ocr_words structure:
[
  {
    "text": "Hello",
    "confidence": 95.5,
    "bbox": {"x0": 10, "y0": 20, "x1": 50, "y1": 40}
  }
]

-- Example raw_analysis structure:
{
  "scene_description": "A presentation slide showing...",
  "visual_elements": {...},
  "on_screen_text": "Title: Introduction",
  "content_type": "presentation_slide",
  "timestamp": "2024-01-15T10:30:00.000Z"
}

-- Example visual_overview structure:
{
  "totalFrames": 120,
  "totalKeyframes": 15,
  "framesWithText": 80,
  "framesWithContentType": 100,
  "duration": 600.5,
  "dominantContentType": "presentation_slide",
  "contentTypes": [
    {
      "type": "presentation_slide",
      "count": 60,
      "percentage": 50,
      "firstOccurrence": 10.5,
      "lastOccurrence": 590.2,
      "keyframeCount": 8
    }
  ],
  "generatedAt": "2024-01-15T10:30:00.000Z"
}

-- Example analysis_jobs result structure for frame-analysis-pipeline:
{
  "videoId": "uuid",
  "stats": {
    "framesExtracted": 120,
    "framesOcrProcessed": 120,
    "framesVisionAnalyzed": 40,
    "keyframesIdentified": 15
  },
  "steps": {
    "extraction": { "frameCount": 120 },
    "ocr": { "succeeded": 120, "failed": 0 },
    "vision": { "analyzed": 40, "failed": 0 },
    "postProcess": { "keyframesIdentified": 15 }
  },
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T10:15:00.000Z",
  "duration": 900,
  "completedAt": "2024-01-15T10:15:00.000Z"
}

*/
