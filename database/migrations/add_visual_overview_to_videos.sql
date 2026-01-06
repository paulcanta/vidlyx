-- Migration: Add visual_overview column to videos table
-- This column stores aggregated analysis data about frame content types
-- Date: 2024

-- Add visual_overview column to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS visual_overview JSONB;

-- Add index for visual_overview queries
CREATE INDEX IF NOT EXISTS idx_videos_visual_overview
ON videos USING gin(visual_overview);

-- Add comment for documentation
COMMENT ON COLUMN videos.visual_overview IS 'Aggregated visual analysis overview including content types, keyframes, and statistics';

-- Example visual_overview structure:
-- {
--   "totalFrames": 120,
--   "totalKeyframes": 15,
--   "framesWithText": 80,
--   "framesWithContentType": 100,
--   "duration": 600.5,
--   "dominantContentType": "presentation_slide",
--   "contentTypes": [
--     {
--       "type": "presentation_slide",
--       "count": 60,
--       "percentage": 50,
--       "firstOccurrence": 10.5,
--       "lastOccurrence": 590.2,
--       "keyframeCount": 8
--     },
--     {
--       "type": "code",
--       "count": 30,
--       "percentage": 25,
--       "firstOccurrence": 20.0,
--       "lastOccurrence": 580.0,
--       "keyframeCount": 5
--     }
--   ],
--   "generatedAt": "2024-01-15T10:30:00.000Z"
-- }
