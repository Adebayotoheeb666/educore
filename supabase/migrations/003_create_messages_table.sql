-- ============================================
-- CREATE MESSAGES TABLE
-- For parent-teacher communication
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role VARCHAR(20) NOT NULL, -- 'parent' or 'staff'
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_name TEXT NOT NULL,
  subject TEXT, -- Optional subject line
  content TEXT NOT NULL,
  attachment_url TEXT, -- Optional file attachment
  read BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false, -- For soft delete
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, school_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, school_id);
CREATE INDEX IF NOT EXISTS idx_messages_school ON messages(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  school_id
);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(receiver_id, read, school_id);

-- Add comment for documentation
COMMENT ON TABLE messages IS 'Stores parent-teacher messages for communication';
COMMENT ON COLUMN messages.sender_role IS 'Tracks who initiated the message (parent or staff)';
COMMENT ON COLUMN messages.read IS 'Whether the recipient has read the message';
COMMENT ON COLUMN messages.archived IS 'Soft delete flag for message archival';
