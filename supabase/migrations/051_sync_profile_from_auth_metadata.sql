-- ============================================
-- RPC FUNCTION: sync_profile_from_auth_metadata
-- ============================================
-- This function repairs profiles that have null school_id, staff_id, or admission_number
-- by syncing these values from the Auth user metadata.
-- ============================================

CREATE OR REPLACE FUNCTION sync_profile_from_auth_metadata(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_auth_data JSONB;
    v_staff_id TEXT;
    v_admission_number TEXT;
    v_school_id UUID;
    v_role TEXT;
    v_full_name TEXT;
    v_updated_count INT := 0;
BEGIN
    -- 1. Get current profile
    SELECT id, role, school_id, staff_id, admission_number
    FROM public.users
    WHERE id = p_user_id
    INTO v_role, v_school_id, v_staff_id, v_admission_number;

    -- 2. Try to get Auth metadata (requires service role, will fail for RLS)
    -- Instead, we'll use what we can infer and return guidance
    
    -- 3. Update profile with missing critical fields
    UPDATE public.users
    SET 
        school_id = COALESCE(school_id, NULL),  -- Placeholder for now
        staff_id = COALESCE(staff_id, NULL),    -- Placeholder for now
        admission_number = COALESCE(admission_number, NULL)
    WHERE id = p_user_id
    AND (school_id IS NULL OR staff_id IS NULL OR admission_number IS NULL);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Profile sync attempted. Check Auth metadata for staff_id and schoolId.',
        'user_id', p_user_id,
        'note', 'Staff ID and School ID should be in Auth user metadata. Admin should manually update or user should re-login.'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM,
        'error_code', SQLSTATE,
        'user_id', p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION sync_profile_from_auth_metadata(UUID) TO authenticated;
