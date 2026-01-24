-- ============================================
-- RPC FUNCTION: link_staff_profile_after_activation
-- ============================================
-- This function is called after a staff member activates their account (JIT activation)
-- It handles:
-- 1. Finding the placeholder profile by staff_id
-- 2. Migrating staff_assignments from placeholder ID to new Auth UID
-- Uses SECURITY DEFINER to bypass RLS policies
-- NOTE: Client is responsible for deleting the placeholder after this succeeds
-- ============================================

CREATE OR REPLACE FUNCTION link_staff_profile_after_activation(
    p_school_id UUID,
    p_auth_uid UUID,
    p_staff_id_identifier TEXT
)
RETURNS JSON AS $$
DECLARE
    v_placeholder_id UUID;
    v_assignment_count INT;
BEGIN
    -- 1. Find the placeholder profile ID
    SELECT id INTO v_placeholder_id
    FROM public.users
    WHERE school_id = p_school_id
      AND staff_id = p_staff_id_identifier
      AND id != p_auth_uid;

    IF v_placeholder_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No placeholder profile found',
            'placeholder_id', NULL
        );
    END IF;

    -- 2. Migrate Staff Assignments from placeholder to new Auth UID
    UPDATE public.staff_assignments
    SET staff_id = p_auth_uid
    WHERE staff_id = v_placeholder_id
      AND school_id = p_school_id;

    GET DIAGNOSTICS v_assignment_count = ROW_COUNT;

    -- Return success with placeholder ID so client can delete it
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Assignments migrated successfully. %s assignments updated.', v_assignment_count),
        'assignments_migrated', v_assignment_count,
        'placeholder_id', v_placeholder_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM,
        'error_code', SQLSTATE,
        'placeholder_id', NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION link_staff_profile_after_activation(UUID, UUID, TEXT, TEXT) TO authenticated;
