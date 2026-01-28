-- ============================================
-- RPC FUNCTION: resolve_staff_first_login
-- ============================================
-- Handles the critical linking step when a pre-created staff member logs in for the first time.
-- It safely identifies the "placeholder" profile created by Admin and merges it into the new Auth profile.
-- Uses SECURITY DEFINER to bypass RLS, allowing the new (restricted) user to "see" and claim their placeholder.

CREATE OR REPLACE FUNCTION resolve_staff_first_login(
    p_school_id UUID,
    p_auth_uid UUID,
    p_staff_id TEXT,
    p_email TEXT,
    p_full_name TEXT
)
RETURNS JSON AS $$
DECLARE
    v_placeholder_id UUID;
    v_placeholder_record RECORD;
    v_assignments_count INT := 0;
BEGIN
    -- 1. Search for the placeholder profile
    -- Must match school_id and staff_id, and NOT be the current auth user
    SELECT * INTO v_placeholder_record
    FROM public.users
    WHERE school_id = p_school_id
      AND staff_id = p_staff_id
      AND id != p_auth_uid
    LIMIT 1;

    IF v_placeholder_record.id IS NULL THEN
        -- No placeholder found. Just ensure the current profile has correct staff_id.
        UPDATE public.users
        SET staff_id = p_staff_id,
            school_id = p_school_id,
            -- Update name/email if they are missing or default
            full_name = COALESCE(NULLIF(full_name, ''), p_full_name),
            email = COALESCE(NULLIF(email, ''), p_email)
        WHERE id = p_auth_uid;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'No placeholder found. Profile updated directly.',
            'migrated', false
        );
    END IF;

    v_placeholder_id := v_placeholder_record.id;

    -- 2. Placeholder found! Merge data.
    -- We prioritize data from the placeholder (like phone number, specialization if it exists)
    -- But we keep the new Auth ID.
    UPDATE public.users
    SET 
        staff_id = p_staff_id,
        school_id = p_school_id,
        -- Use placeholder data if available, else new inputs
        full_name = COALESCE(NULLIF(v_placeholder_record.full_name, ''), p_full_name),
        phone_number = COALESCE(NULLIF(v_placeholder_record.phone_number, ''), phone_number),
        -- Preserve creation time of the original placeholder to show correct "joined" date
        created_at = v_placeholder_record.created_at
    WHERE id = p_auth_uid;

    -- 3. Migrate assignments
    UPDATE public.staff_assignments
    SET staff_id = p_auth_uid
    WHERE staff_id = v_placeholder_id
      AND school_id = p_school_id;
      
    GET DIAGNOSTICS v_assignments_count = ROW_COUNT;

    -- 4. Delete the placeholder
    DELETE FROM public.users WHERE id = v_placeholder_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Placeholder profile merged successfully.',
        'migrated', true,
        'assignments_count', v_assignments_count,
        'old_id', v_placeholder_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant access
GRANT EXECUTE ON FUNCTION resolve_staff_first_login(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;
