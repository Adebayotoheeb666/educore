-- Fix RLS for audit_logs table to allow system operations

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for system operations" ON audit_logs;
DROP POLICY IF EXISTS "Enable read access for admins" ON audit_logs;

-- 2. Create new policies
CREATE POLICY "Enable insert for system operations" 
ON audit_logs
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for admins" 
ON audit_logs
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        AND users.school_id = audit_logs.school_id
    )
);

-- 3. Ensure the table has RLS enabled
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create a function to safely add audit logs that respects RLS
CREATE OR REPLACE FUNCTION log_audit_event(
    p_school_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_old_record JSONB DEFAULT NULL,
    p_new_record JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Use a DO block with SECURITY DEFINER to bypass RLS for this specific insert
    EXECUTE format('INSERT INTO audit_logs (
        school_id, user_id, action, table_name, record_id, 
        old_record, new_record, metadata
    ) VALUES (
        %L, %L, %L, %L, %L, %L, %L, %L
    )', 
    p_school_id, p_user_id, p_action, p_table_name, p_record_id, 
    p_old_record, p_new_record, p_metadata);
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the operation
    RAISE WARNING 'Failed to log audit event: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION log_audit_event(UUID, UUID, TEXT, TEXT, UUID, JSONB, JSONB, JSONB) TO authenticated;
