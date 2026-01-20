-- ============================================
-- FIX UUID CASTING ERRORS
-- Ensure that auth.uid() (UUID) is compared as text when hitting the users table
-- ============================================

-- 1. Update Helper Functions to be more robust with casting
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id::text = auth.uid()::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_user_school_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT school_id FROM users WHERE id::text = auth.uid()::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update recent policies in Migration 037 & 038 to use robust casting
-- (Specifically targeting policies on public.users where id comparison happens)

DROP POLICY IF EXISTS "Admins update school users" ON public.users;
CREATE POLICY "Admins update school users"
ON public.users FOR UPDATE
USING (
  school_id = (SELECT school_id FROM public.users WHERE id::text = auth.uid()::text)
  AND (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin'
)
WITH CHECK (
  school_id = (SELECT school_id FROM public.users WHERE id::text = auth.uid()::text)
  AND (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin'
);

DROP POLICY IF EXISTS "Admins delete school users" ON public.users;
CREATE POLICY "Admins delete school users"
ON public.users FOR DELETE
USING (
  school_id = (SELECT school_id FROM public.users WHERE id::text = auth.uid()::text)
  AND (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin'
  AND id::text != auth.uid()::text
);
