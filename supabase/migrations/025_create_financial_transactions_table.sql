-- ============================================
-- FINANCIAL_TRANSACTIONS TABLE
-- Tracks all financial transactions in the system
-- ============================================

CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('fee-payment', 'refund', 'wallet-fund', 'wallet-debit', 'adjustment', 'transfer')),
  category TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50),
  reference VARCHAR(255),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_financial_txn_school ON financial_transactions(school_id);
CREATE INDEX IF NOT EXISTS idx_financial_txn_student ON financial_transactions(student_id, school_id);
CREATE INDEX IF NOT EXISTS idx_financial_txn_type ON financial_transactions(type, school_id);
CREATE INDEX IF NOT EXISTS idx_financial_txn_date ON financial_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_txn_reference ON financial_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_financial_txn_status ON financial_transactions(status);

-- Add comments for documentation
COMMENT ON TABLE financial_transactions IS 'Tracks all financial transactions including payments, refunds, and wallet operations';
COMMENT ON COLUMN financial_transactions.type IS 'Type of transaction: fee-payment, refund, wallet-fund, wallet-debit, adjustment, transfer';
COMMENT ON COLUMN financial_transactions.reference IS 'Reference to payment intent, invoice, or other transaction ID';
COMMENT ON COLUMN financial_transactions.metadata IS 'Additional transaction context stored as JSON';
