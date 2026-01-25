-- Add unique constraint on student_classes to prevent duplicate enrollments
-- This allows the upsert operation to work correctly with onConflict

ALTER TABLE student_classes
ADD CONSTRAINT unique_student_class_enrollment UNIQUE (student_id, class_id);
