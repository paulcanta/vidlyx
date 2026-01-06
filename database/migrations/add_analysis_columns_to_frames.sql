-- Migration: Add analysis columns to frames table
-- These columns store OCR confidence, OCR words, content type, and raw analysis data
-- Date: 2024

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

-- Example ocr_words structure:
-- [
--   {
--     "text": "Hello",
--     "confidence": 95.5,
--     "bbox": {"x0": 10, "y0": 20, "x1": 50, "y1": 40}
--   }
-- ]

-- Example raw_analysis structure:
-- {
--   "scene_description": "A presentation slide showing...",
--   "visual_elements": {...},
--   "on_screen_text": "Title: Introduction",
--   "content_type": "presentation_slide",
--   "timestamp": "2024-01-15T10:30:00.000Z"
-- }
