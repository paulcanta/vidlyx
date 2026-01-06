-- Vidlyx Database Schema
-- PostgreSQL 16+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    email_verified BOOLEAN DEFAULT false NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- SESSIONS TABLE (for connect-pg-simple)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Index for session expiration cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- ============================================================================
-- VIDEOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    youtube_id VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    channel_name VARCHAR(255),
    duration INTEGER, -- in seconds
    thumbnail_url TEXT,
    description TEXT,
    analysis_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for videos
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_videos_analysis_status ON videos(analysis_status);
CREATE INDEX IF NOT EXISTS idx_videos_last_accessed ON videos(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- ============================================================================
-- TRANSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    full_text TEXT NOT NULL,
    segments JSONB,
    transcript_type VARCHAR(50) DEFAULT 'auto' NOT NULL,
    language VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for transcriptions
CREATE INDEX IF NOT EXISTS idx_transcriptions_video_id ON transcriptions(video_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_full_text_trgm ON transcriptions USING gin(full_text gin_trgm_ops);

-- ============================================================================
-- FRAMES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS frames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    timestamp_seconds DECIMAL(10, 3) NOT NULL,
    frame_path TEXT NOT NULL,
    thumbnail_path TEXT,
    on_screen_text TEXT,
    scene_description TEXT,
    visual_elements JSONB,
    is_keyframe BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for frames
CREATE INDEX IF NOT EXISTS idx_frames_video_id ON frames(video_id);
CREATE INDEX IF NOT EXISTS idx_frames_timestamp ON frames(timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_frames_is_keyframe ON frames(is_keyframe) WHERE is_keyframe = true;
CREATE INDEX IF NOT EXISTS idx_frames_on_screen_text_trgm ON frames USING gin(on_screen_text gin_trgm_ops);

-- ============================================================================
-- SECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_time DECIMAL(10, 3) NOT NULL,
    end_time DECIMAL(10, 3) NOT NULL,
    summary TEXT,
    key_points JSONB,
    section_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (video_id, section_order)
);

-- Indexes for sections
CREATE INDEX IF NOT EXISTS idx_sections_video_id ON sections(video_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(section_order);
CREATE INDEX IF NOT EXISTS idx_sections_start_time ON sections(start_time);

-- ============================================================================
-- VIDEO SUMMARIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
    full_summary TEXT NOT NULL,
    key_takeaways JSONB,
    topics JSONB,
    target_audience TEXT,
    difficulty_level VARCHAR(50),
    estimated_value TEXT,
    recommended_for JSONB,
    prerequisites JSONB,
    comprehensive_analysis TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for video summaries
CREATE INDEX IF NOT EXISTS idx_video_summaries_video_id ON video_summaries(video_id);

-- ============================================================================
-- FOLDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50),
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for folders
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON folders(sort_order);

-- ============================================================================
-- SAVES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    title VARCHAR(255),
    auto_title BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for saves
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_video_id ON saves(video_id);
CREATE INDEX IF NOT EXISTS idx_saves_created_at ON saves(created_at DESC);

-- ============================================================================
-- SAVE FRAMES TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS save_frames (
    save_id UUID NOT NULL REFERENCES saves(id) ON DELETE CASCADE,
    frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
    PRIMARY KEY (save_id, frame_id)
);

-- Indexes for save_frames
CREATE INDEX IF NOT EXISTS idx_save_frames_save_id ON save_frames(save_id);
CREATE INDEX IF NOT EXISTS idx_save_frames_frame_id ON save_frames(frame_id);

-- ============================================================================
-- SAVE TRANSCRIPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS save_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    save_id UUID NOT NULL REFERENCES saves(id) ON DELETE CASCADE,
    start_time DECIMAL(10, 3) NOT NULL,
    end_time DECIMAL(10, 3) NOT NULL,
    text TEXT NOT NULL
);

-- Indexes for save_transcripts
CREATE INDEX IF NOT EXISTS idx_save_transcripts_save_id ON save_transcripts(save_id);

-- ============================================================================
-- SAVE SUMMARIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS save_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    save_id UUID NOT NULL REFERENCES saves(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    excerpt TEXT NOT NULL
);

-- Indexes for save_summaries
CREATE INDEX IF NOT EXISTS idx_save_summaries_save_id ON save_summaries(save_id);
CREATE INDEX IF NOT EXISTS idx_save_summaries_section_id ON save_summaries(section_id);

-- ============================================================================
-- SAVE FOLDERS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS save_folders (
    save_id UUID NOT NULL REFERENCES saves(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (save_id, folder_id)
);

-- Indexes for save_folders
CREATE INDEX IF NOT EXISTS idx_save_folders_save_id ON save_folders(save_id);
CREATE INDEX IF NOT EXISTS idx_save_folders_folder_id ON save_folders(folder_id);

-- ============================================================================
-- TAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    UNIQUE(user_id, name)
);

-- Indexes for tags
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- ============================================================================
-- SAVE TAGS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS save_tags (
    save_id UUID NOT NULL REFERENCES saves(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (save_id, tag_id)
);

-- Indexes for save_tags
CREATE INDEX IF NOT EXISTS idx_save_tags_save_id ON save_tags(save_id);
CREATE INDEX IF NOT EXISTS idx_save_tags_tag_id ON save_tags(tag_id);

-- ============================================================================
-- ANALYSIS JOBS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    progress INTEGER DEFAULT 0 NOT NULL,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for analysis_jobs
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_video_id ON analysis_jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_job_type ON analysis_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_created_at ON analysis_jobs(created_at DESC);

-- ============================================================================
-- TRIGGER FUNCTION for updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- APPLY TRIGGERS to tables with updated_at column
-- ============================================================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saves_updated_at ON saves;
CREATE TRIGGER update_saves_updated_at
    BEFORE UPDATE ON saves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================
COMMENT ON TABLE users IS 'User accounts for the Vidlyx application';
COMMENT ON TABLE sessions IS 'Session storage for Express session management';
COMMENT ON TABLE videos IS 'YouTube videos that have been analyzed or queued for analysis';
COMMENT ON TABLE transcriptions IS 'Video transcripts with full text and timestamped segments';
COMMENT ON TABLE frames IS 'Extracted frames from videos with OCR and visual analysis';
COMMENT ON TABLE sections IS 'Video sections/chapters with summaries';
COMMENT ON TABLE video_summaries IS 'AI-generated summaries for entire videos';
COMMENT ON TABLE folders IS 'User-created folders for organizing saves';
COMMENT ON TABLE saves IS 'User saves containing selected frames, transcripts, and summaries';
COMMENT ON TABLE save_frames IS 'Junction table linking saves to frames';
COMMENT ON TABLE save_transcripts IS 'Transcript excerpts saved by users';
COMMENT ON TABLE save_summaries IS 'Summary excerpts saved by users';
COMMENT ON TABLE save_folders IS 'Junction table organizing saves into folders';
COMMENT ON TABLE tags IS 'User-created tags for categorizing saves';
COMMENT ON TABLE save_tags IS 'Junction table linking saves to tags';
COMMENT ON TABLE analysis_jobs IS 'Background jobs for video analysis tasks';
