-- ============================================
-- FIX BULK IMPORT RLS VIOLATIONS
-- Update INSERT policies to use robust helper functions
-- ============================================

-- 1. Update USERS Insert Policy
DROP POLICY IF EXISTS "admins_create_users" ON public.users;
CREATE POLICY "admins_create_users" ON public.users
FOR INSERT
WITH CHECK (
  get_auth_user_role() = 'admin' AND
  school_id = get_auth_user_school_id()
);

-- 2. Update STUDENT_CLASSES Insert Policy
DROP POLICY IF EXISTS "admins_manage_enrollments" ON public.student_classes;
CREATE POLICY "admins_manage_enrollments" ON public.student_classes
FOR INSERT
WITH CHECK (
  get_auth_user_role() = 'admin' AND
  school_id = get_auth_user_school_id()
);

-- 3. Update PARENT_STUDENT_LINKS Insert Policy
DROP POLICY IF EXISTS "admins_manage_links" ON public.parent_student_links;
CREATE POLICY "admins_manage_links" ON public.parent_student_links
FOR INSERT
WITH CHECK (
  get_auth_user_role() = 'admin' AND
  school_id = get_auth_user_school_id()
);

-- 4. OPTIONAL: Drop Foreign Key constraint to allow profiles without Auth users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
