-- ============================================
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- Replaces recursive subquery policies with secure helper functions
-- ============================================

-- 1. CLASSES TABLE
DROP POLICY IF EXISTS "users_see_school_classes" ON classes;
DROP POLICY IF EXISTS "admins_create_classes" ON classes;
DROP POLICY IF EXISTS "admins_update_classes" ON classes;

CREATE POLICY "view_school_classes" ON classes
  FOR SELECT
  USING (school_id = get_auth_user_school_id());

CREATE POLICY "admin_manage_classes" ON classes
  FOR ALL
  USING (
    get_auth_user_role() = 'admin' AND
    school_id = get_auth_user_school_id()
  )
  WITH CHECK (
    get_auth_user_role() = 'admin' AND
    school_id = get_auth_user_school_id()
  );

-- 2. SUBJECTS TABLE
DROP POLICY IF EXISTS "users_see_school_subjects" ON subjects;
DROP POLICY IF EXISTS "admins_manage_subjects" ON subjects;

CREATE POLICY "view_school_subjects" ON subjects
  FOR SELECT
  USING (school_id = get_auth_user_school_id());

CREATE POLICY "admin_manage_subjects" ON subjects
  FOR ALL
  USING (
    get_auth_user_role() = 'admin' AND
    school_id = get_auth_user_school_id()
  )
  WITH CHECK (
    get_auth_user_role() = 'admin' AND
    school_id = get_auth_user_school_id()
  );

-- 3. STUDENT_CLASSES TABLE
DROP POLICY IF EXISTS "users_see_school_enrollments" ON student_classes;
DROP POLICY IF EXISTS "staff_see_assigned_students" ON student_classes;
DROP POLICY IF EXISTS "admins_manage_enrollments" ON student_classes;

-- Base view policy for everyone in school
CREATE POLICY "view_school_enrollments" ON student_classes
  FOR SELECT
  USING (school_id = get_auth_user_school_id());

-- Admin management
CREATE POLICY "admin_manage_enrollments" ON student_classes
  FOR ALL
  USING (
    get_auth_user_role() = 'admin' AND
    school_id = get_auth_user_school_id()
  )
  WITH CHECK (
    get_auth_user_role() = 'admin' AND
    school_id = get_auth_user_school_id()
  );

-- 4. ENSURE HELPER FUNCTIONS EXIST (Safety Check)
-- These were created in 042, but redefining guarantees availability
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Security Definer bypasses RLS
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_auth_user_school_id()
RETURNS UUID AS $$
DECLARE
  user_school_id UUID;
BEGIN
  SELECT school_id INTO user_school_id FROM public.users WHERE id = auth.uid();
  RETURN user_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
