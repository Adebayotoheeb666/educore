-- ============================================
-- FIX RPC: REMOVE updated_at FROM RETURN TYPE
-- ============================================

-- The users table in the live database does not have an updated_at column.
-- This caused the get_school_users function to fail.
-- We recreate it without that column.

-- Postgres requires dropping the function when changing the return table structure
DROP FUNCTION IF EXISTS get_school_users(UUID);

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
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Security Check: Requester must be admin AND belong to the requested school
    IF get_auth_user_role() != 'admin' OR get_auth_user_school_id() != p_school_id THEN
        RAISE EXCEPTION 'Access denied: You must be an admin of this school to view all users.';
    END IF;

    -- Return all users for the school
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
        u.linked_students, 
        u.created_at
    FROM public.users u
    WHERE u.school_id = p_school_id
    ORDER BY u.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
