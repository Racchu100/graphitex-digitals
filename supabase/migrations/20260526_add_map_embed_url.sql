-- Migration: Add custom map embed URL to business profiles
-- Target: Supabase / PostgreSQL

ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS map_embed_url TEXT;
