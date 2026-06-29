-- Migration to add latitude and longitude to business_profiles table for map selection
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
