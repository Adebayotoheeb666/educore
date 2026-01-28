-- Add session to results table
ALTER TABLE results 
ADD COLUMN session TEXT;

-- Create index for performance on session queries
CREATE INDEX idx_results_session ON results(session);
