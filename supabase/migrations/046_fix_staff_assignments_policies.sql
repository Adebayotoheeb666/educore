-- Fix RLS policies for staff_assignments
-- Use security definer helper functions to avoid recursion and ensure reliability
-- Replaces previous policies including the recently added delete policy

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "users_see_school_assignments" ON staff_assignments;
DROP POLICY IF EXISTS "admins_manage_assignments" ON staff_assignments;
DROP POLICY IF EXISTS "admins_delete_assignments" ON staff_assignments;
DROP POLICY IF EXISTS "admins_manage_assignments_insert" ON staff_assignments;

-- 2. Enable RLS (ensure it's on)
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;

-- 3. Create robust policies using helper functions (defined in 042 migration)

-- Policy: Admin Full Access (Select, Insert, Update, Delete)
CREATE POLICY "admin_manage_assignments" ON staff_assignments
  FOR ALL
  USING (
    get_auth_user_role() = 'admin' AND
    school_id = get_auth_user_school_id()
  )
  WITH CHECK (
    get_auth_user_role() = 'admin' AND
    school_id = get_auth_user_school_id()
  );

-- Policy: Staff View Access (View colleagues/own assignments)
CREATE POLICY "staff_view_assignments" ON staff_assignments
  FOR SELECT
  USING (
    get_auth_user_role() IN ('staff', 'bursar') AND
    school_id = get_auth_user_school_id()
  );

-- Policy: Students View Access (View own teachers)
-- Note: This is complex, usually students just need to see classes, but let's allow it if needed
CREATE POLICY "students_view_assignments" ON staff_assignments
  FOR SELECT
  USING (
    get_auth_user_role() = 'student' AND
    school_id = get_auth_user_school_id()
  );

-- Policy: Parents View Access
CREATE POLICY "parents_view_assignments" ON staff_assignments
  FOR SELECT
  USING (
    get_auth_user_role() = 'parent' AND
    school_id = get_auth_user_school_id()
  );
