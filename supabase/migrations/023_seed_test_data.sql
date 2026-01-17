-- ============================================
-- SEED DATA FOR TESTING
-- Legacy International School - A complete test environment
-- ============================================

-- USE Predictable UUIDs for the Seeding
DO $$
DECLARE
    v_school_id UUID := 'e1d2c3b4-a5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_admin_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_staff1_id UUID := 'f1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_staff2_id UUID := 'f2b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_student1_id UUID := '01b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_student2_id UUID := '02b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_student3_id UUID := '03b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_parent1_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4e';
    v_class1_id UUID := 'c1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4f';
    v_class2_id UUID := 'c2b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4f';
    v_subject1_id UUID := 'b1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_subject2_id UUID := 'b2b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_term_id UUID := 'd1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
BEGIN
    -- 1. SEED SCHOOL
    INSERT INTO schools (id, name, address, phone, contact_email, website)
    VALUES (v_school_id, 'Legacy International School', '12 Education Way, Ikeja, Lagos', '+234 801 234 5678', 'admin@legacyintl.edu.ng', 'https://legacyintl.edu.ng')
    ON CONFLICT (id) DO NOTHING;

    -- 2. SEED AUTH USERS (Needed because public.users references auth.users)
    -- Admin
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_admin_id, 'admin@legacyintl.edu.ng', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Chief Administrator"}', 'authenticated', 'authenticated', now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- Staff 1
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_staff1_id, 'staff1@legacyintl.edu.ng', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mr. Adebayo Toheeb"}', 'authenticated', 'authenticated', now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- Staff 2
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_staff2_id, 'staff2@legacyintl.edu.ng', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mrs. Patrick Oladipupo"}', 'authenticated', 'authenticated', now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- Student 1
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_student1_id, 'student1@legacyintl.edu.ng', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"John Doe"}', 'authenticated', 'authenticated', now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- Parent 1
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_parent1_id, 'parent1@legacyintl.edu.ng', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Parent Doe"}', 'authenticated', 'authenticated', now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- 3. SEED TERMS
    INSERT INTO terms (id, school_id, name, start_date, end_date, is_active)
    VALUES (v_term_id, v_school_id, 'First Term 2025/2026', '2025-09-01', '2025-12-15', true)
    ON CONFLICT (id) DO NOTHING;

    -- 4. SEED CLASSES
    INSERT INTO classes (id, school_id, name, level) VALUES (v_class1_id, v_school_id, 'SS1A', 'Secondary 1') ON CONFLICT (id) DO NOTHING;
    INSERT INTO classes (id, school_id, name, level) VALUES (v_class2_id, v_school_id, 'SS2A', 'Secondary 2') ON CONFLICT (id) DO NOTHING;

    -- 5. SEED SUBJECTS
    INSERT INTO subjects (id, school_id, name, code) VALUES (v_subject1_id, v_school_id, 'Mathematics', 'MTH101') ON CONFLICT (id) DO NOTHING;
    INSERT INTO subjects (id, school_id, name, code) VALUES (v_subject2_id, v_school_id, 'English Language', 'ENG101') ON CONFLICT (id) DO NOTHING;

    -- 6. SEED PUBLIC PROFILES
    -- Admin
    INSERT INTO users (id, full_name, email, role, school_id)
    VALUES (v_admin_id, 'Chief Administrator', 'admin@legacyintl.edu.ng', 'admin', v_school_id)
    ON CONFLICT (id) DO NOTHING;

    -- Staff
    INSERT INTO users (id, full_name, role, school_id, staff_id)
    VALUES (v_staff1_id, 'Mr. Adebayo Toheeb', 'staff', v_school_id, 'STAFF/2026/001')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO users (id, full_name, role, school_id, staff_id)
    VALUES (v_staff2_id, 'Mrs. Patrick Oladipupo', 'staff', v_school_id, 'STAFF/2026/002')
    ON CONFLICT (id) DO NOTHING;

    -- Students
    INSERT INTO users (id, full_name, role, school_id, admission_number)
    VALUES (v_student1_id, 'John Doe', 'student', v_school_id, 'STUD/2026/001')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO users (id, full_name, role, school_id, admission_number)
    VALUES (v_student2_id, 'Jane Smith', 'student', v_school_id, 'STUD/2026/002')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO users (id, full_name, role, school_id, admission_number)
    VALUES (v_student3_id, 'Chidi Obi', 'student', v_school_id, 'STUD/2026/003')
    ON CONFLICT (id) DO NOTHING;

    -- Parents
    INSERT INTO users (id, full_name, role, school_id, phone_number, linked_students)
    VALUES (v_parent1_id, 'Parent Doe', 'parent', v_school_id, '08123456789', ARRAY[v_student1_id::text])
    ON CONFLICT (id) DO NOTHING;

    -- 7. SEED STUDENT ENROLLMENTS
    INSERT INTO student_classes (school_id, student_id, class_id, enrollment_date, status)
    VALUES (v_school_id, v_student1_id, v_class1_id, '2025-09-01', 'active')
    ON CONFLICT DO NOTHING;

    INSERT INTO student_classes (school_id, student_id, class_id, enrollment_date, status)
    VALUES (v_school_id, v_student2_id, v_class1_id, '2025-09-01', 'active')
    ON CONFLICT DO NOTHING;

    INSERT INTO student_classes (school_id, student_id, class_id, enrollment_date, status)
    VALUES (v_school_id, v_student3_id, v_class2_id, '2025-09-01', 'active')
    ON CONFLICT DO NOTHING;

    -- 8. SEED STAFF ASSIGNMENTS
    INSERT INTO staff_assignments (school_id, staff_id, class_id, subject_id, start_date)
    VALUES (v_school_id, v_staff1_id, v_class1_id, v_subject1_id, '2025-09-01')
    ON CONFLICT DO NOTHING;

    INSERT INTO staff_assignments (school_id, staff_id, class_id, subject_id, start_date)
    VALUES (v_school_id, v_staff2_id, v_class1_id, v_subject2_id, '2025-09-01')
    ON CONFLICT DO NOTHING;

    -- 9. LINK PARENT TO STUDENT
    INSERT INTO parent_student_links (id, school_id, student_id, parent_id, relationship)
    VALUES (gen_random_uuid(), v_school_id, v_student1_id, v_parent1_id, 'Father')
    ON CONFLICT (student_id, parent_id) DO NOTHING;

    -- 10. SEED ATTENDANCE
    INSERT INTO attendance (school_id, student_id, class_id, teacher_id, date, status)
    VALUES (v_school_id, v_student1_id, v_class1_id, v_staff1_id, current_date, 'present')
    ON CONFLICT DO NOTHING;

    INSERT INTO attendance (school_id, student_id, class_id, teacher_id, date, status)
    VALUES (v_school_id, v_student2_id, v_class1_id, v_staff1_id, current_date, 'absent')
    ON CONFLICT DO NOTHING;

    -- 11. SEED RESULTS
    INSERT INTO results (school_id, student_id, class_id, subject_id, teacher_id, term, session, ca_score, exam_score, total_score, grade)
    VALUES (v_school_id, v_student1_id, v_class1_id, v_subject1_id, v_staff1_id, 'First Term', '2025/2026', 25, 60, 85, 'A')
    ON CONFLICT DO NOTHING;

    INSERT INTO results (school_id, student_id, class_id, subject_id, teacher_id, term, session, ca_score, exam_score, total_score, grade)
    VALUES (v_school_id, v_student2_id, v_class1_id, v_subject1_id, v_staff1_id, 'First Term', '2025/2026', 20, 45, 65, 'B')
    ON CONFLICT DO NOTHING;

    -- 12. SEED WALLETS (Note: parent_wallets table is created in 007 migration)
    -- We wrap this in a sub-block to handle potential missing table gracefully
    BEGIN
        INSERT INTO parent_wallets (school_id, parent_id, balance)
        VALUES (v_school_id, v_parent1_id, 250000.00)
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'parent_wallets table not found, skipping wallet seed';
    END;

END $$;
