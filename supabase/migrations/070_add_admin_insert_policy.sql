-- ============================================
-- ADD INSERT POLICY FOR ADMINS
-- Allows admins to insert users of any role (student, staff, parent, etc)
-- ============================================

-- 1. Drop the overly-restrictive admin_access policy and recreate with proper separation
DROP POLICY IF EXISTS "admin_access" ON public.users;

-- 2. Create SELECT policy for admins to view other users
CREATE POLICY admin_select ON public.users
    FOR SELECT
    USING (
        id != auth.uid() AND
        public.get_auth_user_role() = 'admin' AND
        school_id = public.get_auth_user_school_id()
    );

-- 3. Create UPDATE policy for admins to update other users
CREATE POLICY admin_update ON public.users
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

-- 4. Create INSERT policy for admins to create users
-- Allows admins to insert users of ANY role (student, staff, parent, etc)
-- The policy only checks that the admin's school_id matches the new user's school_id
CREATE POLICY admin_insert ON public.users
    FOR INSERT
    WITH CHECK (
        public.get_auth_user_role() = 'admin' AND
        school_id = public.get_auth_user_school_id()
    );

-- 5. Create DELETE policy for admins to delete users
CREATE POLICY admin_delete ON public.users
    FOR DELETE
    USING (
        id != auth.uid() AND
        public.get_auth_user_role() = 'admin' AND
        school_id = public.get_auth_user_school_id()
    );

-- 6. Ensure helper functions are still available
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO public;
GRANT EXECUTE ON FUNCTION public.get_auth_user_school_id() TO public;

-- 7. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. Notify completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully added admin INSERT policy - admins can now create users of any role';
END $$;
