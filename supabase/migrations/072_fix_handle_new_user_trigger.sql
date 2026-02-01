-- ============================================
-- FIX HANDLE_NEW_USER TRIGGER
-- Include school_id when syncing auth users to public.users
-- ============================================

-- Update the handle_new_user trigger to include school_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role,
    school_id
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    (NEW.raw_user_meta_data->>'school_id')::UUID
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully fixed handle_new_user trigger to include school_id';
END $$;
