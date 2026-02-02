-- ============================================
-- REMOVE RECURSIVE POLICY AND CONSOLIDATE
-- The admins_can_manage_users policy causes infinite recursion
-- because it queries the users table within RLS evaluation
-- ============================================

-- 1. Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "admins_can_manage_users" ON public.users;

-- 2. Ensure the admin_access policy from 067 is properly configured
-- Drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "admin_access" ON public.users;

CREATE POLICY admin_access ON public.users
    FOR ALL
    USING (
        -- First check if it's not the current user (already handled by self policies)
        id != auth.uid() AND
        -- Then check admin role using SECURITY DEFINER function
        public.get_auth_user_role() = 'admin' AND
        -- Then check school_id using SECURITY DEFINER function
        school_id = public.get_auth_user_school_id()
    )
    WITH CHECK (
        public.get_auth_user_role() = 'admin' AND
        school_id = public.get_auth_user_school_id()
    );

-- 3. Ensure helper functions have proper SECURITY DEFINER and search_path
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Try to get from JWT claims first to minimize database queries
    BEGIN
        RETURN current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'role';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Fallback: direct query with SECURITY DEFINER to bypass RLS
    SELECT role INTO user_role 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_user_school_id()
RETURNS UUID AS $$
DECLARE
    user_school_id UUID;
BEGIN
    -- Try to get from JWT claims first to minimize database queries
    BEGIN
        RETURN (current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'school_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Fallback: direct query with SECURITY DEFINER to bypass RLS
    SELECT school_id INTO user_school_id 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
    
    RETURN user_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Grant necessary permissions to public (so authenticated users can call them)
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO public;
GRANT EXECUTE ON FUNCTION public.get_auth_user_school_id() TO public;

-- 5. Ensure RLS is still enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Verify the final policy configuration
DO $$
BEGIN
    RAISE NOTICE 'Successfully removed recursive admins_can_manage_users policy';
    RAISE NOTICE 'Using only non-recursive policies: users_self_select, users_self_update, admin_access, staff_view_peers';
END $$;
