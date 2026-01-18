-- ============================================
-- UPDATE NOTIFICATIONS TABLE
-- Add missing columns required by triggers
-- ============================================

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'info',
ADD COLUMN IF NOT EXISTS link TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_school ON notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
