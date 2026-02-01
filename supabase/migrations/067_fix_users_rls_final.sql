-- ============================================
-- FINAL FIX FOR USERS RLS RECURSION
-- Completely eliminates recursion with optimized policies
-- ============================================

-- 1. Drop ALL existing policies on users table to start fresh
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

-- 2. Create or replace security definer functions with proper error handling
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Use auth.jwt() instead of querying users table when possible
    IF current_setting('request.jwt.claims', true)::jsonb ? 'user_metadata' THEN
        RETURN current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'role';
    END IF;
    
    -- Fallback to direct query with SECURITY DEFINER
    BEGIN
        SELECT role INTO user_role 
        FROM public.users 
        WHERE id = auth.uid()
        LIMIT 1;
        
        RETURN user_role;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_user_school_id()
RETURNS UUID AS $$
DECLARE
    user_school_id UUID;
BEGIN
    -- Try to get from JWT first to avoid querying users table
    IF current_setting('request.jwt.claims', true)::jsonb ? 'user_metadata' THEN
        RETURN (current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'school_id')::UUID;
    END IF;
    
    -- Fallback to direct query with SECURITY DEFINER
    BEGIN
        SELECT school_id INTO user_school_id 
        FROM public.users 
        WHERE id = auth.uid()
        LIMIT 1;
        
        RETURN user_school_id;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create optimized policies with proper ordering
-- Policy 1: Self access (no function calls)
CREATE POLICY users_self_select ON public.users
    FOR SELECT
    USING (id = auth.uid());

-- Policy 2: Self update (no function calls)
CREATE POLICY users_self_update ON public.users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Policy 3: Admin access to all users in same school
CREATE POLICY admin_access ON public.users
    FOR ALL
    USING (
        -- First check if it's not the current user (already handled by self policies)
        id != auth.uid() AND
        -- Then check admin role
        public.get_auth_user_role() = 'admin' AND
        -- Then check school_id
        school_id = public.get_auth_user_school_id()
    )
    WITH CHECK (
        public.get_auth_user_role() = 'admin' AND
        school_id = public.get_auth_user_school_id()
    );

-- Policy 4: Staff can view other staff in same school (read-only)
CREATE POLICY staff_view_peers ON public.users
    FOR SELECT
    USING (
        id != auth.uid() AND
        public.get_auth_user_role() IN ('staff', 'admin', 'bursar') AND
        school_id = public.get_auth_user_school_id()
    );

-- 4. Create a function to refresh JWT claims after user updates
CREATE OR REPLACE FUNCTION public.refresh_auth_jwt()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called by a trigger after user updates
    -- to ensure JWT claims are up to date
    PERFORM pg_notify('auth', json_build_object(
        'event', 'UPDATE',
        'schema', 'public',
        'table', 'users',
        'id', NEW.id
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to update JWT claims when user data changes
DROP TRIGGER IF EXISTS users_refresh_jwt_trigger ON public.users;
CREATE TRIGGER users_refresh_jwt_trigger
    AFTER UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role OR OLD.school_id IS DISTINCT FROM NEW.school_id)
    EXECUTE FUNCTION public.refresh_auth_jwt();

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO public;
GRANT EXECUTE ON FUNCTION public.get_auth_user_school_id() TO public;

-- 7. Enable RLS if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. Add a comment explaining the policy strategy
COMMENT ON TABLE public.users IS 'RLS Policies:
1. Users can view/update their own profile
2. Admins can manage all users in their school
3. Staff can view other staff in their school (read-only)
4. All policies use security definer functions to prevent recursion';

-- 9. Notify that the migration is complete
DO $$
BEGIN
    RAISE NOTICE 'Successfully applied RLS policies to users table without recursion';
END $$;
