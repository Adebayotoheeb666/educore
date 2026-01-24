-- ============================================
-- INVOICES TABLE
-- For fee management and tracking
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Financial details
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  description TEXT NOT NULL,
  category VARCHAR(50), -- e.g., 'tuition', 'uniform', 'books'
  
  -- Term/Session details
  term VARCHAR(50) NOT NULL,
  session VARCHAR(20) NOT NULL,
  
  -- Payment status
  status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'partial', 'cancelled')),
  due_date DATE,
  paid_date TIMESTAMP,
  payment_method VARCHAR(50), -- 'wallet', 'bank_transfer', 'cash', etc.
  transaction_ref VARCHAR(255), -- External reference or wallet transaction ID
  
  -- Audit fields
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices(student_id, school_id);
CREATE INDEX IF NOT EXISTS idx_invoices_school ON invoices(school_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_term ON invoices(school_id, session, term);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Add comments
COMMENT ON TABLE invoices IS 'Stores fee invoices generated for students';
COMMENT ON COLUMN invoices.status IS 'Current payment status (unpaid, paid, partial, cancelled)';
COMMENT ON COLUMN invoices.transaction_ref IS 'Reference to the payment transaction (e.g. wallet ID)';
