-- ============================================
-- FIX ADMIN ACCESS & RLS RECURSION
-- ============================================

-- 1. Optimize Helper Functions to use JWT Metadata first
-- This prevents recursion by avoiding table lookups when possible
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- 1. Try to get role from JWT (fastest, prevents recursion)
  -- Note: We check user_metadata inside the JWT
  SELECT COALESCE(
    current_setting('request.jwt.claim.user_metadata', true)::jsonb ->> 'role',
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role')
  ) INTO v_role;

  -- 2. If found in JWT, return it
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  -- 3. Fallback to table lookup (SECURITY DEFINER ensures we bypass RLS for this lookup)
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_auth_user_school_id()
RETURNS UUID AS $$
DECLARE
  v_school_id_text TEXT;
  v_school_id UUID;
BEGIN
  -- 1. Try to get school_id from JWT
  SELECT COALESCE(
    current_setting('request.jwt.claim.user_metadata', true)::jsonb ->> 'schoolId',
    current_setting('request.jwt.claim.user_metadata', true)::jsonb ->> 'school_id',
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'schoolId'),
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'school_id')
  ) INTO v_school_id_text;

  -- 2. If found and valid UUID, return it
  IF v_school_id_text IS NOT NULL AND v_school_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN v_school_id_text::UUID;
  END IF;

  -- 3. Fallback to table lookup
  SELECT school_id INTO v_school_id FROM public.users WHERE id = auth.uid();
  RETURN v_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create RPC for Fetching School Users
-- This bypasses the complexity of "admin_access_all" RLS policy for the main dashboard list
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
        u.created_at, 
        u.updated_at
    FROM public.users u
    WHERE u.school_id = p_school_id
    ORDER BY u.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_school_users(UUID) TO authenticated;
