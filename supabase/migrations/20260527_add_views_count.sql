-- Add views_count column to influencer_profiles
ALTER TABLE influencer_profiles ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;

-- Create an index to optimize sorting by views_count
CREATE INDEX IF NOT EXISTS idx_ip_views_count ON influencer_profiles(views_count DESC);
