-- ============================================
-- RPC FUNCTION: link_staff_profile_after_activation
-- ============================================
-- This function is called after a staff member activates their account (JIT activation)
-- It handles:
-- 1. Migrating staff_assignments from placeholder ID to new Auth UID
-- 2. Deleting the old placeholder profile
-- Uses SECURITY DEFINER to bypass RLS policies
-- ============================================

CREATE OR REPLACE FUNCTION link_staff_profile_after_activation(
    school_id UUID,
    auth_uid UUID,
    staff_id_identifier TEXT,
    auth_user_role TEXT
)
RETURNS JSON AS $$
DECLARE
    placeholder_profile RECORD;
    migration_count INT;
    assignment_count INT;
BEGIN
    -- 1. Find the placeholder profile
    SELECT * INTO placeholder_profile
    FROM public.users
    WHERE school_id = link_staff_profile_after_activation.school_id
      AND staff_id = staff_id_identifier
      AND id != auth_uid;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No placeholder profile found'
        );
    END IF;

    -- 2. Migrate Staff Assignments from placeholder to new Auth UID
    UPDATE public.staff_assignments
    SET staff_id = auth_uid
    WHERE staff_id = placeholder_profile.id
      AND school_id = link_staff_profile_after_activation.school_id;

    GET DIAGNOSTICS assignment_count = ROW_COUNT;

    -- 3. Delete the old placeholder
    DELETE FROM public.users WHERE id = placeholder_profile.id;

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Profile linked successfully. Migrated %s assignments.', assignment_count),
        'assignments_migrated', assignment_count
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
GRANT EXECUTE ON FUNCTION link_staff_profile_after_activation(UUID, UUID, TEXT, TEXT) TO authenticated;
