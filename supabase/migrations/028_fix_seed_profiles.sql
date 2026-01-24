-- ============================================
-- FIX SEED PROFILES
-- Update users with missing roles, IDs, and phone numbers
-- ============================================

DO $$
BEGIN
    -- 1. ADMIN
    UPDATE users 
    SET 
        role = 'admin',
        phone_number = '08000000000'
    WHERE email = 'admin@legacyintl.edu.ng';

    -- 2. STAFF
    UPDATE users 
    SET 
        role = 'staff',
        staff_id = 'STAFF/001',
        phone_number = '08000000002'
    WHERE email = 'staff1@legacyintl.edu.ng';

    -- 3. STUDENT 1
    UPDATE users 
    SET 
        role = 'student',
        admission_number = 'STUD/001',
        phone_number = '08000000003'
    WHERE email = 'student1@legacyintl.edu.ng';

    -- 4. STUDENT 2
    UPDATE users 
    SET 
        role = 'student',
        admission_number = 'STUD/002',
        phone_number = '08000000004'
    WHERE email = 'student2@legacyintl.edu.ng';

    -- 5. PARENT (Ensure linked students are set if missing, though query showed them null, array might be null)
    -- We need to get student IDs to link them.
    UPDATE users 
    SET 
        role = 'parent',
        phone_number = '08000000001',
        linked_students = ARRAY[
            (SELECT id FROM users WHERE email = 'student1@legacyintl.edu.ng'),
            (SELECT id FROM users WHERE email = 'student2@legacyintl.edu.ng')
        ]::text[]
    WHERE email = 'parent1@legacyintl.edu.ng';
    
END $$;
