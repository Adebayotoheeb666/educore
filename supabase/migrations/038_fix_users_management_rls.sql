-- ============================================
-- ALLOW ADMINS TO MANAGE USERS (EDIT/DELETE)
-- ============================================

-- 1. Allow admins to update users in their school
DROP POLICY IF EXISTS "Admins update school users" ON public.users;
CREATE POLICY "Admins update school users"
ON public.users FOR UPDATE
USING (
  school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
  AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
  AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 2. Allow admins to delete users in their school
DROP POLICY IF EXISTS "Admins delete school users" ON public.users;
CREATE POLICY "Admins delete school users"
ON public.users FOR DELETE
USING (
  school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
  AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  AND id != auth.uid() -- Prevent admins from deleting themselves accidentally
);
