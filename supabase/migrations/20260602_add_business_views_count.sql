-- Add views_count column to business_profiles
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;

-- Create an index to optimize sorting by views_count in services directory
CREATE INDEX IF NOT EXISTS idx_bp_views_count ON business_profiles(views_count DESC);
