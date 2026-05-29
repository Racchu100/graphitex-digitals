-- Migration: Add multiple niche categories support to influencer profiles
-- Target: Supabase / PostgreSQL

ALTER TABLE influencer_profiles 
ADD COLUMN IF NOT EXISTS niche_category_ids BIGINT[] DEFAULT '{}';

-- Migrate existing single niche_category_id to the array for backward compatibility
UPDATE influencer_profiles 
SET niche_category_ids = ARRAY[niche_category_id] 
WHERE niche_category_id IS NOT NULL AND (niche_category_ids IS NULL OR cardinality(niche_category_ids) = 0);

-- Create index on the array column using GIN index for faster search
CREATE INDEX IF NOT EXISTS idx_ip_niches ON influencer_profiles USING gin(niche_category_ids);
