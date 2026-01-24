-- Add missing columns to help synchronize the users table with the application logic
-- These columns are expected by the staff invitation and authentication modules.

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS assigned_subjects TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS assigned_classes TEXT[] DEFAULT '{}';

-- Index for searching (if applicable)
-- CREATE INDEX IF NOT EXISTS idx_users_assigned_subjects ON public.users USING GIN (assigned_subjects);
