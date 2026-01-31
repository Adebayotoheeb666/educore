-- Update foreign key constraints for cascading deletes

-- 1. Update results table constraints
ALTER TABLE results 
DROP CONSTRAINT IF EXISTS results_student_id_fkey,
ADD CONSTRAINT results_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE results 
DROP CONSTRAINT IF EXISTS results_teacher_id_fkey,
ADD CONSTRAINT results_teacher_id_fkey 
FOREIGN KEY (teacher_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- 2. Update attendance table constraints
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS attendance_student_id_fkey,
ADD CONSTRAINT attendance_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS attendance_teacher_id_fkey,
ADD CONSTRAINT attendance_teacher_id_fkey 
FOREIGN KEY (teacher_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_teacher_id ON results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON attendance(teacher_id);
