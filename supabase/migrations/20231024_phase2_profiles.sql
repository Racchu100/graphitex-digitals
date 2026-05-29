-- Phase 2 Profiles & Directories Schema
-- This script creates the core profile tables for businesses and influencers.

-- 1. Business Profiles
CREATE TABLE business_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_type    VARCHAR(30) NOT NULL
                   CHECK (provider_type IN ('business_owner','freelancer','local_service')),
  business_name    VARCHAR(150) NOT NULL,
  tagline          VARCHAR(200),
  description      TEXT NOT NULL,
  category_id      BIGINT NOT NULL REFERENCES categories(id),
  contact_type     VARCHAR(10) NOT NULL DEFAULT 'whatsapp'
                   CHECK (contact_type IN ('whatsapp','phone')),
  whatsapp_number  VARCHAR(20),
  contact_number   VARCHAR(20),
  website_url      VARCHAR(255),
  address_line     VARCHAR(255),
  country_id       BIGINT NOT NULL REFERENCES countries(id),
  state_id         BIGINT NOT NULL REFERENCES states(id),
  city_id          BIGINT NOT NULL REFERENCES cities(id),
  is_public        BOOLEAN NOT NULL DEFAULT true,
  status           VARCHAR(20) NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','pending_approval','approved','rejected','suspended')),
  rejection_reason VARCHAR(500),
  approved_by      UUID REFERENCES users(id),
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (whatsapp_number IS NOT NULL OR contact_number IS NOT NULL)
);

CREATE INDEX idx_bp_status_public ON business_profiles(status, is_public);
CREATE INDEX idx_bp_user ON business_profiles(user_id);
CREATE INDEX idx_bp_category ON business_profiles(category_id);
CREATE INDEX idx_bp_city ON business_profiles(city_id);

-- 2. Business Media
CREATE TABLE business_media (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  media_type          VARCHAR(10) NOT NULL CHECK (media_type IN ('image','video')),
  url                 VARCHAR(500) NOT NULL,
  thumbnail_url       VARCHAR(500),
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bm_profile_sort ON business_media(business_profile_id, sort_order);

-- 3. Profile Approvals
CREATE TABLE profile_approvals (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  reviewed_by         UUID NOT NULL REFERENCES users(id),
  decision            VARCHAR(10) NOT NULL CHECK (decision IN ('approved','rejected')),
  reason              VARCHAR(500),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pa_profile ON profile_approvals(business_profile_id);

-- 4. Influencer Profiles
CREATE TABLE influencer_profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  display_name       VARCHAR(120) NOT NULL,
  bio                TEXT,
  profile_picture_url VARCHAR(500) NOT NULL,
  niche_category_id  BIGINT REFERENCES categories(id),
  price_min          NUMERIC(12,2) NOT NULL,
  price_max          NUMERIC(12,2) NOT NULL,
  currency           CHAR(3) NOT NULL DEFAULT 'INR',
  contact_number     VARCHAR(20),   -- PRIVATE: provider-only
  country_id         BIGINT NOT NULL REFERENCES countries(id),
  state_id           BIGINT NOT NULL REFERENCES states(id),
  city_id            BIGINT NOT NULL REFERENCES cities(id),
  is_public          BOOLEAN NOT NULL DEFAULT true,
  status             VARCHAR(15) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','published','suspended')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (price_max >= price_min)
);

CREATE INDEX idx_ip_status_public ON influencer_profiles(status, is_public);
CREATE INDEX idx_ip_niche ON influencer_profiles(niche_category_id);
CREATE INDEX idx_ip_city ON influencer_profiles(city_id);

-- 5. Influencer Social Accounts
CREATE TABLE influencer_social_accounts (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  influencer_profile_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  platform              VARCHAR(15) NOT NULL
                        CHECK (platform IN ('instagram','youtube','facebook')),
  profile_url           VARCHAR(255) NOT NULL,
  external_id           VARCHAR(120),
  handle                VARCHAR(120),
  follower_count        BIGINT NOT NULL DEFAULT 0,
  count_source          VARCHAR(10) NOT NULL DEFAULT 'manual'
                        CHECK (count_source IN ('auto','manual')),
  is_verified           BOOLEAN NOT NULL DEFAULT false,
  last_synced_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(influencer_profile_id, platform)
);
CREATE INDEX idx_isa_profile ON influencer_social_accounts(influencer_profile_id);

-- 6. Contact Reveal Log
CREATE TABLE contact_reveal_log (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_user_id      UUID NOT NULL REFERENCES users(id),
  influencer_profile_id UUID NOT NULL REFERENCES influencer_profiles(id),
  revealed_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_crl_provider ON contact_reveal_log(provider_user_id);
CREATE INDEX idx_crl_influencer ON contact_reveal_log(influencer_profile_id);


-- Row Level Security Setup

-- Business profiles
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read approved" ON business_profiles
  FOR SELECT USING (status = 'approved' AND is_public = true);
CREATE POLICY "Owner read all own" ON business_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner create" ON business_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update own" ON business_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Influencer profiles
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON influencer_profiles
  FOR SELECT USING (status = 'published' AND is_public = true);
CREATE POLICY "Owner read own" ON influencer_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner create" ON influencer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update own" ON influencer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Business media: follows profile access
ALTER TABLE business_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for approved profiles" ON business_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_profiles bp
      WHERE bp.id = business_profile_id
      AND bp.status = 'approved' AND bp.is_public = true
    )
  );
CREATE POLICY "Owner all" ON business_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM business_profiles bp
      WHERE bp.id = business_profile_id
      AND bp.user_id = auth.uid()
    )
  );

-- Influencer Social Accounts
ALTER TABLE influencer_social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for published profiles" ON influencer_social_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM influencer_profiles ip
      WHERE ip.id = influencer_profile_id
      AND ip.status = 'published' AND ip.is_public = true
    )
  );
CREATE POLICY "Owner all" ON influencer_social_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM influencer_profiles ip
      WHERE ip.id = influencer_profile_id
      AND ip.user_id = auth.uid()
    )
  );

-- Contact reveal log
ALTER TABLE contact_reveal_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Provider insert" ON contact_reveal_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'provider')
  );
CREATE POLICY "Provider read own" ON contact_reveal_log
  FOR SELECT USING (provider_user_id = auth.uid());
