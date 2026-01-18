-- ============================================
-- VERIFICATION QUERIES FOR TEST SEED DATA
-- Run these queries to verify that all test data was inserted correctly
-- ============================================

-- 1. VERIFY SCHOOL
SELECT 'Schools' as check_type, COUNT(*) as count FROM schools;

-- 2. VERIFY USERS BY ROLE
SELECT 
    'Users by Role' as check_type,
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- 3. VERIFY CLASSES
SELECT 'Classes' as check_type, COUNT(*) as count FROM classes;

-- 4. VERIFY SUBJECTS
SELECT 'Subjects' as check_type, COUNT(*) as count FROM subjects;

-- 5. VERIFY STUDENT ENROLLMENTS
SELECT 
    'Student Enrollments' as check_type,
    status,
    COUNT(*) as count
FROM student_classes
GROUP BY status;

-- 6. VERIFY STAFF ASSIGNMENTS
SELECT 'Staff Assignments' as check_type, COUNT(*) as count FROM staff_assignments;

-- 7. VERIFY PARENT-STUDENT LINKS
SELECT 'Parent-Student Links' as check_type, COUNT(*) as count FROM parent_student_links;

-- 8. VERIFY ATTENDANCE RECORDS
SELECT 
    'Attendance Records' as check_type,
    status,
    COUNT(*) as count
FROM attendance
GROUP BY status;

-- 9. VERIFY ACADEMIC RESULTS
SELECT 'Academic Results' as check_type, COUNT(*) as count FROM results;

-- 10. VERIFY INVOICES BY STATUS
SELECT 
    'Invoices' as check_type,
    status,
    COUNT(*) as count,
    ROUND(SUM(amount)::numeric, 2) as total_amount
FROM invoices
GROUP BY status;

-- 11. VERIFY FINANCIAL TRANSACTIONS
SELECT 
    'Financial Transactions' as check_type,
    type,
    COUNT(*) as count,
    ROUND(SUM(amount)::numeric, 2) as total_amount
FROM financial_transactions
GROUP BY type;

-- 12. VERIFY PARENT WALLETS
SELECT 
    'Parent Wallets' as check_type,
    COUNT(*) as count,
    ROUND(SUM(balance)::numeric, 2) as total_balance
FROM parent_wallets;

-- 13. VERIFY WALLET TRANSACTIONS
SELECT 
    'Wallet Transactions' as check_type,
    type,
    COUNT(*) as count,
    ROUND(SUM(amount)::numeric, 2) as total_amount
FROM wallet_transactions
GROUP BY type;

-- 14. VERIFY MESSAGES
SELECT 
    'Messages' as check_type,
    CASE WHEN read THEN 'Read' ELSE 'Unread' END as read_status,
    COUNT(*) as count
FROM messages
GROUP BY read;

-- 15. VERIFY NOTIFICATIONS
SELECT 
    'Notifications' as check_type,
    type,
    COUNT(*) as count
FROM notifications
GROUP BY type;

-- 16. VERIFY LESSONS
SELECT 
    'Lessons' as check_type,
    generated_by,
    COUNT(*) as count
FROM lessons
GROUP BY generated_by;

-- 17. VERIFY AUDIT LOGS
SELECT 
    'Audit Logs' as check_type,
    action,
    COUNT(*) as count
FROM audit_logs
GROUP BY action;

-- 18. VERIFY TERMS
SELECT 
    'Terms' as check_type,
    name,
    is_active,
    COUNT(*) as count
FROM terms
GROUP BY name, is_active;

-- 19. SUMMARY STATISTICS
SELECT 
    'SUMMARY' as check_type,
    (SELECT COUNT(*) FROM schools)::text as schools,
    (SELECT COUNT(*) FROM users)::text as users,
    (SELECT COUNT(*) FROM students_classes)::text as enrollments,
    (SELECT COUNT(*) FROM results)::text as results,
    (SELECT COUNT(*) FROM attendance)::text as attendance_records,
    (SELECT COUNT(*) FROM invoices)::text as invoices,
    (SELECT COUNT(*) FROM messages)::text as messages,
    (SELECT COUNT(*) FROM notifications)::text as notifications;

-- 20. CHECK FOR RLS POLICIES
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 21. SHOW ALL TABLES WITH RLS STATUS
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'Enabled'
        ELSE 'Disabled'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
