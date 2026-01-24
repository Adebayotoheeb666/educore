-- ============================================
-- TOTAL RLS PURGE AND FIX FOR USERS TABLE
-- This migration drops ALL possible overlapping policies
-- and creates a clean, non-recursive set.
-- ============================================

-- 1. Drop ALL known policies on public.users to clear the slate
DROP POLICY IF EXISTS "users_see_own_school_users" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "admin_see_all_school_users" ON public.users;
DROP POLICY IF EXISTS "Users see only themselves" ON public.users;
DROP POLICY IF EXISTS "Users update only their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins see all school users" ON public.users;
DROP POLICY IF EXISTS "Staff see school staff" ON public.users;
DROP POLICY IF EXISTS "Admins update school users" ON public.users;
DROP POLICY IF EXISTS "Admins delete school users" ON public.users;
DROP POLICY IF EXISTS "admins_create_users" ON public.users;
DROP POLICY IF EXISTS "Staff see school staff" ON users;
DROP POLICY IF EXISTS "Admins see all school users" ON users;
DROP POLICY IF EXISTS "Users see only themselves" ON users;

-- 2. Ensure Helper Functions are SECURITY DEFINER and non-recursive
-- They must use SECURITY DEFINER to bypass RLS on the users table.
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- We query the table directly. SECURITY DEFINER ensures we bypass RLS.
  -- No policies are evaluated during this SELECT.
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

-- 3. Create CLEAN Policies
-- NOTE: We use AS PERMISSIVE to be explicit.

-- Policy A: SELF-ACCESS (MUST BE FIRST AND NO FUNCTIONS)
-- This allows the initial fetchProfile to work instantly.
CREATE POLICY "self_access"
ON public.users FOR SELECT
USING (id = auth.uid());

-- Policy B: ADMIN ACCESS (LOOP BREAKER)
-- Only call functions for OTHER users.
CREATE POLICY "admin_access_all"
ON public.users FOR SELECT
USING (
  id != auth.uid() 
  AND get_auth_user_role() = 'admin'
  AND school_id = get_auth_user_school_id()
);

-- Policy C: STAFF ACCESS (LOOP BREAKER)
CREATE POLICY "staff_access_colleagues"
ON public.users FOR SELECT
USING (
  id != auth.uid() 
  AND get_auth_user_role() IN ('staff', 'admin', 'bursar')
  AND school_id = get_auth_user_school_id()
);

-- Policy D: ADMIN UPDATE
CREATE POLICY "admin_update_users"
ON public.users FOR UPDATE
USING (
  get_auth_user_role() = 'admin'
  AND school_id = get_auth_user_school_id()
)
WITH CHECK (
  get_auth_user_role() = 'admin'
  AND school_id = get_auth_user_school_id()
);

-- Policy E: ADMIN DELETE
CREATE POLICY "admin_delete_users"
ON public.users FOR DELETE
USING (
  id != auth.uid()
  AND get_auth_user_role() = 'admin'
  AND school_id = get_auth_user_school_id()
);

-- Policy F: ADMIN INSERT
CREATE POLICY "admin_insert_users"
ON public.users FOR INSERT
WITH CHECK (
  get_auth_user_role() = 'admin'
  AND school_id = get_auth_user_school_id()
);

-- 4. Enable RLS (just in case it was toggled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
