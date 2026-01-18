-- ============================================
-- COMPREHENSIVE TEST SEED DATA
-- Legacy International School - Full Environment
-- This migration populates realistic test data across all tables
-- ============================================

DO $$
DECLARE
    -- School IDs
    v_school_id UUID := 'e1d2c3b4-a5f6-4a5b-8c7d-9e0f1a2b3c4d';
    
    -- Admin
    v_admin_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    
    -- Staff (Teachers)
    v_staff1_id UUID := 'f1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_staff2_id UUID := 'f2b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_staff3_id UUID := 'f3b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    
    -- Bursar
    v_bursar_id UUID := 'f4b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    
    -- Students
    v_student1_id UUID := '01b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_student2_id UUID := '02b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_student3_id UUID := '03b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_student4_id UUID := '04b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_student5_id UUID := '05b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    
    -- Parents
    v_parent1_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4e';
    v_parent2_id UUID := 'a2b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4e';
    v_parent3_id UUID := 'a3b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4e';
    
    -- Classes
    v_class1_id UUID := 'c1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4f';
    v_class2_id UUID := 'c2b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4f';
    v_class3_id UUID := 'c3b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4f';
    
    -- Subjects
    v_subject1_id UUID := 'b1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_subject2_id UUID := 'b2b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_subject3_id UUID := 'b3b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_subject4_id UUID := 'b4b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    
    -- Terms
    v_term1_id UUID := 'd1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_term2_id UUID := 'd2b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_term3_id UUID := 'd3b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
