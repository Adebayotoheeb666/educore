-- ============================================
-- COMPLETE SEED DATA
-- Restores core data and adds new feature data
-- ============================================

DO $$
DECLARE
    -- 1. IDs
    v_school_id UUID := 'e1d2c3b4-a5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_admin_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_staff1_id UUID := 'f1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_staff2_id UUID := 'f2b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_student1_id UUID := '01b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_student2_id UUID := '02b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_parent1_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4e';
    
    v_term_id UUID := 'd1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    v_class1_id UUID := 'c1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4f';
    v_subject1_id UUID := 'b1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';

BEGIN
    -- 2. SCHOOL
    INSERT INTO schools (id, name, address, phone, contact_email, website)
    VALUES (v_school_id, 'Legacy International School', '12 Education Way, Ikeja, Lagos', '+234 801 234 5678', 'admin@legacyintl.edu.ng', 'https://legacyintl.edu.ng')
    ON CONFLICT (id) DO NOTHING;

    -- 3. AUTH USERS (Mock)
    -- Admin
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (v_admin_id, 'admin@legacyintl.edu.ng', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"Chief Administrator"}', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    -- Staff 1
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (v_staff1_id, 'staff1@legacyintl.edu.ng', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"Mr. Adebayo Toheeb"}', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    -- Student 1
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (v_student1_id, 'student1@legacyintl.edu.ng', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"John Doe"}', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;
    
    -- Student 2
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (v_student2_id, 'student2@legacyintl.edu.ng', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"Jane Smith"}', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    -- Parent 1
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (v_parent1_id, 'parent1@legacyintl.edu.ng', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"Parent Doe"}', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    -- 4. PUBLIC PROFILES
    INSERT INTO users (id, full_name, email, role, school_id)
    VALUES (v_admin_id, 'Chief Administrator', 'admin@legacyintl.edu.ng', 'admin', v_school_id)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO users (id, full_name, role, school_id, staff_id)
    VALUES (v_staff1_id, 'Mr. Adebayo Toheeb', 'staff', v_school_id, 'STAFF/001')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO users (id, full_name, email, role, school_id, admission_number)
    VALUES (v_student1_id, 'John Doe', 'student1@legacyintl.edu.ng', 'student', v_school_id, 'STUD/001')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO users (id, full_name, email, role, school_id, admission_number)
    VALUES (v_student2_id, 'Jane Smith', 'student2@legacyintl.edu.ng', 'student', v_school_id, 'STUD/002')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO users (id, full_name, email, role, school_id, phone_number, linked_students)
    VALUES (v_parent1_id, 'Parent Doe', 'parent1@legacyintl.edu.ng', 'parent', v_school_id, '08000000001', ARRAY[v_student1_id::text, v_student2_id::text])
    ON CONFLICT (id) DO NOTHING;

    -- 5. ACADEMIC DATA
    INSERT INTO terms (id, school_id, name, start_date, end_date, is_active)
    VALUES (v_term_id, v_school_id, 'First Term 2025/2026', '2025-09-01', '2025-12-15', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO classes (id, school_id, name, level) 
    VALUES (v_class1_id, v_school_id, 'SS1A', 'Secondary 1') 
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO subjects (id, school_id, name, code) 
    VALUES (v_subject1_id, v_school_id, 'Mathematics', 'MTH101') 
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO student_classes (school_id, student_id, class_id, status)
    VALUES (v_school_id, v_student1_id, v_class1_id, 'active')
    ON CONFLICT DO NOTHING;

    INSERT INTO staff_assignments (school_id, staff_id, class_id, subject_id, start_date)
    VALUES (v_school_id, v_staff1_id, v_class1_id, v_subject1_id, '2025-09-01')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO parent_student_links (school_id, student_id, parent_id, relationship)
    VALUES (v_school_id, v_student1_id, v_parent1_id, 'Father')
    ON CONFLICT (student_id, parent_id) DO NOTHING;

    -- 6. NEW FEATURES SEEDING
    
    -- Messages
    INSERT INTO messages (sender_id, sender_name, sender_role, receiver_id, receiver_name, subject, content, school_id)
    VALUES 
    (v_parent1_id, 'Parent Doe', 'parent', v_staff1_id, 'Mr. Adebayo Toheeb', 'Meeting Request', 'I would like to discuss John''s performance.', v_school_id),
    (v_staff1_id, 'Mr. Adebayo Toheeb', 'staff', v_parent1_id, 'Parent Doe', 'Re: Meeting Request', 'Sure, let''s meet on Friday.', v_school_id);

    -- Invoices
    INSERT INTO invoices (school_id, student_id, amount, description, category, term, session, status, due_date)
    VALUES 
    (v_school_id, v_student1_id, 150000.00, 'School Fees - First Term', 'tuition', 'First Term', '2025/2026', 'unpaid', '2025-09-15');

    -- Parent Wallets (ensure exists via upsert logic or just insert since we have constraint)
    -- Constraint is generated PK, but parent_id + school_id should be unique in practice (handled by app). 
    -- Migration 007 doesn't explicitly enforce unique(parent_id, school_id) in SQL shown, but let's check policies.
    -- We'll insert if not exists.
    IF NOT EXISTS (SELECT 1 FROM parent_wallets WHERE parent_id = v_parent1_id) THEN
        INSERT INTO parent_wallets (school_id, parent_id, balance, total_funded)
        VALUES (v_school_id, v_parent1_id, 50000.00, 50000.00);
    END IF;

    -- Wallet Transactions
    INSERT INTO wallet_transactions (school_id, user_id, type, amount, description, balance_before, balance_after, status)
    VALUES 
    (v_school_id, v_parent1_id, 'credit', 50000.00, 'Wallet Funding', 0.00, 50000.00, 'success');

    -- Notifications
    INSERT INTO notifications (school_id, user_id, title, message, type, read)
    VALUES 
    (v_school_id, v_parent1_id, 'Welcome', 'Welcome to the legacy portal.', 'info', false);

END $$;
