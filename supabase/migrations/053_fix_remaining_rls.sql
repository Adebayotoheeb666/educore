-- ============================================
-- FIX REMAINING RLS RECURSION
-- ============================================

-- This migration updates RLS policies for schools, financial_transactions, and audit_logs
-- to use the optimized helper functions (get_auth_user_role, get_auth_user_school_id).
-- This prevents recursion by avoiding direct subqueries to the users table.

-- 1. SCHOOLS TABLE
-- Previous policy "Users see own school" used a subquery
DROP POLICY IF EXISTS "Users see own school" ON schools;

CREATE POLICY "view_own_school"
ON schools FOR SELECT
USING (id = get_auth_user_school_id());

-- 2. FINANCIAL TRANSACTIONS
-- Previous policies used subqueries
DROP POLICY IF EXISTS "Finance staff see school transactions" ON financial_transactions;

CREATE POLICY "view_school_finance"
ON financial_transactions FOR SELECT
USING (
  school_id = get_auth_user_school_id() 
  AND get_auth_user_role() IN ('admin', 'bursar')
);

-- 3. AUDIT LOGS
-- Ensure audit logs are visible to admins without recursion
-- (Drop potentially existing policies first to be safe)
DROP POLICY IF EXISTS "Admins see all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins read school logs" ON audit_logs;

CREATE POLICY "view_school_audit_logs"
ON audit_logs FOR SELECT
USING (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() = 'admin'
);

-- 4. PARENT STUDENT LINKS (Safety measure)
-- Replacing subquery-based admin policy
DROP POLICY IF EXISTS "Admins see all parent links" ON parent_student_links;

CREATE POLICY "admin_view_all_links"
ON parent_student_links FOR SELECT
USING (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() = 'admin'
);
