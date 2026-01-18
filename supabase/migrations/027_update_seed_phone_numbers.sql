-- ============================================
-- UPDATE SEED USER CREDENTIALS
-- Add phone numbers required for login
-- ============================================

DO $$
BEGIN
    -- Update Admin (Email: admin@legacyintl.edu.ng)
    UPDATE users 
    SET phone_number = '08000000000'
    WHERE email = 'admin@legacyintl.edu.ng';

    -- Update Staff (Email: staff1@legacyintl.edu.ng)
    UPDATE users 
    SET phone_number = '08000000002' 
    WHERE email = 'staff1@legacyintl.edu.ng'; -- Note: Staff seed didn't include email in users table insert in 025, but let's check staff_id
    
    UPDATE users
    SET phone_number = '08000000002'
    WHERE staff_id = 'STAFF/001';

    -- Update Student 1 (Email: student1@legacyintl.edu.ng)
    UPDATE users 
    SET phone_number = '08000000003'
    WHERE admission_number = 'STUD/001';

    -- Update Student 2 (Email: student2@legacyintl.edu.ng)
    UPDATE users 
    SET phone_number = '08000000004'
    WHERE admission_number = 'STUD/002';
    
    -- Parent already has 08000000001
END $$;
