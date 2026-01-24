-- ============================================
-- RPC FUNCTION: sync_staff_id_from_metadata
-- ============================================
-- This function helps fix staff profiles where staff_id was not set correctly.
-- It extracts the mapped_id from the user's auth metadata and updates the staff_id in the users table.
-- This is useful for staff members who activated before the staff_id was properly initialized.

CREATE OR REPLACE FUNCTION sync_staff_id_from_metadata(p_user_id UUID, p_staff_id_from_metadata TEXT)
RETURNS JSON AS $$
DECLARE
    v_current_staff_id TEXT;
    v_update_result BOOLEAN;
BEGIN
    -- 1. Check if the user exists
    SELECT staff_id INTO v_current_staff_id
    FROM public.users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found'
        );
    END IF;

    -- 2. If staff_id is already set and different, don't overwrite
    IF v_current_staff_id IS NOT NULL AND v_current_staff_id != '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', format('User already has staff_id: %s', v_current_staff_id),
            'current_staff_id', v_current_staff_id,
            'attempted_staff_id', p_staff_id_from_metadata
        );
    END IF;

    -- 3. Update the staff_id
    UPDATE public.users
    SET staff_id = p_staff_id_from_metadata,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 4. Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Staff ID synced successfully: %s', p_staff_id_from_metadata),
        'user_id', p_user_id,
        'staff_id', p_staff_id_from_metadata
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION sync_staff_id_from_metadata(UUID, TEXT) TO authenticated;
