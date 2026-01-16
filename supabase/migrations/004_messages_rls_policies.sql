-- ============================================
-- MESSAGES TABLE - ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can see messages they sent
CREATE POLICY "users_see_own_sent_messages" ON messages
  FOR SELECT
  USING (sender_id = auth.uid());

-- Policy 2: Users can see messages they received
CREATE POLICY "users_see_own_received_messages" ON messages
  FOR SELECT
  USING (receiver_id = auth.uid());

-- Policy 3: Users can send messages
CREATE POLICY "users_can_send_messages" ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND 
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Policy 4: Users can update messages they sent (mark as read, archive)
CREATE POLICY "users_can_update_own_received_messages" ON messages
  FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (
    receiver_id = auth.uid() AND
    sender_id = sender_id -- Sender cannot be changed
  );

-- Policy 5: Users can delete messages (soft delete via archive)
CREATE POLICY "users_can_delete_own_messages" ON messages
  FOR DELETE
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Admins can see all messages in their school (for moderation)
CREATE POLICY "admins_see_school_messages" ON messages
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );
