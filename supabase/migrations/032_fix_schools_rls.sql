-- ============================================
-- FIX SCHOOLS RLS POLICY
-- Allow authenticated users to create (INSERT) new schools
-- ============================================

-- Drop existing restrictive INSERT policy if it exists (or just create a new one)
DROP POLICY IF EXISTS "Authenticated users generate school" ON schools;

-- Create policy to allow any authenticated user to create a school
-- This is necessary for the initial registration flow
CREATE POLICY "Authenticated users generate school"
ON schools FOR INSERT
TO authenticated
WITH CHECK (true);
