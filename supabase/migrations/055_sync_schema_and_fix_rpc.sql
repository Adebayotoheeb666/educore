-- ============================================
-- SCHEMA SYNCHRONIZATION & RPC FIX
-- ============================================

-- 1. FIX USERS TABLE
-- Add missing updated_at column to users table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. FIX RESULTS TABLE
-- Add missing teacher_id and ensure remarks column exists
DO $$ 
BEGIN 
    -- Add teacher_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'results' AND column_name = 'teacher_id') THEN
        ALTER TABLE results ADD COLUMN teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    -- Ensure 'remarks' (plural) exists - many parts of app expect plural
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'results' AND column_name = 'remarks') THEN
        -- If 'remark' (singular) exists, rename it. Otherwise add 'remarks'.
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'results' AND column_name = 'remark') THEN
            ALTER TABLE results RENAME COLUMN remark TO remarks;
        ELSE
            ALTER TABLE results ADD COLUMN remarks TEXT;
        END IF;
    END IF;
END $$;

-- 3. FIX RPC: get_school_users
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
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Security Check: Requester must be admin AND belong to the requested school
    IF get_auth_user_role() != 'admin' OR get_auth_user_school_id() != p_school_id THEN
        RAISE EXCEPTION 'Access denied';
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

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_school_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_school_users(UUID) TO service_role;
