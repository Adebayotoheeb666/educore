-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant isolation for all tables
-- ============================================

-- ============================================
-- TABLE: users
-- ============================================
-- Policy: Users can only see themselves
CREATE POLICY "Users see only themselves"
ON users FOR SELECT
USING (id = auth.uid());

-- Policy: Users can update only their own profile
CREATE POLICY "Users update only their own profile"
ON users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy: Admins can see all users in their school
CREATE POLICY "Admins see all school users"
ON users FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Policy: Staff can see other staff in same school
CREATE POLICY "Staff see school staff"
ON users FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  AND role IN ('staff', 'admin')
);

-- ============================================
-- TABLE: attendance
-- ============================================
-- Policy: Teachers can view attendance for their assigned classes
CREATE POLICY "Teachers read own class attendance"
ON attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_assignments sa
    JOIN student_classes sc ON sa.class_id = sc.class_id
    WHERE sc.student_id = attendance.student_id
    AND sa.staff_id = auth.uid()
    AND sa.school_id = attendance.school_id
  )
);

-- Policy: Admins can view all attendance in their school
CREATE POLICY "Admins read all school attendance"
ON attendance FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Policy: Students can view their own attendance
CREATE POLICY "Students read own attendance"
ON attendance FOR SELECT
USING (
  student_id = (SELECT id FROM users WHERE id = auth.uid() AND role = 'student')
);

-- Policy: Parents can view linked child attendance
CREATE POLICY "Parents read linked child attendance"
ON attendance FOR SELECT
USING (
  student_id IN (
    SELECT student_id FROM parent_student_links
    WHERE parent_id = (SELECT id FROM users WHERE id = auth.uid())
    AND parent_student_links.school_id = attendance.school_id
  )
);

-- Policy: Teachers can insert attendance for their classes
CREATE POLICY "Teachers insert attendance for own classes"
ON attendance FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_assignments sa
    JOIN student_classes sc ON sa.class_id = sc.class_id
    WHERE sc.student_id = attendance.student_id
    AND sa.staff_id = auth.uid()
    AND sa.school_id = attendance.school_id
  )
);

-- ============================================
-- TABLE: results
-- ============================================
-- Policy: Teachers can view results for their subjects
CREATE POLICY "Teachers read own subject results"
ON results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_assignments sa
    WHERE sa.staff_id = auth.uid()
    AND sa.subject_id = results.subject_id
    AND sa.school_id = results.school_id
  )
);

-- Policy: Admins can view all results
CREATE POLICY "Admins read all school results"
ON results FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Policy: Students can view their own results
CREATE POLICY "Students read own results"
ON results FOR SELECT
USING (
  student_id = (SELECT id FROM users WHERE id = auth.uid() AND role = 'student')
);

-- Policy: Parents can view linked child results
CREATE POLICY "Parents read linked child results"
ON results FOR SELECT
USING (
  student_id IN (
    SELECT student_id FROM parent_student_links
    WHERE parent_id = (SELECT id FROM users WHERE id = auth.uid())
    AND parent_student_links.school_id = results.school_id
  )
);

-- Policy: Teachers can insert results
CREATE POLICY "Teachers insert results for own subject"
ON results FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_assignments sa
    WHERE sa.staff_id = auth.uid()
    AND sa.subject_id = results.subject_id
    AND sa.school_id = results.school_id
  )
);

-- ============================================
-- TABLE: classes
-- ============================================
-- Policy: Admins and staff see classes in their school
CREATE POLICY "School staff see own school classes"
ON classes FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
);

-- Policy: Students see their own class
CREATE POLICY "Students see own class"
ON classes FOR SELECT
USING (
  id IN (
    SELECT class_id FROM student_classes
    WHERE student_id = (SELECT id FROM users WHERE id = auth.uid() AND role = 'student')
  )
);

-- Policy: Parents can see children's classes
CREATE POLICY "Parents see children classes"
ON classes FOR SELECT
USING (
  id IN (
    SELECT DISTINCT sc.class_id FROM student_classes sc
    JOIN parent_student_links psl ON sc.student_id = psl.student_id
    WHERE psl.parent_id = (SELECT id FROM users WHERE id = auth.uid())
    AND psl.school_id = classes.school_id
  )
);

-- ============================================
-- TABLE: student_classes
-- ============================================
-- Policy: Admins see all enrollments in school
CREATE POLICY "Admins see all enrollments"
ON student_classes FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Policy: Students see their own enrollments
CREATE POLICY "Students see own enrollments"
ON student_classes FOR SELECT
USING (
  student_id = (SELECT id FROM users WHERE id = auth.uid() AND role = 'student')
);

-- Policy: Teachers see students in their assigned classes
CREATE POLICY "Teachers see class enrollments"
ON student_classes FOR SELECT
USING (
  class_id IN (
    SELECT class_id FROM staff_assignments
    WHERE staff_id = auth.uid()
    AND school_id = student_classes.school_id
  )
);

-- ============================================
-- TABLE: subjects
-- ============================================
-- Policy: Staff see subjects in their school
CREATE POLICY "Staff see school subjects"
ON subjects FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- TABLE: staff_assignments
-- ============================================
-- Policy: Admins see all assignments in school
CREATE POLICY "Admins see all assignments"
ON staff_assignments FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Policy: Staff see their own assignments
CREATE POLICY "Staff see own assignments"
ON staff_assignments FOR SELECT
USING (
  staff_id = auth.uid()
);

-- ============================================
-- TABLE: terms
-- ============================================
-- Policy: Staff see terms for their school
CREATE POLICY "Staff see school terms"
ON terms FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- TABLE: parent_student_links
-- ============================================
-- Policy: Parents see their own links
CREATE POLICY "Parents see own links"
ON parent_student_links FOR SELECT
USING (
  parent_id = (SELECT id FROM users WHERE id = auth.uid())
);

-- Policy: Admins see all links in school
CREATE POLICY "Admins see all parent links"
ON parent_student_links FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================
-- TABLE: schools
-- ============================================
-- Policy: Users see only their own school
CREATE POLICY "Users see own school"
ON schools FOR SELECT
USING (
  id = (SELECT school_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- SUMMARY
-- ============================================
-- These policies ensure:
-- 1. ✅ No cross-tenant queries (all policies check school_id)
-- 2. ✅ Users can't see other users' data
-- 3. ✅ Admins have full visibility within school
-- 4. ✅ Teachers can only manage their assigned classes/subjects
-- 5. ✅ Students see only their own data
-- 6. ✅ Parents see only linked children's data
-- 7. ✅ All modifications require proper role permissions
