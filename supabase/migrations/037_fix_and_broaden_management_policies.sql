-- ============================================
-- FIX AND BROADEN MANAGEMENT POLICIES
-- Simplify policies to avoid helper function issues and handle roles better
-- ============================================

-- 1. Subjects
DROP POLICY IF EXISTS "Admins manage subjects" ON public.subjects;
CREATE POLICY "Admins manage subjects"
ON public.subjects FOR ALL
USING (
  school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'staff', 'bursar')
)
WITH CHECK (
  school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'staff', 'bursar')
);

-- 2. Classes
DROP POLICY IF EXISTS "Admin/Staff manage Classes" ON public.classes;
CREATE POLICY "Admin/Staff manage Classes"
ON public.classes FOR ALL
USING (
  school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'staff', 'bursar')
)
WITH CHECK (
  school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'staff', 'bursar')
);

-- 3. Terms
DROP POLICY IF EXISTS "Admins manage terms" ON public.terms;
CREATE POLICY "Admins manage terms"
ON public.terms FOR ALL
USING (
  school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'staff', 'bursar')
)
WITH CHECK (
  school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'staff', 'bursar')
);

-- 4. Enrollments (student_classes)
DROP POLICY IF EXISTS "Admins manage enrollments" ON public.student_classes;
CREATE POLICY "Admins manage enrollments"
ON public.student_classes FOR ALL
USING (
  school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'staff')
)
WITH CHECK (
  school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'staff')
);
