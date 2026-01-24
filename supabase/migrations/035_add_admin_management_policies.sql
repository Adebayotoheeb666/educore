-- Add management policies for Admins on core tables
-- This fixes the issue where "Create Subject", "Create Term", etc. would fail due to RLS.

-- 1. Subjects
CREATE POLICY "Admins manage subjects"
ON public.subjects FOR ALL
USING (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() = 'admin'
)
WITH CHECK (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() = 'admin'
);

-- 2. Terms
CREATE POLICY "Admins manage terms"
ON public.terms FOR ALL
USING (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() = 'admin'
)
WITH CHECK (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() = 'admin'
);

-- 3. Student Classes (Enrollment)
CREATE POLICY "Admins manage student_classes"
ON public.student_classes FOR ALL
USING (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() = 'admin'
)
WITH CHECK (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() = 'admin'
);

-- 4. Classes (Ensure ALL policy is robust)
DROP POLICY IF EXISTS "Admin/Staff manage Classes" ON classes;
CREATE POLICY "Admin/Staff manage Classes"
ON public.classes FOR ALL
USING (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() IN ('admin', 'staff')
)
WITH CHECK (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() IN ('admin', 'staff')
);
