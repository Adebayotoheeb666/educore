-- Ensure attendance table has the required columns
-- These columns are part of the core schema but may not exist in all databases

-- Add class_id column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE attendance ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add teacher_id column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE attendance ADD COLUMN teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher ON attendance(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date_class ON attendance(student_id, date, class_id);
