-- =============================================================
-- PHASE 3A: SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================
-- This migration enables RLS on all tables and creates policies
-- to enforce multi-tenant isolation at the database level.
--
-- Benefits:
-- ✅ Database-level security (not just app-level)
-- ✅ Prevents data leakage if client code is compromised
-- ✅ Enforces school isolation automatically
-- ✅ Protects teacher-student visibility rules
-- ✅ Compliant with production standards
--
-- Deployment:
-- supabase migration up
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- SCHOOLS TABLE - Only school admin can access their school
-- =============================================================
CREATE POLICY "school_admin_access_own_school" ON schools
  FOR ALL
  USING (
    id = (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'admin' LIMIT 1
    )
  );

-- =============================================================
-- USERS TABLE - Users see only their school's users
-- =============================================================
CREATE POLICY "users_see_own_school_users" ON users
  FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "users_can_update_own_profile" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- Admin can see all users in their school
CREATE POLICY "admin_see_all_school_users" ON users
  FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'admin' LIMIT 1
    )
  );

-- =============================================================
-- CLASSES TABLE - Filtered by school_id
-- =============================================================
CREATE POLICY "classes_school_isolation" ON classes
  FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "admin_manage_classes" ON classes
  FOR ALL
  USING (
    school_id = (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'admin' LIMIT 1
    )
  );

-- =============================================================
-- SUBJECTS TABLE - Filtered by school_id
-- =============================================================
CREATE POLICY "subjects_school_isolation" ON subjects
  FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "admin_manage_subjects" ON subjects
  FOR ALL
  USING (
    school_id = (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'admin' LIMIT 1
    )
  );

