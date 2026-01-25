-- Ensure attendance table has the required columns
-- These columns are part of the core schema but may not exist in all databases

-- Add class_id column if it doesn't exist
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Add teacher_id column if it doesn't exist
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher ON attendance(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);

-- Drop old index if it exists and recreate with better coverage
DROP INDEX IF EXISTS idx_attendance_student;
CREATE INDEX IF NOT EXISTS idx_attendance_student_date_class ON attendance(student_id, date, class_id);
