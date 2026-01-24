-- Fix for users table role constraint
-- Explicitly drop and recreate the constraint to ensure 'bursar' is included
-- This resolves the "unexpected_failure" error when creating users with 'bursar' role

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'staff', 'student', 'parent', 'bursar'));
