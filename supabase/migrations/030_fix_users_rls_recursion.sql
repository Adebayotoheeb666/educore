-- ============================================
-- FIX RLS INFINITE RECURSION
-- Replace recursive policies with security definer functions
-- ============================================

-- 1. Create Security Definer Function to get User Role
-- This bypasses RLS to safely fetch the role
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Security Definer Function to get User School ID
-- This bypasses RLS to safely fetch the school_id
CREATE OR REPLACE FUNCTION get_auth_user_school_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT school_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop Recursive Policies
DROP POLICY IF EXISTS "Admins see all school users" ON users;
DROP POLICY IF EXISTS "Staff see school staff" ON users;
DROP POLICY IF EXISTS "Users see only themselves" ON users;

-- 4. Re-create Policies using Helper Functions
CREATE POLICY "Users see only themselves"
ON users FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Admins see all school users"
ON users FOR SELECT
USING (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() = 'admin'
);

CREATE POLICY "Staff see school staff"
ON users FOR SELECT
USING (
  school_id = get_auth_user_school_id()
  AND get_auth_user_role() IN ('staff', 'admin')
);
