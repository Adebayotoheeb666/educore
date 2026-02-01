-- ============================================
-- SIMPLIFY CREATE_USER_WITH_PROFILE RPC
-- Just create the profile - auth user created via client
-- ============================================

CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT,
    user_role TEXT,
    user_school_id UUID,
    user_staff_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        school_id,
        staff_id,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        user_email,
        user_full_name,
        user_role,
        user_school_id,
        user_staff_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        school_id = EXCLUDED.school_id,
        staff_id = EXCLUDED.staff_id,
        updated_at = NOW()
    RETURNING to_jsonb(users.*) INTO result;
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT) TO authenticated;

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully created simplified create_user_profile RPC function';
END $$;
