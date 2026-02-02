-- ============================================
-- FIX HELPER FUNCTIONS AND RLS POLICIES
-- Helper functions must properly fallback to DB query if JWT claims are missing
-- ============================================

-- 1. Drop all existing policies to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_record.policyname);
    END LOOP;
END $$;

-- 2. Create a simple, robust helper function for getting auth user role
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
    jwt_role TEXT;
BEGIN
    -- Try to get role from JWT claims
    BEGIN
        jwt_role := current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'role';
        IF jwt_role IS NOT NULL THEN
            RETURN jwt_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- JWT claim read failed, will fallback to DB query
        NULL;
    END;
    
    -- Fallback: query database directly (SECURITY DEFINER bypasses RLS)
    SELECT role INTO user_role 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create a simple, robust helper function for getting auth user school_id
CREATE OR REPLACE FUNCTION public.get_auth_user_school_id()
RETURNS UUID AS $$
DECLARE
    user_school_id UUID;
    jwt_school_id UUID;
BEGIN
    -- Try to get school_id from JWT claims
    BEGIN
        jwt_school_id := (current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'school_id')::UUID;
        IF jwt_school_id IS NOT NULL THEN
            RETURN jwt_school_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- JWT claim read failed, will fallback to DB query
        NULL;
    END;
    
    -- Fallback: query database directly (SECURITY DEFINER bypasses RLS)
    SELECT school_id INTO user_school_id 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
    
    RETURN user_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create policy for users to view their own profile
CREATE POLICY users_self_select ON public.users
    FOR SELECT
    USING (id = auth.uid());

-- 5. Create policy for users to update their own profile
CREATE POLICY users_self_update ON public.users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 6. Create policy for users to delete their own profile
CREATE POLICY users_self_delete ON public.users
    FOR DELETE
    USING (id = auth.uid());

-- 7. Create policy for admins to SELECT other users in their school
CREATE POLICY admin_select_others ON public.users
    FOR SELECT
    USING (
        id != auth.uid() AND
        public.get_auth_user_role() = 'admin' AND
        school_id = public.get_auth_user_school_id()
    );

-- 8. Create policy for admins to INSERT users in their school (ANY ROLE)
-- This is the key policy for bulk imports
CREATE POLICY admin_insert_users ON public.users
    FOR INSERT
    WITH CHECK (
        public.get_auth_user_role() = 'admin' AND
        school_id = public.get_auth_user_school_id()
    );

-- 9. Create policy for admins to UPDATE users in their school
CREATE POLICY admin_update_users ON public.users
    FOR UPDATE
    USING (
        id != auth.uid() AND
        public.get_auth_user_role() = 'admin' AND
        school_id = public.get_auth_user_school_id()
    )
    WITH CHECK (
        public.get_auth_user_role() = 'admin' AND
        school_id = public.get_auth_user_school_id()
    );

-- 10. Create policy for admins to DELETE users in their school
CREATE POLICY admin_delete_users ON public.users
    FOR DELETE
    USING (
        id != auth.uid() AND
        public.get_auth_user_role() = 'admin' AND
        school_id = public.get_auth_user_school_id()
    );

-- 11. Create policy for staff to view other staff in their school (read-only)
CREATE POLICY staff_select_peers ON public.users
    FOR SELECT
    USING (
        id != auth.uid() AND
        public.get_auth_user_role() IN ('staff', 'admin', 'bursar') AND
        school_id = public.get_auth_user_school_id()
    );

-- 12. Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO public;
GRANT EXECUTE ON FUNCTION public.get_auth_user_school_id() TO public;

-- 13. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 14. Completion notice
DO $$
BEGIN
    RAISE NOTICE 'Successfully fixed RLS policies:';
    RAISE NOTICE '- Helper functions now properly fallback to database queries';
    RAISE NOTICE '- Admin INSERT policy allows creating users of any role';
    RAISE NOTICE '- All policies use SECURITY DEFINER functions';
END $$;
