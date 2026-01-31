-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS invite_staff(
    email TEXT,
    full_name TEXT,
    school_id UUID,
    role TEXT,
    specialization TEXT DEFAULT NULL,
    phone_number TEXT DEFAULT NULL,
    admin_id UUID,
    staff_id TEXT DEFAULT NULL
);

-- Create a wrapper function that will be called by the Edge Function
CREATE OR REPLACE FUNCTION invite_staff(
    email TEXT,
    full_name TEXT,
    school_id UUID,
    role TEXT,
    specialization TEXT DEFAULT NULL,
    phone_number TEXT DEFAULT NULL,
    admin_id UUID,
    staff_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    function_url TEXT := 'https://nhmyuoxqzhspwkmggbkz.supabase.co/functions/v1/invite-staff';
    service_role_key TEXT;
    response_status INT;
    response_content TEXT;
BEGIN
    -- Get the service role key from the environment
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- Make an HTTP request to the Edge Function
    SELECT 
        status,
        content::TEXT
    INTO 
        response_status,
        response_content
    FROM 
        http(ARRAY[
            ('POST', function_url, ARRAY[
                http_header('Content-Type', 'application/json'),
                http_header('Authorization', 'Bearer ' || service_role_key)
            ], 'application/json', 
            json_build_object(
                'email', email,
                'fullName', full_name,
                'schoolId', school_id,
                'role', role,
                'specialization', specialization,
                'phoneNumber', phone_number,
                'adminId', admin_id,
                'staffId', staff_id
            )::TEXT
        )::http_request);
    
    -- Parse the response
    BEGIN
        result := response_content::JSONB;
    EXCEPTION WHEN OTHERS THEN
        result := jsonb_build_object(
            'error', 'Failed to parse response',
            'status', response_status,
            'content', response_content
        );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION invite_staff(
    TEXT, TEXT, UUID, TEXT, TEXT, TEXT, UUID, TEXT
) TO authenticated;

-- Create a function to set the service role key in the database
CREATE OR REPLACE FUNCTION set_service_role_key(key TEXT) 
RETURNS VOID AS $$
BEGIN
    -- This function should only be called by a superuser
    IF NOT current_setting('is_superuser')::BOOLEAN THEN
        RAISE EXCEPTION 'Only superusers can set the service role key';
    END IF;
    
    -- Set the service role key in the database
    EXECUTE format('ALTER DATABASE %I SET app.settings.service_role_key = %L', 
                  current_database(), key);
    
    -- Also set it for the current session
    EXECUTE format('SET LOCAL app.settings.service_role_key = %L', key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get the current service role key (for debugging)
CREATE OR REPLACE FUNCTION get_service_role_key() 
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.settings.service_role_key', true);
EXCEPTION WHEN OTHERS THEN
    RETURN 'Not set';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to test the invite_staff function
CREATE OR REPLACE FUNCTION test_invite_staff() 
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Replace these with valid test values
    SELECT * INTO result FROM invite_staff(
        'test@example.com',
        'Test User',
        '5ff5944f-75be-4ff7-b37d-4f400541b800'::UUID,
        'staff',
        'Mathematics',
        '+1234567890',
        '31bbce31-bdf8-47fb-b092-d2ea2aedf88b'::UUID,
        'STF-TEST-1234'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
