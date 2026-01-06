-- Migration: Add missing columns for OCR and Vision analysis
-- Date: 2025-11-29
-- Description: Adds result and updated_at to analysis_jobs, visual_overview to videos

-- Add result column to analysis_jobs for storing job results
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'analysis_jobs'
        AND column_name = 'result'
    ) THEN
        ALTER TABLE analysis_jobs
        ADD COLUMN result JSONB;
    END IF;
END $$;

-- Add updated_at column to analysis_jobs for tracking last update
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'analysis_jobs'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE analysis_jobs
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add visual_overview column to videos for storing visual analysis summary
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'videos'
        AND column_name = 'visual_overview'
    ) THEN
        ALTER TABLE videos
        ADD COLUMN visual_overview JSONB;
    END IF;
END $$;

-- Create trigger to automatically update updated_at on analysis_jobs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_analysis_jobs_updated_at'
    ) THEN
        CREATE TRIGGER update_analysis_jobs_updated_at
            BEFORE UPDATE ON analysis_jobs
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add index on analysis_jobs.updated_at for efficient querying
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'analysis_jobs'
        AND indexname = 'idx_analysis_jobs_updated_at'
    ) THEN
        CREATE INDEX idx_analysis_jobs_updated_at ON analysis_jobs(updated_at DESC);
    END IF;
END $$;

-- Add index on videos.visual_overview for JSONB queries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'videos'
        AND indexname = 'idx_videos_visual_overview'
    ) THEN
        CREATE INDEX idx_videos_visual_overview ON videos USING GIN (visual_overview);
    END IF;
END $$;
