-- Migration: Add result column to analysis_jobs table
-- This column stores the job result data upon completion
-- Date: 2024

-- Add result column to analysis_jobs table
ALTER TABLE analysis_jobs
ADD COLUMN IF NOT EXISTS result JSONB;

-- Add updated_at column if not exists
ALTER TABLE analysis_jobs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add index for result queries
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_result
ON analysis_jobs USING gin(result);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_analysis_jobs_updated_at ON analysis_jobs;
CREATE TRIGGER update_analysis_jobs_updated_at
    BEFORE UPDATE ON analysis_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON COLUMN analysis_jobs.result IS 'Job result data including statistics and output information';

-- Example result structure for frame-analysis-pipeline:
-- {
--   "videoId": "uuid",
--   "stats": {
--     "framesExtracted": 120,
--     "framesOcrProcessed": 120,
--     "framesVisionAnalyzed": 40,
--     "keyframesIdentified": 15
--   },
--   "steps": {
--     "extraction": { "frameCount": 120 },
--     "ocr": { "succeeded": 120, "failed": 0 },
--     "vision": { "analyzed": 40, "failed": 0 },
--     "postProcess": { "keyframesIdentified": 15 }
--   },
--   "startTime": "2024-01-15T10:00:00.000Z",
--   "endTime": "2024-01-15T10:15:00.000Z",
--   "duration": 900,
--   "completedAt": "2024-01-15T10:15:00.000Z"
-- }
