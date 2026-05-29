-- Phase 3 Opportunities & Connections Schema
-- This script creates the tables for posting and applying to opportunities.

-- 1. Opportunities
CREATE TABLE opportunities (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id  UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  posted_by_user_id    UUID NOT NULL REFERENCES users(id),
  title                VARCHAR(150) NOT NULL,
  purpose              VARCHAR(200) NOT NULL,
  description          TEXT NOT NULL,
  price_min            NUMERIC(12,2) NOT NULL,
  price_max            NUMERIC(12,2) NOT NULL,
  currency             CHAR(3) NOT NULL DEFAULT 'INR',
  min_followers        INTEGER NOT NULL DEFAULT 0,
  platform_preference  VARCHAR(15) NOT NULL DEFAULT 'any'
                       CHECK (platform_preference IN ('instagram','youtube','facebook','any')),
  starts_at            TIMESTAMPTZ NOT NULL,
  expires_at           TIMESTAMPTZ NOT NULL,
  status               VARCHAR(15) NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','active','expired','closed','removed')),
  removed_reason       VARCHAR(500),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at > starts_at),
  CHECK (expires_at <= starts_at + INTERVAL '31 days'),
  CHECK (price_max >= price_min)
);

CREATE INDEX idx_opp_status_expires ON opportunities(status, expires_at);
CREATE INDEX idx_opp_business ON opportunities(business_profile_id);
CREATE INDEX idx_opp_followers ON opportunities(min_followers);
CREATE INDEX idx_opp_platform ON opportunities(platform_preference);
CREATE INDEX idx_opp_posted_by ON opportunities(posted_by_user_id);

-- 2. Opportunity Applications
CREATE TABLE opportunity_applications (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opportunity_id        UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  influencer_profile_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  message               TEXT,
  status                VARCHAR(15) NOT NULL DEFAULT 'applied'
                        CHECK (status IN ('applied','viewed','contacted','accepted','rejected')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(opportunity_id, influencer_profile_id)
);

CREATE INDEX idx_oa_opportunity ON opportunity_applications(opportunity_id);
CREATE INDEX idx_oa_influencer ON opportunity_applications(influencer_profile_id);
CREATE INDEX idx_oa_status ON opportunity_applications(status);

-- 3. Row-Level Security (RLS)

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Public: read active opportunities
CREATE POLICY "Read active" ON opportunities
  FOR SELECT USING (status = 'active');

-- Owner: read all own
CREATE POLICY "Owner read own" ON opportunities
  FOR SELECT USING (auth.uid() = posted_by_user_id);

-- Provider: create (must own an approved business profile)
CREATE POLICY "Provider create" ON opportunities
  FOR INSERT WITH CHECK (
    auth.uid() = posted_by_user_id
    AND EXISTS (
      SELECT 1 FROM business_profiles
      WHERE id = business_profile_id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
  );

-- Owner: update own
CREATE POLICY "Owner update" ON opportunities
  FOR UPDATE USING (auth.uid() = posted_by_user_id);

ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;

-- Influencer: insert own application
CREATE POLICY "Influencer apply" ON opportunity_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM influencer_profiles
      WHERE id = influencer_profile_id AND user_id = auth.uid()
    )
  );

-- Influencer: read own applications
CREATE POLICY "Read own applications" ON opportunity_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM influencer_profiles
      WHERE id = influencer_profile_id AND user_id = auth.uid()
    )
  );

-- Provider: read applications to own opportunities
CREATE POLICY "Provider read applications" ON opportunity_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM opportunities
      WHERE id = opportunity_id AND posted_by_user_id = auth.uid()
    )
  );

-- Provider: update application status
CREATE POLICY "Provider update status" ON opportunity_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM opportunities
      WHERE id = opportunity_id AND posted_by_user_id = auth.uid()
    )
  );

-- 4. Expiry Job (pg_cron)
-- Ensure pg_cron extension is created (Note: on Supabase, it usually is available, but schema might differ)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule auto-expiry to run every 15 minutes
SELECT cron.schedule(
  'expire-opportunities',
  '*/15 * * * *',
  $$UPDATE opportunities SET status = 'expired', updated_at = now()
    WHERE status = 'active' AND expires_at < now()$$
);
