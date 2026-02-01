-- ============================================
-- FIX USER CREATION WITH RLS
-- Handles user creation with proper RLS management
-- ============================================

-- 1. Create a security definer function for user creation
CREATE OR REPLACE FUNCTION public.create_auth_user(
    user_id UUID,
    email TEXT,
    password TEXT,
    user_metadata JSONB
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- First create the auth user with admin privileges
    new_user_id := (auth.admin_create_user(
        id => user_id,
        email => email,
        password => password,
        email_confirm => true,
        user_metadata => user_metadata
    )).id;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a function to handle the complete user creation process
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
    user_data JSONB
) RETURNS JSONB AS $$
DECLARE
    new_user_id UUID;
    result JSONB;
BEGIN
    -- Set a timeout to prevent hanging
    SET LOCAL statement_timeout = '30s';
    
    -- Generate a random password if not provided
    IF (user_data->>'password') IS NULL THEN
        user_data := jsonb_set(
            user_data,
            '{password}',
            to_jsonb(gen_random_uuid()::TEXT)
        );
    END IF;
    
    -- Ensure user_metadata exists
    IF (user_data->'user_metadata') IS NULL THEN
        user_data := jsonb_set(
            user_data,
            '{user_metadata}',
            '{}'::jsonb
        );
    END IF;
    
    -- Set default role if not provided
    IF (user_data->'user_metadata'->>'role') IS NULL THEN
        user_data := jsonb_set(
            user_data,
            '{user_metadata, role}',
            to_jsonb('user')
        );
    END IF;
    
    -- Create the auth user
    new_user_id := public.create_auth_user(
        (user_data->>'id')::UUID,
        user_data->>'email',
        user_data->>'password',
        user_data->'user_metadata'::jsonb
    );
    
    -- Add user to public.users table with RLS bypass
    INSERT INTO public.users (
        id,
        email,
        role,
        school_id,
        first_name,
        last_name,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        user_data->>'email',
        COALESCE(user_data->'user_metadata'->>'role', 'user'),
        (user_data->'user_metadata'->>'schoolId')::UUID,
        split_part(COALESCE(user_data->'user_metadata'->>'full_name', ''), ' ', 1),
        split_part(COALESCE(user_data->'user_metadata'->>'full_name', ''), ' ', 2),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        school_id = EXCLUDED.school_id,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW()
    RETURNING to_jsonb(users.*) INTO result;
    
    -- Add any additional user metadata
    IF user_data->'user_metadata'->>'staff_id' IS NOT NULL THEN
        UPDATE public.users
        SET staff_id = user_data->'user_metadata'->>'staff_id'
        WHERE id = new_user_id;
    END IF;
    
    -- Return the created user data
    RETURN jsonb_build_object(
        'id', new_user_id,
        'email', user_data->>'email',
        'role', COALESCE(user_data->'user_metadata'->>'role', 'user'),
        'school_id', (user_data->'user_metadata'->>'schoolId')::UUID,
        'temp_password', CASE 
            WHEN user_data->>'password' IS NOT NULL THEN user_data->>'password'
            ELSE NULL
        END
    );
EXCEPTION WHEN OTHERS THEN
    -- Clean up auth user if something went wrong
    IF new_user_id IS NOT NULL THEN
        PERFORM auth.admin_delete_user(new_user_id);
    END IF;
    
    -- Re-raise the error
    RAISE EXCEPTION '%', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_auth_user(UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_with_profile(JSONB) TO authenticated;

-- 4. Create a policy to allow service role access (for server-side operations)
CREATE POLICY "service_role_can_create_users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Create a policy to allow admins to manage users in their school
CREATE POLICY "admins_can_manage_users"
ON public.users
FOR ALL
TO authenticated
USING (
    auth.uid() = id OR
    (EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() 
        AND u.role = 'admin' 
        AND u.school_id = users.school_id
    ))
)
WITH CHECK (
    auth.uid() = id OR
    (EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() 
        AND u.role = 'admin' 
        AND u.school_id = users.school_id
    ))
);

-- 6. Notify that the migration is complete
DO $$
BEGIN
    RAISE NOTICE 'Successfully created user management functions and policies';
END $$;
