-- ============================================
-- REGISTER SCHOOL RPC
-- Bypass RLS for initial school creation
-- ============================================

CREATE OR REPLACE FUNCTION register_school_and_admin(
    admin_uid UUID,
    admin_email TEXT,
    admin_full_name TEXT,
    school_name TEXT,
    school_address TEXT,
    school_contact_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres)
SET search_path = public -- Secure search path
AS $$
DECLARE
    new_school_id UUID;
BEGIN
    -- 1. Validate: Ensure user doesn't already have a profile
    IF EXISTS (SELECT 1 FROM users WHERE id = admin_uid) THEN
        RAISE EXCEPTION 'User profile already exists';
    END IF;

    -- 2. Create School
    INSERT INTO schools (name, address, contact_email, admin_uid)
    VALUES (school_name, school_address, COALESCE(school_contact_email, admin_email), admin_uid)
    RETURNING id INTO new_school_id;

    -- 3. Create Admin Profile
    INSERT INTO users (id, school_id, role, email, full_name)
    VALUES (admin_uid, new_school_id, 'admin', admin_email, admin_full_name);

    -- 4. Return result
    RETURN jsonb_build_object(
        'school_id', new_school_id,
        'user_id', admin_uid
    );
END;
$$;
