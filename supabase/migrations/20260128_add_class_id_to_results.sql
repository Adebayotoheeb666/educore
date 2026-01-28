-- Add class_id to results table
ALTER TABLE results 
ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_results_class_id ON results(class_id);

-- Update RLS policies if needed to include class checks (optional but good practice)
-- Existing policies likely check school_id or student_id/teacher_id, which is fine.
