-- Phase 1 Foundation & Authentication Schema
-- This script creates the foundational tables for the Graphitex Marketplace

-- 1. Location Tables
CREATE TABLE countries (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  iso_code  VARCHAR(3)   NOT NULL UNIQUE,
  phone_code VARCHAR(6)  NOT NULL
);

CREATE TABLE states (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country_id BIGINT NOT NULL REFERENCES countries(id),
  name       VARCHAR(100) NOT NULL
);
CREATE INDEX idx_states_country ON states(country_id);

CREATE TABLE cities (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  state_id BIGINT NOT NULL REFERENCES states(id),
  name     VARCHAR(100) NOT NULL
);
CREATE INDEX idx_cities_state ON cities(state_id);

-- 2. Categories
CREATE TABLE categories (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id BIGINT REFERENCES categories(id),
  name      VARCHAR(100) NOT NULL,
  slug      VARCHAR(120) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- 3. Users
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(180) UNIQUE,
  mobile_number   VARCHAR(20)  NOT NULL UNIQUE,
  mobile_verified BOOLEAN NOT NULL DEFAULT false,
  country_id      BIGINT NOT NULL REFERENCES countries(id),
  state_id        BIGINT NOT NULL REFERENCES states(id),
  city_id         BIGINT NOT NULL REFERENCES cities(id),
  avatar_url      VARCHAR(500),
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','pending','suspended')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. User Roles
CREATE TABLE user_roles (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role             VARCHAR(20) NOT NULL
                   CHECK (role IN ('influencer','provider','admin')),
  provider_subtype VARCHAR(30)
                   CHECK (provider_subtype IN ('business_owner','freelancer','local_service')),
  granted_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- 5. Platform Config
CREATE TABLE platform_config (
  key         VARCHAR(80) PRIMARY KEY,
  value       VARCHAR(255) NOT NULL,
  description VARCHAR(255),
  updated_by  UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed values for platform_config
INSERT INTO platform_config (key, value, description) VALUES
  ('max_business_profiles_per_provider', '5', 'Max business profiles a provider can create'),
  ('max_opportunity_duration_days', '30', 'Max opportunity visibility window in days');

-- Seed values for locations (dummy data for dev)
INSERT INTO countries (name, iso_code, phone_code) VALUES ('India', 'IND', '+91');
INSERT INTO states (country_id, name) VALUES (1, 'Karnataka');
INSERT INTO cities (state_id, name) VALUES (1, 'Bangalore');

-- 6. OTP Verifications (audit only)
CREATE TABLE otp_verifications (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mobile_number VARCHAR(20) NOT NULL,
  purpose       VARCHAR(30) NOT NULL DEFAULT 'login',
  consumed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL
);

-- 7. Row-Level Security (RLS)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own" ON users FOR UPDATE USING (auth.uid() = id);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Add own role" ON user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role IN ('influencer','provider'));

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON countries FOR SELECT USING (true);

ALTER TABLE states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON states FOR SELECT USING (true);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON cities FOR SELECT USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active" ON categories FOR SELECT USING (is_active = true);
