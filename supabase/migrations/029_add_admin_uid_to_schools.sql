-- ============================================
-- ADD ADMIN_UID TO SCHOOLS TABLE
-- Required for school registration flow
-- ============================================

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS admin_uid UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_schools_admin_uid ON schools(admin_uid);
