-- Alternative fix: Disable the attendance notification trigger
-- This allows attendance to be recorded without blocking on notification RLS
-- You can re-enable notifications later once RLS policies are properly configured

DROP TRIGGER IF EXISTS attendance_notification_trigger ON attendance;

-- Keep the function but don't trigger it
-- Function definition is preserved so it can be re-enabled later
