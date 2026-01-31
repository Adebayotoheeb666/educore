-- Update foreign key constraints for attendance table to handle cascading deletes

-- First, drop existing constraints if they exist
DO $$
BEGIN
    -- Drop student_id foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'attendance' 
        AND constraint_name = 'attendance_student_id_fkey'
    ) THEN
        EXECUTE 'ALTER TABLE attendance DROP CONSTRAINT attendance_student_id_fkey';
    END IF;

    -- Drop teacher_id foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'attendance' 
        AND constraint_name = 'attendance_teacher_id_fkey'
    ) THEN
        EXECUTE 'ALTER TABLE attendance DROP CONSTRAINT attendance_teacher_id_fkey';
    END IF;
END $$;

-- Recreate the constraints with CASCADE and SET NULL behaviors
ALTER TABLE attendance 
ADD CONSTRAINT attendance_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE attendance 
ADD CONSTRAINT attendance_teacher_id_fkey 
FOREIGN KEY (teacher_id) 
REFERENCES users(id) 
ON DELETE SET NULL;
