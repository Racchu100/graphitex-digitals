-- Add address, latitude and longitude columns to users table for customer geolocation tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address_line VARCHAR(255),
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
