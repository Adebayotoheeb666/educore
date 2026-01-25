-- Add class_id column to attendance table for denormalized data access
-- This column is optional and can be populated from student_classes, but having it 
-- provides faster queries when filtering attendance by class

ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Create an index for faster class-based queries
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id, date);
