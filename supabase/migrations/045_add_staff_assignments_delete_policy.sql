-- Add missing DELETE policy for staff_assignments
-- This is required because the UI deletes old assignments before inserting new ones

CREATE POLICY "admins_delete_assignments" ON staff_assignments
  FOR DELETE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );
