-- ============================================
-- INVOICES TABLE - ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on invoices table (if not already)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with proper multi-child support
DROP POLICY IF EXISTS "students_see_own_invoices" ON invoices;
DROP POLICY IF EXISTS "parents_see_child_invoices" ON invoices;
DROP POLICY IF EXISTS "admins_manage_invoices" ON invoices;

-- Policy 1: Students can see their own invoices
CREATE POLICY "students_see_own_invoices" ON invoices
  FOR SELECT
  USING (student_id = auth.uid());

-- Policy 2: Parents can see invoices for their linked children
CREATE POLICY "parents_see_linked_child_invoices" ON invoices
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'parent' AND
    student_id IN (
      SELECT UNNEST(linked_students) FROM users WHERE id = auth.uid()
    ) AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Policy 3: Admins can view and manage invoices in their school
CREATE POLICY "admins_view_invoices" ON invoices
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Policy 4: Admins can create invoices
CREATE POLICY "admins_create_invoices" ON invoices
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Policy 5: Admins can update invoices (mark as paid, etc.)
CREATE POLICY "admins_update_invoices" ON invoices
  FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Policy 6: Bursar can view all invoices in their school
CREATE POLICY "bursars_view_invoices" ON invoices
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('bursar', 'admin') AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Policy 7: Bursars can update invoices
CREATE POLICY "bursars_update_invoices" ON invoices
  FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('bursar', 'admin') AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );
