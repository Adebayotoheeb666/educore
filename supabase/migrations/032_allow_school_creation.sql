-- ============================================
-- ALLOW SCHOOL CREATION
-- Fixes RLS violation during signup flow
-- ============================================

-- 1. Allow authenticated users to create a school 
-- IF they are the designated admin for that school.
CREATE POLICY "Enable insert for school admins" ON schools
    FOR INSERT
    WITH CHECK (
        auth.uid() = admin_uid
    );

-- 2. Allow users to create their own profile
-- Required for the second step of registration
CREATE POLICY "Enable insert for own profile" ON users
    FOR INSERT
    WITH CHECK (
        auth.uid() = id
    );
