-- Update foreign key constraints for notifications table to handle cascading deletes

-- 1. Drop existing constraints if they exist
DO $$
BEGIN
    -- Drop user_id foreign key constraint if it exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'notifications'
        AND constraint_name = 'notifications_user_id_fkey'
    ) THEN
        EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey';
    END IF;

    -- Drop sender_id foreign key constraint if it exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'notifications'
        AND constraint_name = 'notifications_sender_id_fkey'
    ) THEN
        EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT notifications_sender_id_fkey';
    END IF;
END $$;

-- 2. Recreate the constraints with CASCADE and SET NULL behaviors
ALTER TABLE notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

ALTER TABLE notifications
ADD CONSTRAINT notifications_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES users(id)
ON DELETE SET NULL;

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_school_id ON notifications(school_id);
