-- ============================================
-- FIX: Allow Anonymous School Lookup for Login
-- ============================================
-- Problem: Users cannot log in because the schools table RLS policy
--          only allows authenticated users to read their own school.
--          This breaks the login flow where users need to look up
--          school IDs by name before authenticating.
-- Solution: Add a policy allowing anonymous users to READ schools table
--           for lookup purposes (not for modification).
-- ============================================

-- Drop the existing overly restrictive SELECT policy if it causes issues
DROP POLICY IF EXISTS "Users see own school" ON schools;

-- Create a new policy that allows:
-- 1. Anonymous users: READ-ONLY access to all schools (for lookup during login)
-- 2. Authenticated users: Full access to their own school
CREATE POLICY "Schools readable for login and own school access"
ON schools FOR SELECT
USING (
  -- Anonymous users can read all schools (for lookup during login)
  auth.uid() IS NULL
  OR
  -- Authenticated users can read their own school only
  id = (SELECT school_id FROM users WHERE id = auth.uid())
);

-- Create INSERT policy for authenticated users registering new schools
CREATE POLICY "Authenticated users can create schools"
ON schools FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create UPDATE policy for school admins
CREATE POLICY "Admins can update their school"
ON schools FOR UPDATE
TO authenticated
USING (
  id = (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  id = (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Drop old conflicting policies that may have been created
DROP POLICY IF EXISTS "Authenticated users generate school" ON schools;
