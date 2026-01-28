-- Add unique constraint for results to enable upserts
-- Pass 1: Deduplicate existing rows if any (keep latest updated_at)
DELETE FROM results a USING results b
WHERE a.id < b.id
AND a.student_id = b.student_id
AND a.subject_id = b.subject_id
AND a.class_id = b.class_id
AND a.term = b.term
AND a.session = b.session;

-- Pass 2: Add UNIQUE constraint
ALTER TABLE results
ADD CONSTRAINT results_student_subject_class_term_session_key 
UNIQUE (student_id, subject_id, class_id, term, session);
