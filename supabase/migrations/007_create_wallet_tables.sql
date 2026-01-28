-- ============================================
-- PARENT WALLET TABLES
-- For wallet-based fee payment system
-- ============================================

-- ============================================
-- 1. PARENT_WALLETS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS parent_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) DEFAULT 0.00,
  total_funded DECIMAL(12, 2) DEFAULT 0.00,
  total_spent DECIMAL(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_parent_wallets_school ON parent_wallets(school_id);
CREATE INDEX IF NOT EXISTS idx_parent_wallets_parent ON parent_wallets(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_wallets_balance ON parent_wallets(balance) WHERE balance > 0;

-- Add comment
COMMENT ON TABLE parent_wallets IS 'Stores parent wallet balances for fee payment';
COMMENT ON COLUMN parent_wallets.balance IS 'Current available balance in wallet';
COMMENT ON COLUMN parent_wallets.total_funded IS 'Total amount ever funded into wallet';
COMMENT ON COLUMN parent_wallets.total_spent IS 'Total amount spent from wallet';

-- Enable RLS
ALTER TABLE parent_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_wallets
-- Parents can see their own wallet
CREATE POLICY "parents_see_own_wallet" ON parent_wallets
  FOR SELECT
  USING (parent_id = auth.uid());

-- Parents can view wallets for their children (if they're the parent)
CREATE POLICY "parents_see_wallet_for_children" ON parent_wallets
  FOR SELECT
  USING (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Admins can view all wallets
CREATE POLICY "admins_view_all_wallets" ON parent_wallets
  FOR SELECT
  USING (
    get_auth_user_role() = 'admin' AND
    school_id = get_auth_user_school_id()
  );

-- Only system can create/update wallets (no direct user update)
-- (This is handled via Edge Functions)

-- ============================================
-- 2. WALLET_TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit', 'transfer')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  reference VARCHAR(255), -- Payment intent ID or transaction reference
  balance_before DECIMAL(12, 2),
  balance_after DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_wallet_txn_school ON wallet_transactions(school_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_user ON wallet_transactions(user_id, school_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_date ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_reference ON wallet_transactions(reference);

-- Add comment
COMMENT ON TABLE wallet_transactions IS 'Tracks all wallet credit/debit transactions';
COMMENT ON COLUMN wallet_transactions.type IS 'credit (funding), debit (payment), or transfer (between wallets)';
COMMENT ON COLUMN wallet_transactions.balance_before IS 'Wallet balance before this transaction';
COMMENT ON COLUMN wallet_transactions.balance_after IS 'Wallet balance after this transaction';

-- Enable RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own transactions
CREATE POLICY "users_see_own_wallet_txn" ON wallet_transactions
  FOR SELECT
  USING (user_id = auth.uid());

-- Parents can see transactions for their linked children
CREATE POLICY "parents_see_linked_child_txn" ON wallet_transactions
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'parent' AND
    user_id IN (
      SELECT UNNEST(linked_students) FROM users WHERE id = auth.uid()
    ) AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Admins can see all transactions in their school
CREATE POLICY "admins_view_school_txn" ON wallet_transactions
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin' AND
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 3. FUNCTION: GET_PARENT_WALLET_BALANCE
-- ============================================

CREATE OR REPLACE FUNCTION get_parent_wallet_balance(p_parent_id UUID, p_school_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT balance INTO v_balance
  FROM parent_wallets
  WHERE parent_id = p_parent_id AND school_id = p_school_id;

  RETURN COALESCE(v_balance, 0.00);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. FUNCTION: DEDUCT_WALLET_BALANCE
-- For paying fees from wallet
-- ============================================

CREATE OR REPLACE FUNCTION deduct_wallet_balance(
  p_parent_id UUID,
  p_school_id UUID,
  p_amount DECIMAL,
  p_description TEXT
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, message TEXT) AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- Get wallet
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM parent_wallets
  WHERE parent_id = p_parent_id AND school_id = p_school_id
  FOR UPDATE;

  -- Check if wallet exists
  IF v_wallet_id IS NULL THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Wallet not found';
    RETURN;
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT false, v_current_balance, 'Insufficient balance';
    RETURN;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Update wallet
  UPDATE parent_wallets
  SET 
    balance = v_new_balance,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE id = v_wallet_id;

  -- Log transaction
  INSERT INTO wallet_transactions (
    school_id, user_id, type, amount, description,
    balance_before, balance_after
  )
  VALUES (
    p_school_id, p_parent_id, 'debit', p_amount, p_description,
    v_current_balance, v_new_balance
  );

  RETURN QUERY SELECT true, v_new_balance, 'Balance deducted successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. FUNCTION: ADD_WALLET_CREDIT
-- For funding wallet
-- ============================================

CREATE OR REPLACE FUNCTION add_wallet_credit(
  p_parent_id UUID,
  p_school_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_reference VARCHAR
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, message TEXT) AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- Get or create wallet
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM parent_wallets
  WHERE parent_id = p_parent_id AND school_id = p_school_id;

  -- Create wallet if doesn't exist
  IF v_wallet_id IS NULL THEN
    INSERT INTO parent_wallets (school_id, parent_id, balance, total_funded)
    VALUES (p_school_id, p_parent_id, p_amount, p_amount)
    RETURNING id, balance INTO v_wallet_id, v_new_balance;
  ELSE
    -- Update existing wallet
    v_new_balance := v_current_balance + p_amount;
    UPDATE parent_wallets
    SET 
      balance = v_new_balance,
      total_funded = total_funded + p_amount,
      updated_at = NOW()
    WHERE id = v_wallet_id;
  END IF;

  -- Log transaction
  INSERT INTO wallet_transactions (
    school_id, user_id, type, amount, description, reference,
    balance_before, balance_after
  )
  VALUES (
    p_school_id, p_parent_id, 'credit', p_amount, p_description, p_reference,
    COALESCE(v_current_balance, 0), v_new_balance
  );

  RETURN QUERY SELECT true, v_new_balance, 'Wallet funded successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test wallet creation
-- SELECT * FROM parent_wallets LIMIT 1;

-- Test wallet transactions
-- SELECT * FROM wallet_transactions ORDER BY created_at DESC LIMIT 10;

-- Test balance function
-- SELECT get_parent_wallet_balance('parent-uuid', 'school-uuid');
