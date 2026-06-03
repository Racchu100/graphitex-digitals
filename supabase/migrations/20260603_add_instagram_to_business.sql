-- Add instagram_handle column to business_profiles
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(255);
