-- ============================================
-- NOTIFICATIONS TABLE
-- Stores system notifications for users
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'attendance', 'result', 'fee', 'message')),
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications including attendance alerts, results, fees, and messages';
COMMENT ON COLUMN notifications.type IS 'Type of notification: info, success, warning, error, attendance, result, fee, or message';
COMMENT ON COLUMN notifications.read IS 'Whether the user has read this notification';
COMMENT ON COLUMN notifications.metadata IS 'Additional notification context stored as JSON';
