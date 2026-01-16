-- ============================================
-- NOTIFICATION TRIGGERS
-- Automatically send notifications on specific events
-- ============================================

-- ============================================
-- 1. TRIGGER: Send notification when attendance is marked absent
-- ============================================

CREATE OR REPLACE FUNCTION notify_attendance_marked()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_student_name TEXT;
  v_class_id UUID;
  v_class_name TEXT;
  v_school_id UUID;
  v_parent_ids UUID[];
  v_parent_email TEXT;
  v_parent_name TEXT;
  v_parent_id UUID;
BEGIN
  -- Only trigger for absent records
  IF NEW.status = 'absent' THEN
    -- Get student and class info
    SELECT u.id, u.full_name, sc.id, sc.name, a.school_id
    INTO v_student_id, v_student_name, v_class_id, v_class_name, v_school_id
    FROM users u
    JOIN student_classes sc ON u.id = sc.student_id
    JOIN attendance a ON a.class_id = sc.class_id
    WHERE u.id = NEW.student_id AND sc.id = NEW.class_id
    LIMIT 1;

    -- Get parent(s) linked to student
    SELECT parent_ids INTO v_parent_ids
    FROM parent_student_links
    WHERE student_id = v_student_id AND school_id = v_school_id;

    -- Send notification to each parent
    IF v_parent_ids IS NOT NULL AND array_length(v_parent_ids, 1) > 0 THEN
      FOREACH v_parent_id IN ARRAY v_parent_ids LOOP
        -- Get parent details
        SELECT email, full_name INTO v_parent_email, v_parent_name
        FROM users
        WHERE id = v_parent_id;

        -- Insert notification record
        INSERT INTO notifications (school_id, user_id, title, message, type, link, read)
        VALUES (
          v_school_id,
          v_parent_id,
          '📋 Attendance Alert',
          v_student_name || ' was marked absent on ' || NEW.date::TEXT,
          'warning',
          '/parent/attendance',
          false
        );

        -- Note: Email trigger would be handled by separate function
        -- This is for database-level notifications
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS attendance_notification_trigger ON attendance;
CREATE TRIGGER attendance_notification_trigger
AFTER INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION notify_attendance_marked();

-- ============================================
-- 2. TRIGGER: Send notification when exam results are published
-- ============================================

CREATE OR REPLACE FUNCTION notify_results_published()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_student_name TEXT;
  v_subject_id UUID;
  v_subject_name TEXT;
  v_school_id UUID;
  v_parent_ids UUID[];
  v_parent_id UUID;
  v_parent_email TEXT;
  v_parent_name TEXT;