BEGIN
    RAISE NOTICE 'Starting comprehensive seed data population...';

    -- ============================================
    -- 1. SEED SCHOOL
    -- ============================================
    INSERT INTO schools (id, name, address, phone, contact_email, website, logo)
    VALUES (v_school_id, 'Legacy International School', '12 Education Way, Ikeja, Lagos', '+234 801 234 5678', 'admin@legacyintl.edu.ng', 'https://legacyintl.edu.ng', 'https://via.placeholder.com/200x100?text=Legacy+Intl')
    ON CONFLICT (id) DO NOTHING;

    -- ============================================
    -- 2. SEED AUTH USERS (Create public.users entries only)
    -- Note: auth.users are managed by Supabase and should be created via API
    -- ============================================
    
    -- Admin
    INSERT INTO users (id, full_name, email, role, school_id, phone_number)
    VALUES (v_admin_id, 'Chief Administrator', 'admin@legacyintl.edu.ng', 'admin', v_school_id, '+234 801 111 1111')
    ON CONFLICT (id) DO NOTHING;

    -- Staff/Teachers
    INSERT INTO users (id, full_name, email, role, school_id, staff_id, phone_number)
    VALUES (v_staff1_id, 'Mr. Adebayo Toheeb', 'staff1@legacyintl.edu.ng', 'staff', v_school_id, 'STAFF/2026/001', '+234 802 222 2222')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO users (id, full_name, email, role, school_id, staff_id, phone_number)
    VALUES (v_staff2_id, 'Mrs. Patrick Oladipupo', 'staff2@legacyintl.edu.ng', 'staff', v_school_id, 'STAFF/2026/002', '+234 803 333 3333')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO users (id, full_name, email, role, school_id, staff_id, phone_number)
    VALUES (v_staff3_id, 'Dr. Chioma Njoku', 'staff3@legacyintl.edu.ng', 'staff', v_school_id, 'STAFF/2026/003', '+234 804 444 4444')
    ON CONFLICT (id) DO NOTHING;

    -- Bursar
    INSERT INTO users (id, full_name, email, role, school_id, staff_id, phone_number)
    VALUES (v_bursar_id, 'Mr. Segun Adeyemi', 'bursar@legacyintl.edu.ng', 'bursar', v_school_id, 'STAFF/2026/004', '+234 805 555 5555')
    ON CONFLICT (id) DO NOTHING;

    -- Students
    INSERT INTO users (id, full_name, email, role, school_id, admission_number, phone_number)
    VALUES (v_student1_id, 'John Doe', 'student1@legacyintl.edu.ng', 'student', v_school_id, 'STUD/2026/001', '+234 706 111 1111')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO users (id, full_name, email, role, school_id, admission_number, phone_number)
    VALUES (v_student2_id, 'Jane Smith', 'student2@legacyintl.edu.ng', 'student', v_school_id, 'STUD/2026/002', '+234 707 222 2222')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO users (id, full_name, email, role, school_id, admission_number, phone_number)
    VALUES (v_student3_id, 'Chidi Obi', 'student3@legacyintl.edu.ng', 'student', v_school_id, 'STUD/2026/003', '+234 708 333 3333')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO users (id, full_name, email, role, school_id, admission_number, phone_number)
    VALUES (v_student4_id, 'Amara Eze', 'student4@legacyintl.edu.ng', 'student', v_school_id, 'STUD/2026/004', '+234 709 444 4444')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO users (id, full_name, email, role, school_id, admission_number, phone_number)
    VALUES (v_student5_id, 'Tunde Alabi', 'student5@legacyintl.edu.ng', 'student', v_school_id, 'STUD/2026/005', '+234 710 555 5555')
    ON CONFLICT (id) DO NOTHING;

    -- Parents
    INSERT INTO users (id, full_name, email, role, school_id, phone_number, linked_students)
    VALUES (v_parent1_id, 'Mr. James Doe', 'parent1@legacyintl.edu.ng', 'parent', v_school_id, '+234 811 111 1111', ARRAY[v_student1_id::text, v_student2_id::text])
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO users (id, full_name, email, role, school_id, phone_number, linked_students)
    VALUES (v_parent2_id, 'Mrs. Ngozi Obi', 'parent2@legacyintl.edu.ng', 'parent', v_school_id, '+234 812 222 2222', ARRAY[v_student3_id::text])
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO users (id, full_name, email, role, school_id, phone_number, linked_students)
    VALUES (v_parent3_id, 'Mr. Bade Alabi', 'parent3@legacyintl.edu.ng', 'parent', v_school_id, '+234 813 333 3333', ARRAY[v_student4_id::text, v_student5_id::text])
    ON CONFLICT (id) DO NOTHING;

    -- ============================================
    -- 3. SEED TERMS
    -- ============================================
    INSERT INTO terms (id, school_id, name, start_date, end_date, is_active, grade_scale)
    VALUES (v_term1_id, v_school_id, 'First Term 2025/2026', '2025-09-01'::date, '2025-12-15'::date, true, 
        '{"A": {"min": 80, "max": 100}, "B": {"min": 70, "max": 79}, "C": {"min": 60, "max": 69}, "D": {"min": 50, "max": 59}, "F": {"min": 0, "max": 49}}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO terms (id, school_id, name, start_date, end_date, is_active)
    VALUES (v_term2_id, v_school_id, 'Second Term 2025/2026', '2026-01-12'::date, '2026-04-15'::date, false)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO terms (id, school_id, name, start_date, end_date, is_active)
    VALUES (v_term3_id, v_school_id, 'Third Term 2025/2026', '2026-05-01'::date, '2026-07-31'::date, false)
    ON CONFLICT (id) DO NOTHING;

    -- ============================================
    -- 4. SEED CLASSES
    -- ============================================
    INSERT INTO classes (id, school_id, name, level, class_teacher_id, capacity)
    VALUES (v_class1_id, v_school_id, 'SS1A', 'Secondary 1', v_staff1_id, 45)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO classes (id, school_id, name, level, class_teacher_id, capacity)
    VALUES (v_class2_id, v_school_id, 'SS2A', 'Secondary 2', v_staff2_id, 40)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO classes (id, school_id, name, level, class_teacher_id, capacity)
    VALUES (v_class3_id, v_school_id, 'SS3A', 'Secondary 3', v_staff3_id, 35)
    ON CONFLICT (id) DO NOTHING;

    -- ============================================
    -- 5. SEED SUBJECTS
    -- ============================================
    INSERT INTO subjects (id, school_id, name, code, description)
    VALUES (v_subject1_id, v_school_id, 'Mathematics', 'MTH101', 'Pure and applied mathematics')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO subjects (id, school_id, name, code, description)
    VALUES (v_subject2_id, v_school_id, 'English Language', 'ENG101', 'English communication and literature')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO subjects (id, school_id, name, code, description)
    VALUES (v_subject3_id, v_school_id, 'Physics', 'PHY101', 'Physics and practical experiments')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO subjects (id, school_id, name, code, description)
    VALUES (v_subject4_id, v_school_id, 'Chemistry', 'CHM101', 'Chemistry and laboratory work')
    ON CONFLICT (id) DO NOTHING;

    -- ============================================
    -- 6. SEED STUDENT ENROLLMENTS
    -- ============================================
    INSERT INTO student_classes (school_id, student_id, class_id, enrollment_date, status)
    VALUES (v_school_id, v_student1_id, v_class1_id, '2025-09-01'::date, 'active')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO student_classes (school_id, student_id, class_id, enrollment_date, status)
    VALUES (v_school_id, v_student2_id, v_class1_id, '2025-09-01'::date, 'active')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO student_classes (school_id, student_id, class_id, enrollment_date, status)
    VALUES (v_school_id, v_student3_id, v_class2_id, '2025-09-01'::date, 'active')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO student_classes (school_id, student_id, class_id, enrollment_date, status)
    VALUES (v_school_id, v_student4_id, v_class2_id, '2025-09-01'::date, 'active')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO student_classes (school_id, student_id, class_id, enrollment_date, status)
    VALUES (v_school_id, v_student5_id, v_class3_id, '2025-09-01'::date, 'active')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- 7. SEED STAFF ASSIGNMENTS (Teacher-Class-Subject mappings)
    -- ============================================
    INSERT INTO staff_assignments (school_id, staff_id, class_id, subject_id, start_date)
    VALUES (v_school_id, v_staff1_id, v_class1_id, v_subject1_id, '2025-09-01'::date)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO staff_assignments (school_id, staff_id, class_id, subject_id, start_date)
    VALUES (v_school_id, v_staff2_id, v_class1_id, v_subject2_id, '2025-09-01'::date)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO staff_assignments (school_id, staff_id, class_id, subject_id, start_date)
    VALUES (v_school_id, v_staff3_id, v_class2_id, v_subject3_id, '2025-09-01'::date)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO staff_assignments (school_id, staff_id, class_id, subject_id, start_date)
    VALUES (v_school_id, v_staff1_id, v_class2_id, v_subject1_id, '2025-09-01'::date)
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- 8. SEED PARENT-STUDENT LINKS
    -- ============================================
    INSERT INTO parent_student_links (school_id, student_id, parent_id, relationship)
    VALUES (v_school_id, v_student1_id, v_parent1_id, 'Father')
    ON CONFLICT (student_id, parent_id) DO NOTHING;
    
    INSERT INTO parent_student_links (school_id, student_id, parent_id, relationship)
    VALUES (v_school_id, v_student2_id, v_parent1_id, 'Father')
    ON CONFLICT (student_id, parent_id) DO NOTHING;
    
    INSERT INTO parent_student_links (school_id, student_id, parent_id, relationship)
    VALUES (v_school_id, v_student3_id, v_parent2_id, 'Mother')
    ON CONFLICT (student_id, parent_id) DO NOTHING;
    
    INSERT INTO parent_student_links (school_id, student_id, parent_id, relationship)
    VALUES (v_school_id, v_student4_id, v_parent3_id, 'Father')
    ON CONFLICT (student_id, parent_id) DO NOTHING;
    
    INSERT INTO parent_student_links (school_id, student_id, parent_id, relationship)
    VALUES (v_school_id, v_student5_id, v_parent3_id, 'Father')
    ON CONFLICT (student_id, parent_id) DO NOTHING;

    -- ============================================
    -- 9. SEED ATTENDANCE RECORDS
    -- ============================================
    INSERT INTO attendance (school_id, student_id, class_id, teacher_id, date, status, remarks)
    VALUES (v_school_id, v_student1_id, v_class1_id, v_staff1_id, CURRENT_DATE - INTERVAL '1 day', 'present', NULL)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO attendance (school_id, student_id, class_id, teacher_id, date, status, remarks)
    VALUES (v_school_id, v_student2_id, v_class1_id, v_staff1_id, CURRENT_DATE - INTERVAL '1 day', 'present', NULL)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO attendance (school_id, student_id, class_id, teacher_id, date, status, remarks)
    VALUES (v_school_id, v_student3_id, v_class2_id, v_staff2_id, CURRENT_DATE - INTERVAL '1 day', 'late', 'Traffic delay')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO attendance (school_id, student_id, class_id, teacher_id, date, status, remarks)
    VALUES (v_school_id, v_student4_id, v_class2_id, v_staff2_id, CURRENT_DATE - INTERVAL '1 day', 'absent', 'Medical appointment')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO attendance (school_id, student_id, class_id, teacher_id, date, status, remarks)
    VALUES (v_school_id, v_student1_id, v_class1_id, v_staff1_id, CURRENT_DATE, 'present', NULL)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO attendance (school_id, student_id, class_id, teacher_id, date, status, remarks)
    VALUES (v_school_id, v_student2_id, v_class1_id, v_staff1_id, CURRENT_DATE, 'present', NULL)
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- 10. SEED ACADEMIC RESULTS
    -- ============================================
    INSERT INTO results (school_id, student_id, class_id, subject_id, teacher_id, term, session, ca_score, exam_score, total_score, grade, remarks)
    VALUES (v_school_id, v_student1_id, v_class1_id, v_subject1_id, v_staff1_id, 'First Term', '2025/2026', 25, 60, 85, 'A', 'Excellent performance')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO results (school_id, student_id, class_id, subject_id, teacher_id, term, session, ca_score, exam_score, total_score, grade, remarks)
    VALUES (v_school_id, v_student1_id, v_class1_id, v_subject2_id, v_staff2_id, 'First Term', '2025/2026', 22, 55, 77, 'A', 'Very good')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO results (school_id, student_id, class_id, subject_id, teacher_id, term, session, ca_score, exam_score, total_score, grade, remarks)
    VALUES (v_school_id, v_student2_id, v_class1_id, v_subject1_id, v_staff1_id, 'First Term', '2025/2026', 20, 45, 65, 'B', 'Good performance')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO results (school_id, student_id, class_id, subject_id, teacher_id, term, session, ca_score, exam_score, total_score, grade, remarks)
    VALUES (v_school_id, v_student3_id, v_class2_id, v_subject3_id, v_staff3_id, 'First Term', '2025/2026', 23, 62, 85, 'A', 'Excellent in science')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO results (school_id, student_id, class_id, subject_id, teacher_id, term, session, ca_score, exam_score, total_score, grade, remarks)
    VALUES (v_school_id, v_student4_id, v_class2_id, v_subject1_id, v_staff1_id, 'First Term', '2025/2026', 18, 40, 58, 'C', 'Needs improvement')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- 11. SEED PARENT WALLETS
    -- ============================================
    INSERT INTO parent_wallets (school_id, parent_id, balance, total_funded, total_spent)
    VALUES (v_school_id, v_parent1_id, 500000.00, 500000.00, 0.00)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO parent_wallets (school_id, parent_id, balance, total_funded, total_spent)
    VALUES (v_school_id, v_parent2_id, 250000.00, 250000.00, 0.00)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO parent_wallets (school_id, parent_id, balance, total_funded, total_spent)
    VALUES (v_school_id, v_parent3_id, 750000.00, 750000.00, 0.00)
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- 12. SEED WALLET TRANSACTIONS
    -- ============================================
    INSERT INTO wallet_transactions (school_id, user_id, type, amount, description, balance_before, balance_after)
    VALUES (v_school_id, v_parent1_id, 'credit', 500000.00, 'Initial wallet funding', 0.00, 500000.00)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO wallet_transactions (school_id, user_id, type, amount, description, balance_before, balance_after)
    VALUES (v_school_id, v_parent2_id, 'credit', 250000.00, 'Initial wallet funding', 0.00, 250000.00)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO wallet_transactions (school_id, user_id, type, amount, description, balance_before, balance_after)
    VALUES (v_school_id, v_parent3_id, 'credit', 750000.00, 'Initial wallet funding', 0.00, 750000.00)
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- 13. SEED INVOICES
    -- ============================================
    INSERT INTO invoices (school_id, student_id, amount, status, due_date, description)
    VALUES (v_school_id, v_student1_id, 150000.00, 'paid', '2025-10-15'::date, 'Second Term Tuition - SS1A')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO invoices (school_id, student_id, amount, status, due_date, description)
    VALUES (v_school_id, v_student2_id, 150000.00, 'pending', '2025-10-15'::date, 'Second Term Tuition - SS1A')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO invoices (school_id, student_id, amount, status, due_date, description)
    VALUES (v_school_id, v_student3_id, 140000.00, 'overdue', '2025-09-30'::date, 'First Term Tuition - SS2A')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO invoices (school_id, student_id, amount, status, due_date, description)
    VALUES (v_school_id, v_student4_id, 140000.00, 'pending', '2025-10-15'::date, 'Second Term Tuition - SS2A')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- 14. SEED FINANCIAL TRANSACTIONS
    -- ============================================
    INSERT INTO financial_transactions (school_id, student_id, user_id, type, category, amount, payment_method, status, description)
    VALUES (v_school_id, v_student1_id, v_parent1_id, 'fee-payment', 'tuition', 150000.00, 'wallet', 'completed', 'Tuition payment for SS1A')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO financial_transactions (school_id, student_id, user_id, type, category, amount, payment_method, status, description)
    VALUES (v_school_id, v_student3_id, v_parent2_id, 'wallet-fund', 'funding', 250000.00, 'bank_transfer', 'completed', 'Parent wallet funding')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO financial_transactions (school_id, student_id, user_id, type, category, amount, payment_method, status, description)
    VALUES (v_school_id, v_student4_id, v_parent3_id, 'fee-payment', 'tuition', 140000.00, 'card', 'pending', 'Tuition payment awaiting confirmation')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- 15. SEED MESSAGES (Parent-Teacher Communication)
    -- ============================================
    INSERT INTO messages (sender_id, sender_name, sender_role, receiver_id, receiver_name, subject, content, school_id, read)
    VALUES (v_parent1_id, 'Mr. James Doe', 'parent', v_staff1_id, 'Mr. Adebayo Toheeb', 'John Performance Update', 
            'Good day sir, I wanted to enquire about John''s performance in mathematics. His previous results were impressive.', v_school_id, true)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO messages (sender_id, sender_name, sender_role, receiver_id, receiver_name, subject, content, school_id, read)
    VALUES (v_staff1_id, 'Mr. Adebayo Toheeb', 'staff', v_parent1_id, 'Mr. James Doe', 'RE: John Performance Update',
            'Thank you for following up. John is doing well in mathematics. He consistently participates in class and submits assignments on time.',
            v_school_id, false)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO messages (sender_id, sender_name, sender_role, receiver_id, receiver_name, subject, content, school_id, read)
    VALUES (v_parent2_id, 'Mrs. Ngozi Obi', 'parent', v_staff3_id, 'Dr. Chioma Njoku', 'Chidi Absence - Medical Appointment',
            'Please note that Chidi will be absent from school on 2025-10-20 due to a medical appointment. We appreciate your understanding.',
            v_school_id, true)
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- 16. SEED NOTIFICATIONS
    -- ============================================
    INSERT INTO notifications (user_id, school_id, title, message, type, read, metadata)
    VALUES (v_student1_id, v_school_id, 'Results Published', 'Your first term results have been published. Click to view your performance.', 'result', false, 
            '{"subject_count": 4, "average_score": 81}'::jsonb)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO notifications (user_id, school_id, title, message, type, read, metadata)
    VALUES (v_parent1_id, v_school_id, 'Attendance Alert', 'Jane was marked late to school today.', 'attendance', false,
            '{"student_name": "Jane Smith", "time": "08:45 AM", "class": "SS1A"}'::jsonb)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO notifications (user_id, school_id, title, message, type, read, metadata)
    VALUES (v_student2_id, v_school_id, 'Invoice Due', 'Your tuition fee for this term is due. Amount: ₦150,000', 'fee', true,
            '{"invoice_id": "INV-001", "amount": 150000, "due_date": "2025-10-15"}'::jsonb)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO notifications (user_id, school_id, title, message, type, read, metadata)
    VALUES (v_parent2_id, v_school_id, 'Low Grade Alert', 'Chidi scored below average in Chemistry. Consider engaging a tutor.', 'warning', false,
            '{"subject": "Chemistry", "score": 52, "class_average": 68}'::jsonb)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO notifications (user_id, school_id, title, message, type, read, metadata)
    VALUES (v_staff1_id, v_school_id, 'New Parent Message', 'You have a new message from Mr. James Doe regarding John''s performance.', 'message', false,
            '{"sender_name": "Mr. James Doe", "message_preview": "Good day sir..."}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- 17. SEED LESSONS (AI Generated & Manual)
    -- ============================================
    INSERT INTO lessons (school_id, staff_id, subject, topic, level, content, generated_by, tags)
    VALUES (v_school_id, v_staff1_id, 'Mathematics', 'Quadratic Equations', 'Secondary 1', 
            'A quadratic equation is an equation of the form ax² + bx + c = 0, where a ≠ 0. Methods of solving include factorization, completing the square, and using the quadratic formula.',
            'manual', ARRAY['algebra', 'equations', 'secondary1'])
    ON CONFLICT DO NOTHING;
    
    INSERT INTO lessons (school_id, staff_id, subject, topic, level, content, generated_by, tags)
    VALUES (v_school_id, v_staff2_id, 'English Language', 'Poetry Analysis', 'Secondary 2',
            'Poetry is a form of literature that uses language to evoke feelings and create imagery. Techniques include metaphor, simile, alliteration, and imagery.',
            'manual', ARRAY['literature', 'poetry', 'secondary2'])
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- 18. SEED AUDIT LOGS (System Activities)
    -- ============================================
    INSERT INTO audit_logs (school_id, user_id, user_name, action, resource_type, resource_id, metadata)
    VALUES (v_school_id, v_admin_id, 'Chief Administrator', 'created', 'user', v_student1_id::text, '{"role": "student", "admission_number": "STUD/2026/001"}'::jsonb)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO audit_logs (school_id, user_id, user_name, action, resource_type, resource_id, metadata)
    VALUES (v_school_id, v_staff1_id, 'Mr. Adebayo Toheeb', 'created', 'result', (SELECT id::text FROM results LIMIT 1), '{"subject": "Mathematics", "total_score": 85}'::jsonb)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Comprehensive seed data population completed successfully!';
    RAISE NOTICE 'Created: 1 school, 3 terms, 3 classes, 4 subjects, 5 students, 3 parents, 3 staff, 1 bursar, 1 admin';
    RAISE NOTICE 'Created: 5 enrollments, 4 staff assignments, 5 parent-student links, 6 attendance records, 4 results, 3 parent wallets';
    RAISE NOTICE 'Created: 3 wallet transactions, 4 invoices, 3 financial transactions, 3 messages, 5 notifications, 2 lessons, 2 audit logs';
    
END $$;

-- ============================================
-- VERIFICATION QUERIES (Run these to verify seed data)
-- ============================================

-- Check schools
-- SELECT COUNT(*) as schools FROM schools;

-- Check users by role
-- SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check student enrollments
-- SELECT COUNT(*) as enrollments FROM student_classes WHERE status = 'active';

-- Check invoices
-- SELECT status, COUNT(*), SUM(amount) FROM invoices GROUP BY status;

-- Check messages
-- SELECT COUNT(*) as messages FROM messages;

-- Check notifications
-- SELECT type, COUNT(*) FROM notifications GROUP BY type;

-- Check wallet balances
-- SELECT parent_id, balance FROM parent_wallets ORDER BY balance DESC;
