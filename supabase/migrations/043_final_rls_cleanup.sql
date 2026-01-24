-- ============================================
-- FINAL RLS CLEANUP & RECURSION RESOLUTION
-- Purges all potential recursive policies and resets security
-- ============================================

-- 1. DROP ALL PREVIOUS POLICIES ON USERS TABLE (Comprehensive List)
DROP POLICY IF EXISTS "users_see_own_profile" ON users;
DROP POLICY IF EXISTS "users_see_school_members" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "admins_create_users" ON users;
DROP POLICY IF EXISTS "admins_update_users" ON users;
DROP POLICY IF EXISTS "admins_delete_users" ON users;
DROP POLICY IF EXISTS "Users see only themselves" ON users;
DROP POLICY IF EXISTS "Users update only their own profile" ON users;
DROP POLICY IF EXISTS "Admins see all school users" ON users;
DROP POLICY IF EXISTS "Staff see school staff" ON users;
DROP POLICY IF EXISTS "Admins update school users" ON users;
DROP POLICY IF EXISTS "Admins delete school users" ON users;
DROP POLICY IF EXISTS "Enable insert for own profile" ON users;
DROP POLICY IF EXISTS "self_access" ON users;
DROP POLICY IF EXISTS "admin_access_all" ON users;
DROP POLICY IF EXISTS "staff_access_colleagues" ON users;
DROP POLICY IF EXISTS "admin_update_users" ON users;
DROP POLICY IF EXISTS "admin_delete_users" ON users;
DROP POLICY IF EXISTS "admin_insert_users" ON users;
DROP POLICY IF EXISTS "users_see_own_school_users" ON users;
DROP POLICY IF EXISTS "admin_see_all_school_users" ON users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
-- Note: Attempting both public.users and users just in case
DROP POLICY IF EXISTS "users_see_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_see_school_members" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "admins_create_users" ON public.users;
DROP POLICY IF EXISTS "admins_update_users" ON public.users;
DROP POLICY IF EXISTS "admins_delete_users" ON public.users;
DROP POLICY IF EXISTS "Users see only themselves" ON public.users;
DROP POLICY IF EXISTS "Users update only their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins see all school users" ON public.users;
DROP POLICY IF EXISTS "Staff see school staff" ON public.users;
DROP POLICY IF EXISTS "Admins update school users" ON public.users;
DROP POLICY IF EXISTS "Admins delete school users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for own profile" ON public.users;
DROP POLICY IF EXISTS "self_access" ON public.users;
DROP POLICY IF EXISTS "admin_access_all" ON public.users;
DROP POLICY IF EXISTS "staff_access_colleagues" ON public.users;
DROP POLICY IF EXISTS "admin_update_users" ON public.users;
DROP POLICY IF EXISTS "admin_delete_users" ON public.users;
DROP POLICY IF EXISTS "admin_insert_users" ON public.users;
DROP POLICY IF EXISTS "users_see_own_school_users" ON public.users;
DROP POLICY IF EXISTS "admin_see_all_school_users" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;

-- 2. ENSURE SECURE HELPER FUNCTIONS
-- These must be SECURITY DEFINER to bypass RLS on the users table.
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_auth_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. CREATE NEW CLEAN NON-RECURSIVE POLICIES FOR USERS

-- Rule 1: Everyone can see their own profile (NO subqueries, NO functions)
-- This is primary and absolute to allow initial fetchProfile to ALWAYS work.
CREATE POLICY "user_self_select" ON public.users
FOR SELECT USING (id = auth.uid());

-- Rule 2: Admins and Staff can see others in their school
-- Use the loop breaker pattern: check id != auth.uid() first.
CREATE POLICY "admin_staff_select_others" ON public.users
FOR SELECT USING (
  id != auth.uid() 
  AND get_auth_user_school_id() = school_id
  AND get_auth_user_role() IN ('admin', 'staff', 'bursar')
);

-- Rule 3: Update permissions
CREATE POLICY "user_self_update" ON public.users
FOR UPDATE USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "admin_update_others" ON public.users
FOR UPDATE USING (
  id != auth.uid()
  AND get_auth_user_school_id() = school_id
  AND get_auth_user_role() = 'admin'
);

-- Rule 4: Delete permissions
CREATE POLICY "admin_delete_others" ON public.users
FOR DELETE USING (
  id != auth.uid()
  AND get_auth_user_school_id() = school_id
  AND get_auth_user_role() = 'admin'
);

-- Rule 5: Insert permissions
CREATE POLICY "admin_insert_users" ON public.users
FOR INSERT WITH CHECK (
  get_auth_user_role() = 'admin'
  -- school_id check is implicit if we trust the admin/functions
);

-- 4. FIX OTHER TABLES THAT MIGHT HAVE RECURSIVE SUBQUERIES
-- Examples: classes, terms, subjects

-- CLASSES
DROP POLICY IF EXISTS "users_see_school_classes" ON classes;
DROP POLICY IF EXISTS "School staff see own school classes" ON classes;
CREATE POLICY "classes_access_standard" ON public.classes
FOR SELECT USING (school_id = get_auth_user_school_id());

-- TERMS
DROP POLICY IF EXISTS "users_see_school_terms" ON terms;
DROP POLICY IF EXISTS "Staff see school terms" ON terms;
CREATE POLICY "terms_access_standard" ON public.terms
FOR SELECT USING (school_id = get_auth_user_school_id());

-- SUBJECTS
DROP POLICY IF EXISTS "users_see_school_subjects" ON subjects;
DROP POLICY IF EXISTS "Staff see school subjects" ON subjects;
CREATE POLICY "subjects_access_standard" ON public.subjects
FOR SELECT USING (school_id = get_auth_user_school_id());

-- ATTENDANCE
DROP POLICY IF EXISTS "staff_see_class_attendance" ON attendance;
DROP POLICY IF EXISTS "admins_see_school_attendance" ON attendance;
CREATE POLICY "attendance_access_staff_admin" ON public.attendance
FOR SELECT USING (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() IN ('admin', 'staff', 'bursar')
);

-- RESULTS
DROP POLICY IF EXISTS "staff_see_class_results" ON results;
DROP POLICY IF EXISTS "admins_see_school_results" ON results;
CREATE POLICY "results_access_staff_admin" ON public.results
FOR SELECT USING (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() IN ('admin', 'staff', 'bursar')
);

-- 5. RE-ENABLE RLS (Safety measure)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
