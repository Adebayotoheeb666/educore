-- ============================================
-- PHASE 1: SECURITY HARDENING - RLS POLICIES
-- ============================================
-- This migration enables Row Level Security (RLS) on all tables
-- to enforce multi-tenant data isolation at the database level.
--
-- IMPORTANT: Run this migration on your Supabase project at:
-- https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql
--
-- After running, verify in the "Authentication" tab that RLS is enabled
-- on all tables listed below.
-- ============================================

-- ============================================
-- 1. SCHOOLS TABLE
-- ============================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- School admins can see their own school
CREATE POLICY "school_admins_see_own_school" ON schools
  FOR SELECT
  USING (admin_uid = auth.uid());

-- Allow authenticated users to see their school
CREATE POLICY "users_see_their_school" ON schools
  FOR SELECT
  USING (
    id IN (
      SELECT school_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- 2. USERS TABLE (Critical - Core isolation)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can see their own profile
CREATE POLICY "users_see_own_profile" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Users can see others in their school
CREATE POLICY "users_see_school_members" ON users
  FOR SELECT
  USING (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Users can only update their own profile
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Admins can insert new users within their school
CREATE POLICY "admins_create_users" ON users
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Admins can update users in their school
CREATE POLICY "admins_update_users" ON users
  FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Admins can delete users in their school
CREATE POLICY "admins_delete_users" ON users
  FOR DELETE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 3. CLASSES TABLE
-- ============================================
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Users can see classes in their school
CREATE POLICY "users_see_school_classes" ON classes
  FOR SELECT
  USING (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Admins can create classes
CREATE POLICY "admins_create_classes" ON classes
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Admins can update classes in their school
CREATE POLICY "admins_update_classes" ON classes
  FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 4. SUBJECTS TABLE
-- ============================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Users can see subjects in their school
CREATE POLICY "users_see_school_subjects" ON subjects
  FOR SELECT
  USING (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Admins can manage subjects
CREATE POLICY "admins_manage_subjects" ON subjects
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 5. STAFF ASSIGNMENTS TABLE
-- ============================================
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;

-- Users can see staff assignments in their school
CREATE POLICY "users_see_school_assignments" ON staff_assignments
  FOR SELECT
  USING (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Admins can manage assignments
CREATE POLICY "admins_manage_assignments" ON staff_assignments
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 6. STUDENT_CLASSES TABLE
-- ============================================
ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;

-- Users can see enrollments in their school
CREATE POLICY "users_see_school_enrollments" ON student_classes
  FOR SELECT
  USING (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Staff can see students they teach
CREATE POLICY "staff_see_assigned_students" ON student_classes
  FOR SELECT
  USING (
    class_id IN (
      SELECT DISTINCT sa.class_id FROM staff_assignments sa
      WHERE sa.staff_id = auth.uid()
    )
  );

-- Admins can manage enrollments
CREATE POLICY "admins_manage_enrollments" ON student_classes
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 7. ATTENDANCE TABLE
-- ============================================
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Students can see their own attendance
CREATE POLICY "students_see_own_attendance" ON attendance
  FOR SELECT
  USING (
    student_id = auth.uid()
  );

-- Teachers can see attendance for their classes
CREATE POLICY "staff_see_class_attendance" ON attendance
  FOR SELECT
  USING (
    class_id IN (
      SELECT DISTINCT sa.class_id FROM staff_assignments sa
      WHERE sa.staff_id = auth.uid()
    )
  );

-- Parents can see their child's attendance
CREATE POLICY "parents_see_child_attendance" ON attendance
  FOR SELECT
  USING (
    student_id IN (
      SELECT DISTINCT ps.student_id FROM parent_student_links ps
      WHERE ps.parent_ids @> ARRAY[auth.uid()::text]
    )
  );

-- Admins can see all attendance in their school
CREATE POLICY "admins_see_school_attendance" ON attendance
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Teachers can record attendance for their classes
CREATE POLICY "staff_create_attendance" ON attendance
  FOR INSERT
  WITH CHECK (
    class_id IN (
      SELECT DISTINCT sa.class_id FROM staff_assignments sa
      WHERE sa.staff_id = auth.uid()
    ) AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 8. RESULTS/EXAM_RESULTS TABLE
-- ============================================
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Students can see their own results
CREATE POLICY "students_see_own_results" ON results
  FOR SELECT
  USING (
    student_id = auth.uid()
  );

-- Teachers can see results for their students
CREATE POLICY "staff_see_class_results" ON results
  FOR SELECT
  USING (
    class_id IN (
      SELECT DISTINCT sa.class_id FROM staff_assignments sa
      WHERE sa.staff_id = auth.uid()
    )
  );

-- Parents can see their child's results
CREATE POLICY "parents_see_child_results" ON results
  FOR SELECT
  USING (
    student_id IN (
      SELECT DISTINCT ps.student_id FROM parent_student_links ps
      WHERE ps.parent_ids @> ARRAY[auth.uid()::text]
    )
  );

-- Admins can see all results
CREATE POLICY "admins_see_school_results" ON results
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Teachers can record results
CREATE POLICY "staff_create_results" ON results
  FOR INSERT
  WITH CHECK (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid()) AND
    teacher_id = auth.uid()
  );

-- ============================================
-- 9. LESSONS TABLE
-- ============================================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Teachers can see their own lessons
CREATE POLICY "staff_see_own_lessons" ON lessons
  FOR SELECT
  USING (
    staff_id = auth.uid()
  );

-- Teachers in same school can see each other's lessons
CREATE POLICY "staff_see_school_lessons" ON lessons
  FOR SELECT
  USING (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Teachers can create lessons
CREATE POLICY "staff_create_lessons" ON lessons
  FOR INSERT
  WITH CHECK (
    staff_id = auth.uid() AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 10. NOTIFICATIONS TABLE
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can see their own notifications
CREATE POLICY "users_see_own_notifications" ON notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- System can create notifications
CREATE POLICY "system_create_notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- 11. AUDIT_LOGS TABLE (Write-only from app)
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can see audit logs for their school (admins only)
CREATE POLICY "admins_see_audit_logs" ON audit_logs
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Authenticated users can create audit logs (for their school)
CREATE POLICY "users_create_audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 12. FINANCIAL_TRANSACTIONS TABLE
-- ============================================
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Students/parents can see their own transactions
CREATE POLICY "users_see_own_transactions" ON financial_transactions
  FOR SELECT
  USING (
    student_id = auth.uid() OR 
    parent_id = auth.uid()
  );

-- Parents can see child's transactions
CREATE POLICY "parents_see_child_transactions" ON financial_transactions
  FOR SELECT
  USING (
    student_id IN (
      SELECT DISTINCT ps.student_id FROM parent_student_links ps
      WHERE ps.parent_ids @> ARRAY[auth.uid()::text]
    )
  );

-- Admins/bursars can see school transactions
CREATE POLICY "admins_see_school_transactions" ON financial_transactions
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'bursar') AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Admins can create transactions
CREATE POLICY "admins_create_transactions" ON financial_transactions
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'bursar') AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 13. PARENT_STUDENT_LINKS TABLE
-- ============================================
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- Parents can see their own links
CREATE POLICY "parents_see_own_links" ON parent_student_links
  FOR SELECT
  USING (
    parent_ids @> ARRAY[auth.uid()::text]
  );

-- Students can see their parent links
CREATE POLICY "students_see_own_links" ON parent_student_links
  FOR SELECT
  USING (
    student_id = auth.uid()
  );

-- Admins can manage links
CREATE POLICY "admins_manage_links" ON parent_student_links
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 14. AI_SCAN_RESULTS TABLE
-- ============================================
ALTER TABLE ai_scan_results ENABLE ROW LEVEL SECURITY;

-- Teachers can see their own scans
CREATE POLICY "staff_see_own_scans" ON ai_scan_results
  FOR SELECT
  USING (
    teacher_id = auth.uid()
  );

-- Teachers can see scans for their students
CREATE POLICY "staff_see_class_scans" ON ai_scan_results
  FOR SELECT
  USING (
    student_id IN (
      SELECT DISTINCT sc.student_id FROM student_classes sc
      WHERE sc.class_id IN (
        SELECT DISTINCT sa.class_id FROM staff_assignments sa
        WHERE sa.staff_id = auth.uid()
      )
    )
  );

-- Teachers can create scans
CREATE POLICY "staff_create_scans" ON ai_scan_results
  FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
  );

-- ============================================
-- 15. TERMS TABLE
-- ============================================
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

-- Users can see terms for their school
CREATE POLICY "users_see_school_terms" ON terms
  FOR SELECT
  USING (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Admins can manage terms
CREATE POLICY "admins_manage_terms" ON terms
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- IMPORTANT NOTES FOR DEPLOYMENT
-- ============================================
-- 1. Test thoroughly in a staging environment first
-- 2. Monitor application logs for RLS permission errors
-- 3. Update any custom Supabase functions to use service role
-- 4. Consider running "vacuum analyze" after deployment for performance
-- 5. Verify all queries still work with RLS enabled
-- 6. Document any exceptions needed for future features
