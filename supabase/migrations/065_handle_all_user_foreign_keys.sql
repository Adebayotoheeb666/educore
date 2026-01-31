-- Handle all foreign key constraints for user deletion

-- 1. First, create a function to safely delete a user and all related data
CREATE OR REPLACE FUNCTION delete_user_safely(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_school_id UUID;
BEGIN
    -- Get the user's school_id for filtering
    SELECT school_id INTO v_school_id FROM users WHERE id = p_user_id;
    
    -- 1. Delete notifications for the user
    DELETE FROM notifications 
    WHERE user_id = p_user_id
    AND (v_school_id IS NULL OR school_id = v_school_id);
    
    -- 2. Delete results where user is student or teacher
    DELETE FROM results 
    WHERE (student_id = p_user_id OR teacher_id = p_user_id)
    AND (v_school_id IS NULL OR school_id = v_school_id);
    
    -- 3. Delete attendance records where user is student or teacher
    DELETE FROM attendance 
    WHERE (student_id = p_user_id OR teacher_id = p_user_id)
    AND (v_school_id IS NULL OR school_id = v_school_id);
    
    -- 4. Delete from student_classes if user is a student
    DELETE FROM student_classes 
    WHERE student_id = p_user_id
    AND (v_school_id IS NULL OR school_id = v_school_id);
    
    -- 5. Delete from audit_logs if they reference the user
    DELETE FROM audit_logs 
    WHERE user_id = p_user_id
    AND (v_school_id IS NULL OR school_id = v_school_id);
    
    -- 6. Delete the user from auth.users (this will cascade to public.users)
    -- Note: This requires superuser privileges, so it should be done in the edge function
    -- with service_role key
    -- DELETE FROM auth.users WHERE id = p_user_id;
    
    -- 7. The public.users row will be deleted by the CASCADE from auth.users
    -- or by the following if not using auth.users
    DELETE FROM users WHERE id = p_user_id;
    
    -- 8. Any other tables with foreign keys to users should be added here
    -- with appropriate ON DELETE behavior
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting user %: %', p_user_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_safely(UUID) TO authenticated;

-- 3. Update all foreign key constraints to handle deletes properly
DO $$
BEGIN
    -- Update notifications table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Drop existing constraint if it exists
        EXECUTE 'ALTER TABLE notifications 
                DROP CONSTRAINT IF EXISTS notifications_user_id_fkey';
                
        -- Recreate with proper delete behavior
        EXECUTE 'ALTER TABLE notifications 
                ADD CONSTRAINT notifications_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE';
    END IF;
    
    -- Update results table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'results') THEN
        EXECUTE 'ALTER TABLE results 
                DROP CONSTRAINT IF EXISTS results_student_id_fkey,
                DROP CONSTRAINT IF EXISTS results_teacher_id_fkey';
                
        EXECUTE 'ALTER TABLE results 
                ADD CONSTRAINT results_student_id_fkey 
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                ADD CONSTRAINT results_teacher_id_fkey 
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL';
    END IF;
    
    -- Update attendance table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance') THEN
        EXECUTE 'ALTER TABLE attendance 
                DROP CONSTRAINT IF EXISTS attendance_student_id_fkey,
                DROP CONSTRAINT IF EXISTS attendance_teacher_id_fkey';
                
        EXECUTE 'ALTER TABLE attendance 
                ADD CONSTRAINT attendance_student_id_fkey 
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                ADD CONSTRAINT attendance_teacher_id_fkey 
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL';
    END IF;
    
    -- Update student_classes table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_classes') THEN
        EXECUTE 'ALTER TABLE student_classes 
                DROP CONSTRAINT IF EXISTS student_classes_student_id_fkey';
                
        EXECUTE 'ALTER TABLE student_classes 
                ADD CONSTRAINT student_classes_student_id_fkey 
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE';
    END IF;
    
    -- Update audit_logs table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        EXECUTE 'ALTER TABLE audit_logs 
                DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey';
                
        EXECUTE 'ALTER TABLE audit_logs 
                ADD CONSTRAINT audit_logs_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL';
    END IF;
    
    -- Add any other tables with foreign keys to users here
    
END $$;

-- 4. Create a helper function to check for remaining references
CREATE OR REPLACE FUNCTION check_user_references(p_user_id UUID)
RETURNS TABLE (table_name TEXT, reference_count BIGINT) AS $$
BEGIN
    RETURN QUERY 
    SELECT 'notifications'::TEXT, COUNT(*) 
    FROM notifications WHERE user_id = p_user_id
    UNION ALL
    SELECT 'results (as student)'::TEXT, COUNT(*) 
    FROM results WHERE student_id = p_user_id
    UNION ALL
    SELECT 'results (as teacher)'::TEXT, COUNT(*) 
    FROM results WHERE teacher_id = p_user_id
    UNION ALL
    SELECT 'attendance (as student)'::TEXT, COUNT(*) 
    FROM attendance WHERE student_id = p_user_id
    UNION ALL
    SELECT 'attendance (as teacher)'::TEXT, COUNT(*) 
    FROM attendance WHERE teacher_id = p_user_id
    UNION ALL
    SELECT 'student_classes'::TEXT, COUNT(*) 
    FROM student_classes WHERE student_id = p_user_id
    UNION ALL
    SELECT 'audit_logs'::TEXT, COUNT(*) 
    FROM audit_logs WHERE user_id = p_user_id;
    
    -- Add any other tables with foreign keys to users here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_user_references(UUID) TO authenticated;