BEGIN
  -- Get student, subject, and school info
  SELECT u.id, u.full_name, s.id, s.name, r.school_id
  INTO v_student_id, v_student_name, v_subject_id, v_subject_name, v_school_id
  FROM users u
  JOIN subjects s ON s.id = NEW.subject_id
  JOIN results r ON r.id = NEW.id
  WHERE u.id = NEW.student_id;

  -- Get parent(s)
  SELECT parent_ids INTO v_parent_ids
  FROM parent_student_links
  WHERE student_id = v_student_id AND school_id = v_school_id;

  -- Send notification to each parent
  IF v_parent_ids IS NOT NULL AND array_length(v_parent_ids, 1) > 0 THEN
    FOREACH v_parent_id IN ARRAY v_parent_ids LOOP
      SELECT email, full_name INTO v_parent_email, v_parent_name
      FROM users
      WHERE id = v_parent_id;

      -- Insert notification
      INSERT INTO notifications (school_id, user_id, title, message, type, link, read)
      VALUES (
        v_school_id,
        v_parent_id,
        '📊 Results Published',
        v_student_name || ' has new results in ' || v_subject_name,
        'success',
        '/parent/results',
        false
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS results_notification_trigger ON results;
CREATE TRIGGER results_notification_trigger
AFTER INSERT ON results
FOR EACH ROW
EXECUTE FUNCTION notify_results_published();

-- ============================================
-- 3. TRIGGER: Send notification when invoices are created
-- ============================================

CREATE OR REPLACE FUNCTION notify_invoice_created()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_student_name TEXT;
  v_school_id UUID;
  v_parent_ids UUID[];
  v_parent_id UUID;
  v_parent_email TEXT;
  v_parent_name TEXT;
BEGIN
  v_student_id := NEW.student_id;
  v_school_id := NEW.school_id;

  -- Get student name
  SELECT full_name INTO v_student_name
  FROM users WHERE id = v_student_id;

  -- Get parent(s)
  SELECT parent_ids INTO v_parent_ids
  FROM parent_student_links
  WHERE student_id = v_student_id AND school_id = v_school_id;

  -- Send notification to each parent
  IF v_parent_ids IS NOT NULL AND array_length(v_parent_ids, 1) > 0 THEN
    FOREACH v_parent_id IN ARRAY v_parent_ids LOOP
      SELECT email, full_name INTO v_parent_email, v_parent_name
      FROM users
      WHERE id = v_parent_id;

      -- Insert notification
      INSERT INTO notifications (school_id, user_id, title, message, type, link, read)
      VALUES (
        v_school_id,
        v_parent_id,
        '💰 Fee Invoice Created',
        'An invoice of ₦' || NEW.amount::TEXT || ' is due for ' || v_student_name,
        'warning',
        '/parent/finances',
        false
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS invoice_notification_trigger ON invoices;
CREATE TRIGGER invoice_notification_trigger
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION notify_invoice_created();

-- ============================================
-- 4. TRIGGER: Log financial transactions to audit trail
-- ============================================

CREATE OR REPLACE FUNCTION log_financial_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Get transaction creator info (using current auth user)
  SELECT full_name, email INTO v_user_name, v_user_email
  FROM users WHERE id = auth.uid();

  -- Insert into audit log
  INSERT INTO audit_logs (
    school_id,
    user_id,
    user_name,
    user_email,
    action,
    resource_type,
    resource_id,
    changes,
    status
  )
  VALUES (
    NEW.school_id,
    COALESCE(auth.uid(), 'system'),
    COALESCE(v_user_name, 'System'),
    COALESCE(v_user_email, 'system@school.com'),
    'FINANCIAL_TRANSACTION_' || NEW.type,
    'financial_transaction',
    NEW.id::TEXT,
    jsonb_build_object(
      'type', NEW.type,
      'amount', NEW.amount,
      'status', NEW.status,
      'payment_method', NEW.payment_method,
      'reference', NEW.reference
    ),
    'success'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS log_financial_transaction_trigger ON financial_transactions;
CREATE TRIGGER log_financial_transaction_trigger
AFTER INSERT ON financial_transactions
FOR EACH ROW
EXECUTE FUNCTION log_financial_transaction();

-- ============================================
-- 5. TRIGGER: Update invoice status when payment is made via wallet
-- ============================================

CREATE OR REPLACE FUNCTION update_invoice_on_wallet_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process debit transactions from wallet that reference an invoice
  IF NEW.type = 'debit' AND NEW.reference IS NOT NULL THEN
    UPDATE invoices
    SET 
      status = 'paid',
      paid_date = NOW(),
      payment_method = 'wallet',
      transaction_ref = 'WALLET-' || NEW.reference
    WHERE id = NEW.reference::UUID
      AND school_id = NEW.school_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS wallet_invoice_payment_trigger ON wallet_transactions;
CREATE TRIGGER wallet_invoice_payment_trigger
AFTER INSERT ON wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION update_invoice_on_wallet_payment();

-- ============================================
-- 6. TRIGGER: Send grade alert when low score is entered
-- ============================================

CREATE OR REPLACE FUNCTION notify_low_grade()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_student_name TEXT;
  v_subject_name TEXT;
  v_school_id UUID;
  v_teacher_id UUID;
  v_parent_ids UUID[];
  v_parent_id UUID;
  v_total_score NUMERIC;
  v_passing_score NUMERIC := 40; -- Default passing score
BEGIN
  -- Only if total score is below passing score
  IF NEW.total_score < v_passing_score THEN
    v_student_id := NEW.student_id;
    v_school_id := NEW.school_id;
    v_teacher_id := NEW.teacher_id;

    -- Get student and subject names
    SELECT full_name INTO v_student_name FROM users WHERE id = v_student_id;
    SELECT name INTO v_subject_name FROM subjects WHERE id = NEW.subject_id;

    -- Get parent(s)
    SELECT parent_ids INTO v_parent_ids
    FROM parent_student_links
    WHERE student_id = v_student_id AND school_id = v_school_id;

    -- Send alert to parents
    IF v_parent_ids IS NOT NULL AND array_length(v_parent_ids, 1) > 0 THEN
      FOREACH v_parent_id IN ARRAY v_parent_ids LOOP
        INSERT INTO notifications (school_id, user_id, title, message, type, link, read)
        VALUES (
          v_school_id,
          v_parent_id,
          '⚠️ Low Grade Alert',
          v_student_name || ' scored ' || NEW.total_score || '% in ' || v_subject_name || '. Teacher intervention recommended.',
          'warning',
          '/parent/results',
          false
        );
      END LOOP;
    END IF;

    -- Notify teacher
    INSERT INTO notifications (school_id, user_id, title, message, type, link, read)
    VALUES (
      v_school_id,
      v_teacher_id,
      '⚠️ At-Risk Student',
      v_student_name || ' scored ' || NEW.total_score || '% in your ' || v_subject_name || ' class.',
      'warning',
      '/staff/analytics',
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS low_grade_notification_trigger ON results;
CREATE TRIGGER low_grade_notification_trigger
AFTER INSERT OR UPDATE ON results
FOR EACH ROW
EXECUTE FUNCTION notify_low_grade();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify triggers are created
-- SELECT trigger_name, event_object_table FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY event_object_table;
