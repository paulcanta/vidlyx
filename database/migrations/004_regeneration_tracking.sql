-- Migration 004: Regeneration Tracking for Future Billing
-- Task 11: Full Analysis Dashboard & Polish

-- ============================================================================
-- ANALYSIS REGENERATIONS TABLE
-- Tracks when users regenerate analysis for future billing
-- ============================================================================
CREATE TABLE IF NOT EXISTS analysis_regenerations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trigger_reason VARCHAR(50) NOT NULL DEFAULT 'manual',
    frames_included INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    provider VARCHAR(20) DEFAULT 'manual',
    cost_credits DECIMAL(10, 4) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for analysis_regenerations
CREATE INDEX IF NOT EXISTS idx_regenerations_video_id ON analysis_regenerations(video_id);
CREATE INDEX IF NOT EXISTS idx_regenerations_user_id ON analysis_regenerations(user_id);
CREATE INDEX IF NOT EXISTS idx_regenerations_triggered_at ON analysis_regenerations(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_regenerations_provider ON analysis_regenerations(provider);

-- ============================================================================
-- USAGE TRACKING TABLE
-- Aggregated usage for billing dashboard
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_regenerations INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_credits DECIMAL(10, 4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, period_start, period_end)
);

-- Index for usage_tracking
CREATE INDEX IF NOT EXISTS idx_usage_user_period ON usage_tracking(user_id, period_start, period_end);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE analysis_regenerations IS 'Tracks analysis regeneration events for future billing';
COMMENT ON TABLE usage_tracking IS 'Aggregated usage metrics per billing period';

COMMENT ON COLUMN analysis_regenerations.trigger_reason IS 'Reason: manual, new_frames, quality_issue';
COMMENT ON COLUMN analysis_regenerations.provider IS 'AI provider: manual, gemini, anthropic';
COMMENT ON COLUMN analysis_regenerations.cost_credits IS 'Cost in platform credits (0 while billing disabled)';
