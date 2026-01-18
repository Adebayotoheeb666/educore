-- ============================================
-- INVOICES TABLE
-- Tracks student/class fees and payment status
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_date DATE,
  payment_method VARCHAR(50),
  transaction_ref TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_school ON invoices(school_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices(student_id, school_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status, school_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date, status);

-- Add comments for documentation
COMMENT ON TABLE invoices IS 'Tracks student fees, invoices, and payment status';
COMMENT ON COLUMN invoices.status IS 'pending, paid, overdue, or cancelled';
COMMENT ON COLUMN invoices.transaction_ref IS 'Reference to payment transaction or order';
