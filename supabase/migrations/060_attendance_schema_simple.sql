-- Simple migration for attendance table columns
-- Run each section separately if needed

-- Add class_id column
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS class_id UUID;

-- Add teacher_id column  
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS teacher_id UUID;

-- Add foreign key for class_id
ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_class_id 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Add foreign key for teacher_id
ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_teacher_id 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create indices
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher ON attendance(teacher_id, date);
