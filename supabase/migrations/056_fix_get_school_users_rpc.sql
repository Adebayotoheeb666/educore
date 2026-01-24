-- ============================================
-- FIX GET_SCHOOL_USERS RPC
-- ============================================

-- Drop the problematic RPC function
DROP FUNCTION IF EXISTS get_school_users(UUID);

-- Recreate without JWT metadata dependency
-- This function will use direct database lookup which is more reliable
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
    v_user_role TEXT;
    v_user_school_id UUID;
BEGIN
    -- Get the current user's role and school_id from the database directly
    -- SECURITY DEFINER allows us to bypass RLS for this lookup
    SELECT role, school_id 
    INTO v_user_role, v_user_school_id
    FROM public.users 
    WHERE id = auth.uid();

    -- Security Check: Requester must be admin AND belong to the requested school
    IF v_user_role IS NULL OR v_user_role != 'admin' OR v_user_school_id IS NULL OR v_user_school_id != p_school_id THEN
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
        u.created_at, 
        u.updated_at
    FROM public.users u
    WHERE u.school_id = p_school_id
    ORDER BY u.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_school_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_school_users(UUID) TO service_role;