-- =============================================================
-- STAFF_ASSIGNMENTS TABLE - Teachers see own assignments
-- =============================================================
CREATE POLICY "staff_see_own_assignments" ON staff_assignments
  FOR SELECT
  USING (
    staff_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "admin_manage_staff_assignments" ON staff_assignments
  FOR ALL
  USING (
    school_id = (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'admin' LIMIT 1
    )
  );

-- =============================================================
-- STUDENT_CLASSES TABLE - Complex visibility rules
-- =============================================================
CREATE POLICY "student_see_own_classes" ON student_classes
  FOR SELECT
  USING (
    student_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "teacher_see_assigned_classes" ON student_classes
  FOR SELECT
  USING (
    class_id IN (
      SELECT DISTINCT class_id FROM staff_assignments 
      WHERE staff_id = auth.uid()
    )
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "admin_manage_student_classes" ON student_classes
  FOR ALL
  USING (
    school_id = (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'admin' LIMIT 1
    )
  );

-- =============================================================
-- ATTENDANCE TABLE - Multi-role visibility
-- =============================================================
CREATE POLICY "student_see_own_attendance" ON attendance
  FOR SELECT
  USING (
    student_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "teacher_see_class_attendance" ON attendance
  FOR SELECT
  USING (
    class_id IN (
      SELECT DISTINCT class_id FROM staff_assignments 
      WHERE staff_id = auth.uid()
    )
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "parent_see_child_attendance" ON attendance
  FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM parent_student_links
      WHERE parent_ids @> ARRAY[auth.uid()::text]
    )
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "teacher_create_attendance" ON attendance
  FOR INSERT
  WITH CHECK (
    class_id IN (
      SELECT DISTINCT class_id FROM staff_assignments 
      WHERE staff_id = auth.uid()
    )
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "teacher_update_attendance" ON attendance
  FOR UPDATE
  USING (
    class_id IN (
      SELECT DISTINCT class_id FROM staff_assignments 
      WHERE staff_id = auth.uid()
    )
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- =============================================================
-- RESULTS TABLE - Multi-role visibility
-- =============================================================
CREATE POLICY "student_see_own_results" ON results
  FOR SELECT
  USING (
    student_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "teacher_see_class_results" ON results
  FOR SELECT
  USING (
    class_id IN (
      SELECT DISTINCT class_id FROM staff_assignments 
      WHERE staff_id = auth.uid()
    )
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "parent_see_child_results" ON results
  FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM parent_student_links
      WHERE parent_ids @> ARRAY[auth.uid()::text]
    )
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "teacher_manage_results" ON results
  FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    AND class_id IN (
      SELECT DISTINCT class_id FROM staff_assignments 
      WHERE staff_id = auth.uid()
    )
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "teacher_update_own_results" ON results
  FOR UPDATE
  USING (
    teacher_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- =============================================================
-- LESSONS TABLE - Teachers see own school lessons
-- =============================================================
CREATE POLICY "staff_see_school_lessons" ON lessons
  FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "staff_manage_own_lessons" ON lessons
  FOR INSERT
  WITH CHECK (
    staff_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "staff_update_own_lessons" ON lessons
  FOR UPDATE
  USING (
    staff_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- =============================================================
-- TERMS TABLE - School isolation
-- =============================================================
CREATE POLICY "terms_school_isolation" ON terms
  FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "admin_manage_terms" ON terms
  FOR ALL
  USING (
    school_id = (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'admin' LIMIT 1
    )
  );

-- =============================================================
-- NOTIFICATIONS TABLE - Users see own notifications
-- =============================================================
CREATE POLICY "users_see_own_notifications" ON notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "system_create_notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    school_id = (
      SELECT school_id FROM users WHERE id = user_id LIMIT 1
    )
  );

CREATE POLICY "users_manage_own_notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "users_delete_own_notifications" ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================
-- AUDIT_LOGS TABLE - School admins see own school logs
-- =============================================================
CREATE POLICY "admin_see_school_audit_logs" ON audit_logs
  FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'admin' LIMIT 1
    )
  );

CREATE POLICY "system_create_audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    school_id = (
      SELECT school_id FROM users WHERE id = user_id LIMIT 1
    )
  );

-- =============================================================
-- FINANCIAL_TRANSACTIONS TABLE - Multi-role access
-- =============================================================
CREATE POLICY "student_see_own_transactions" ON financial_transactions
  FOR SELECT
  USING (
    student_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "parent_see_child_transactions" ON financial_transactions
  FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM parent_student_links
      WHERE parent_ids @> ARRAY[auth.uid()::text]
    )
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "bursar_see_school_transactions" ON financial_transactions
  FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'bursar' LIMIT 1
    )
  );

CREATE POLICY "bursar_manage_transactions" ON financial_transactions
  FOR ALL
  USING (
    school_id = (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'bursar' LIMIT 1
    )
  );

-- =============================================================
-- PARENT_STUDENT_LINKS TABLE - Limited access
-- =============================================================
CREATE POLICY "parent_see_own_links" ON parent_student_links
  FOR SELECT
  USING (
    parent_ids @> ARRAY[auth.uid()::text]
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "admin_manage_parent_links" ON parent_student_links
  FOR ALL
  USING (
    school_id = (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'admin' LIMIT 1
    )
  );

-- =============================================================
-- AI_SCAN_RESULTS TABLE - Teacher access to own scans
-- =============================================================
CREATE POLICY "teacher_see_own_scans" ON ai_scan_results
  FOR SELECT
  USING (
    teacher_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "teacher_create_scans" ON ai_scan_results
  FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- =============================================================
-- MESSAGES TABLE - Parent-teacher communication
-- =============================================================
CREATE POLICY "user_see_own_messages" ON messages
  FOR SELECT
  USING (
    (sender_id = auth.uid() OR receiver_id = auth.uid())
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "user_create_messages" ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND school_id = (
      SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "user_update_own_messages" ON messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- =============================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff_id ON staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_class_id ON staff_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_teacher_id ON results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_results_class_id ON results(class_id);
CREATE INDEX IF NOT EXISTS idx_lessons_staff_id ON lessons(staff_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_student_id ON financial_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student_id ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);

-- =============================================================
-- VERIFY RLS IS ENABLED
-- =============================================================
-- Run this to verify:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- Expected output: All tables should have rowsecurity = true
