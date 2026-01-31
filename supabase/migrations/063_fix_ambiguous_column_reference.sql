-- Fix ambiguous column reference in get_school_users function

-- Drop the existing function
DROP FUNCTION IF EXISTS get_school_users(UUID);

-- Recreate with explicit table references and proper column aliasing
CREATE OR REPLACE FUNCTION get_school_users(p_school_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    school_id UUID,
    full_name TEXT,
    admission_number TEXT,
    staff_id TEXT,
    phone_number TEXT,
    profile_image TEXT,
    linked_students TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
    v_user_school_id UUID;
BEGIN
    -- Get the current user's ID from auth
    v_user_id := auth.uid();

    -- If user is not authenticated, deny access
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get the current user's role and school_id from the database directly
    -- Using fully qualified table name to avoid ambiguity
    SELECT 
        u.role, 
        u.school_id
    INTO 
        v_user_role, 
        v_user_school_id
    FROM 
        public.users u
    WHERE 
        u.id = v_user_id;

    -- Security Check: Requester must be admin AND belong to the requested school
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin access required';
    END IF;

    IF v_user_school_id IS NULL THEN
        RAISE EXCEPTION 'Access denied: User has no school assigned';
    END IF;

    IF v_user_school_id != p_school_id THEN
        RAISE EXCEPTION 'Access denied: Cannot access users from a different school';
    END IF;

    -- Return all users for the school with explicit table references
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.role,
        u.school_id,
        u.full_name,
        u.admission_number,
        u.staff_id,
        u.phone_number,
        u.profile_image,
        COALESCE(u.linked_students, '{}'::TEXT[]) as linked_students,
        u.created_at,
        CASE 
            WHEN u.updated_at IS NOT NULL THEN u.updated_at
            ELSE u.created_at
        END as updated_at
    FROM 
        public.users u
    WHERE 
        u.school_id = p_school_id
    ORDER BY 
        u.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_school_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_school_users(UUID) TO service_role;
