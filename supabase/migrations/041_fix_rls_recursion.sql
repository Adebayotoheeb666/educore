-- ============================================
-- FIX RLS INFINITE RECURSION (REFINED)
-- Break the loop for self-lookups to allow sign-in
-- ============================================

-- 1. Create robust Security Definer Functions
-- These functions run with owner privileges and bypass RLS
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- We use a subquery that explicitly targets public.users
  -- to avoid any confusion with shadowed names.
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

-- 2. Update SELECT Policies on public.users
-- We simplify and add "loop breakers"

-- Policy 1: Always allow users to see their own profile.
-- This is the most important policy and must not call functions.
DROP POLICY IF EXISTS "Users see only themselves" ON public.users;
CREATE POLICY "Users see only themselves"
ON public.users FOR SELECT
USING (id = auth.uid());

-- Policy 2: Admins see others in their school.
-- LOOP BREAKER: Only call functions if the target ID is NOT the current user.
-- This prevents fetchProfile(auth.uid()) from entering a recursion loop.
DROP POLICY IF EXISTS "Admins see all school users" ON public.users;
CREATE POLICY "Admins see all school users"
ON public.users FOR SELECT
USING (
  id != auth.uid() -- Only applies to other users
  AND get_auth_user_role() = 'admin'
  AND school_id = get_auth_user_school_id()
);

-- Policy 3: Staff see others in their school staff.
-- LOOP BREAKER: Same as above.
DROP POLICY IF EXISTS "Staff see school staff" ON public.users;
CREATE POLICY "Staff see school staff"
ON public.users FOR SELECT
USING (
  id != auth.uid() -- Only applies to other users
  AND get_auth_user_role() IN ('staff', 'admin', 'bursar')
  AND school_id = get_auth_user_school_id()
);

-- 3. Update UPDATE/DELETE Policies
DROP POLICY IF EXISTS "Admins update school users" ON public.users;
CREATE POLICY "Admins update school users"
ON public.users FOR UPDATE
USING (
  get_auth_user_role() = 'admin'
  AND school_id = get_auth_user_school_id()
);

DROP POLICY IF EXISTS "Admins delete school users" ON public.users;
CREATE POLICY "Admins delete school users"
ON public.users FOR DELETE
USING (
  get_auth_user_role() = 'admin'
  AND school_id = get_auth_user_school_id()
  AND id != auth.uid()
);
