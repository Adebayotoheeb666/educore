-- ============================================
-- FIX RLS INFINITE RECURSION (PART 2)
-- Drop the persistent recursive policy found in pg_policies
-- ============================================

-- This policy was likely created by an earlier migration (001 or 002) 
-- and is redundant/conflicting with the new "Admins see all school users" policy.
DROP POLICY IF EXISTS "School Isolation for Users" ON users;
