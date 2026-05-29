-- Phase 4: Admin Panel & Automation Schema

-- 1. Admin Audit Log
CREATE TABLE admin_audit_log (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_user_id  UUID NOT NULL REFERENCES users(id),
  action         VARCHAR(80) NOT NULL,
  entity_type    VARCHAR(60) NOT NULL,
  entity_id      VARCHAR(80) NOT NULL,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aal_admin ON admin_audit_log(admin_user_id);
CREATE INDEX idx_aal_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_aal_created ON admin_audit_log(created_at DESC);

-- 2. In-App Notifications
CREATE TABLE notifications (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        TEXT,
  data        JSONB,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read) WHERE NOT is_read;

-- 3. RLS: Admin Audit Log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin insert audit" ON admin_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin read audit" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 4. RLS: Admin access to business profiles
CREATE POLICY "Admin read all business profiles" ON business_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin update business profiles" ON business_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 5. RLS: Admin access to influencer profiles
CREATE POLICY "Admin read all influencer profiles" ON influencer_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin update influencer profiles" ON influencer_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 6. RLS: Admin access to all users
CREATE POLICY "Admin read all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin update users" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 7. RLS: Notifications (user-scoped)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 8. Admin can also read and insert notifications (for creating them server-side)
CREATE POLICY "Admin insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
