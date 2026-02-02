-- ============================================
-- FIX CREATE_USER_WITH_PROFILE RPC
-- Properly handle JSON operations without scalar path errors
-- ============================================

CREATE OR REPLACE FUNCTION public.create_user_with_profile(
    user_data JSONB
) RETURNS JSONB AS $$
DECLARE
    new_user_id UUID;
    result JSONB;
    user_email TEXT;
    user_password TEXT;
    user_metadata JSONB;
    user_role TEXT;
    user_school_id UUID;
    user_full_name TEXT;
    user_staff_id TEXT;
BEGIN
    -- Set a timeout to prevent hanging
    SET LOCAL statement_timeout = '30s';
    
    -- Extract and validate required fields
    user_email := user_data->>'email';
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'Email is required';
    END IF;
    
    -- Get password or generate one
    user_password := user_data->>'password';
    IF user_password IS NULL THEN
        user_password := gen_random_uuid()::TEXT;
    END IF;
    
    -- Build user_metadata from input
    user_metadata := COALESCE(user_data->'user_metadata', '{}'::jsonb);
    
    -- Extract metadata fields
    user_role := COALESCE(user_metadata->>'role', 'user');
    user_full_name := COALESCE(user_metadata->>'full_name', '');
    user_staff_id := user_metadata->>'staff_id';
    
    -- Handle school_id - could be 'school_id' or 'schoolId'
    user_school_id := NULL;
    BEGIN
        user_school_id := (user_metadata->>'school_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    IF user_school_id IS NULL THEN
        BEGIN
            user_school_id := (user_metadata->>'schoolId')::UUID;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
    
    -- Create the auth user
    BEGIN
        new_user_id := (auth.admin_create_user(
            email => user_email,
            password => user_password,
            email_confirm => true,
            user_metadata => user_metadata
        )).id;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create auth user: %', SQLERRM;
    END;
    
    -- Add user to public.users table with RLS bypass
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
            new_user_id,
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
            updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
        -- Clean up auth user if profile insert fails
        PERFORM auth.admin_delete_user(new_user_id);
        RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
    END;
    
    -- Return the created user data
    RETURN jsonb_build_object(
        'id', new_user_id,
        'email', user_email,
        'role', user_role,
        'school_id', user_school_id,
        'full_name', user_full_name,
        'staff_id', user_staff_id
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Re-raise any other errors with context
    RAISE EXCEPTION 'Error in create_user_with_profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.create_user_with_profile(JSONB) TO authenticated;

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully fixed create_user_with_profile RPC function';
END $$;
