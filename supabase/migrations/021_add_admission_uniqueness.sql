-- Add unique constraint for admission_number per school
ALTER TABLE users
ADD CONSTRAINT unique_admission_per_school
UNIQUE (school_id, admission_number);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admission_number_school ON users(school_id, admission_number)
WHERE admission_number IS NOT NULL;

-- Create index for staff_id lookups
CREATE INDEX IF NOT EXISTS idx_staff_id_school ON users(school_id, staff_id)
WHERE staff_id IS NOT NULL;
