-- ============================================
-- PARENT PROFILE LINKING RPC
-- ============================================
-- This RPC function handles the migration of an admin-created parent profile
-- to an authenticated parent user. It:
-- 1. Finds the admin-created placeholder parent
-- 2. Migrates parent_student_links to the new auth user
-- 3. Deletes the placeholder parent
-- 4. Updates the new profile with correct parent data
--
-- Using SECURITY DEFINER allows this function to bypass RLS policies,
-- which is necessary because a newly authenticated parent user cannot
-- normally delete other users or update certain fields due to RLS.

CREATE OR REPLACE FUNCTION link_parent_profile_after_login(
  p_school_id UUID,
  p_new_parent_uid UUID,
  p_parent_id TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_placeholder_id UUID;
  v_result jsonb := '{}'::jsonb;
  v_links_migrated INT := 0;
  v_placeholder_deleted BOOLEAN := FALSE;
BEGIN
  -- Step 1: Find the admin-created placeholder parent
  BEGIN
    SELECT id INTO v_placeholder_id
    FROM public.users
    WHERE school_id = p_school_id
    AND admission_number = p_parent_id
    AND role = 'parent'
    AND id != p_new_parent_uid
    LIMIT 1;

    IF v_placeholder_id IS NOT NULL THEN
      v_result := v_result || jsonb_build_object('placeholder_found', TRUE, 'placeholder_id', v_placeholder_id::text);

      -- Step 2: Migrate parent_student_links
      BEGIN
        UPDATE public.parent_student_links
        SET parent_id = p_new_parent_uid
        WHERE school_id = p_school_id
        AND parent_id = v_placeholder_id;

        GET DIAGNOSTICS v_links_migrated = ROW_COUNT;
        v_result := v_result || jsonb_build_object('links_migrated', v_links_migrated);
      EXCEPTION WHEN OTHERS THEN
        v_result := v_result || jsonb_build_object(
          'migration_error', SQLERRM,
          'migration_state', SQLSTATE
        );
        RAISE WARNING 'Error migrating parent_student_links: %', SQLERRM;
      END;

      -- Step 3: Delete the placeholder parent
      BEGIN
        DELETE FROM public.users WHERE id = v_placeholder_id;
        v_placeholder_deleted := TRUE;
        v_result := v_result || jsonb_build_object('placeholder_deleted', TRUE);
      EXCEPTION WHEN OTHERS THEN
        v_result := v_result || jsonb_build_object(
          'deletion_error', SQLERRM,
          'deletion_state', SQLSTATE
        );
        RAISE WARNING 'Error deleting placeholder parent: %', SQLERRM;
      END;
    ELSE
      v_result := v_result || jsonb_build_object('placeholder_found', FALSE);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_result := v_result || jsonb_build_object(
      'lookup_error', SQLERRM,
      'lookup_state', SQLSTATE
    );
    RAISE WARNING 'Error finding placeholder parent: %', SQLERRM;
  END;

  -- Step 4: Ensure the new profile has correct parent data
  BEGIN
    UPDATE public.users
    SET
      role = 'parent',
      admission_number = p_parent_id,
      school_id = p_school_id
    WHERE id = p_new_parent_uid;

    v_result := v_result || jsonb_build_object('profile_updated', TRUE);
  EXCEPTION WHEN OTHERS THEN
    v_result := v_result || jsonb_build_object(
      'update_error', SQLERRM,
      'update_state', SQLSTATE
    );
    RAISE WARNING 'Error updating new parent profile: %', SQLERRM;
  END;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION link_parent_profile_after_login(UUID, UUID, TEXT) TO authenticated;
