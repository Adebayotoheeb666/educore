-- Enable RLS on all tables that don't have it yet
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read messages they're part of
DROP POLICY IF EXISTS "Users read their own messages" ON messages;
CREATE POLICY "Users read their own messages"
ON messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- Policy: Parents can read their linked child's transactions
DROP POLICY IF EXISTS "Parents read child transactions" ON financial_transactions;
CREATE POLICY "Parents read child transactions"
ON financial_transactions
FOR SELECT
USING (
  student_id IN (
    SELECT student_id FROM parent_student_links
    WHERE parent_id = auth.uid()
  )
);

-- Policy: Bursars/Admins can read school transactions
DROP POLICY IF EXISTS "Bursars read school transactions" ON financial_transactions;
CREATE POLICY "Bursars read school transactions"
ON financial_transactions
FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('bursar', 'admin')
);

-- Policy: Parents can only read their own links
DROP POLICY IF EXISTS "Parents read own links" ON parent_student_links;
CREATE POLICY "Parents read own links"
ON parent_student_links
FOR SELECT
USING (
  parent_id = auth.uid()
);
