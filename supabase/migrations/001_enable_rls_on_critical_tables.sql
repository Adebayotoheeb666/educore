-- ============================================
-- CRITICAL SECURITY: Enable RLS on all tables
-- ============================================
-- This migration MUST be run before adding RLS policies
-- Status: CRITICAL - Without RLS, cross-tenant queries are possible

-- 1. Enable RLS on attendance table
ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on results table
ALTER TABLE IF EXISTS results ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on classes table
ALTER TABLE IF EXISTS classes ENABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on student_classes table
ALTER TABLE IF EXISTS student_classes ENABLE ROW LEVEL SECURITY;

-- 5. Enable RLS on subjects table
ALTER TABLE IF EXISTS subjects ENABLE ROW LEVEL SECURITY;

-- 6. Enable RLS on staff_assignments table
ALTER TABLE IF EXISTS staff_assignments ENABLE ROW LEVEL SECURITY;

-- 7. Enable RLS on grades table (if exists)
ALTER TABLE IF EXISTS grades ENABLE ROW LEVEL SECURITY;

-- 8. Enable RLS on terms table
ALTER TABLE IF EXISTS terms ENABLE ROW LEVEL SECURITY;

-- 9. Enable RLS on financial_transactions table
ALTER TABLE IF EXISTS financial_transactions ENABLE ROW LEVEL SECURITY;

-- 10. Enable RLS on invoices table
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;

-- 11. Enable RLS on messages table (already has policies from implementation summary)
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;

-- 12. Enable RLS on users table (critical!)
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

-- 13. Enable RLS on schools table
ALTER TABLE IF EXISTS schools ENABLE ROW LEVEL SECURITY;

-- 14. Enable RLS on parent_student_links table
ALTER TABLE IF EXISTS parent_student_links ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
-- Run this query to verify:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%';
