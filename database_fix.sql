-- COMPREHENSIVE DATABASE ERROR FIX
-- This script fixes the identified database errors and missing components

-- 1. First, let's check what schemas and tables exist
-- (This is diagnostic - comment out after running once)
-- SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%profile%';

-- 2. Create the missing check_admin_access function that the code expects
CREATE OR REPLACE FUNCTION public.check_admin_access(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin_user boolean := false;
BEGIN
  -- Use the existing is_admin function
  SELECT public.is_admin(user_id) INTO is_admin_user;
  RETURN COALESCE(is_admin_user, false);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_admin_access(uuid) TO authenticated;

-- 3. Create the missing get_current_user_profile function
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  totp_secret text,
  mfa_enabled boolean,
  backup_codes text[],
  mfa_setup_completed_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Return profile data
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role::text,
    p.created_at,
    p.updated_at,
    NULL::text as totp_secret,  -- MFA fields may not exist yet
    false as mfa_enabled,
    ARRAY[]::text[] as backup_codes,
    NULL::timestamp with time zone as mfa_setup_completed_at
  FROM public.profiles p
  WHERE p.user_id = current_user_id OR p.id = current_user_id
  LIMIT 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- 4. Fix the profiles table schema if needed
-- Check if the profiles table uses user_id or id for the auth reference
DO $$
DECLARE
  has_user_id_col boolean;
  has_id_as_auth_ref boolean;
BEGIN
  -- Check if user_id column exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND table_schema = 'public' 
    AND column_name = 'user_id'
  ) INTO has_user_id_col;

  -- Check if id is the primary key and references auth.users
  SELECT EXISTS(
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'profiles'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'id'
  ) INTO has_id_as_auth_ref;

  -- If we have user_id column, we need to ensure proper indexing and constraints
  IF has_user_id_col THEN
    -- Create index on user_id for better performance
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
    
    -- Ensure the foreign key constraint exists
    ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
    
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- 5. Create a test admin user profile if none exists
-- This creates the realassetcoin@gmail.com admin profile that the system expects
DO $$
DECLARE
  admin_user_id uuid;
  profile_exists boolean;
BEGIN
  -- Try to find the admin user in auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'realassetcoin@gmail.com' 
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Check if profile already exists
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE user_id = admin_user_id OR id = admin_user_id
    ) INTO profile_exists;

    -- Create profile if it doesn't exist
    IF NOT profile_exists THEN
      -- Try inserting with user_id first (for newer schema)
      BEGIN
        INSERT INTO public.profiles (user_id, email, full_name, role, created_at, updated_at)
        VALUES (admin_user_id, 'realassetcoin@gmail.com', 'Admin User', 'admin', now(), now())
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        -- If that fails, try with id (for older schema)
        BEGIN
          INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
          VALUES (admin_user_id, 'realassetcoin@gmail.com', 'Admin User', 'admin', now(), now())
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not create admin profile: %', SQLERRM;
        END;
      END;
      
      RAISE NOTICE 'Created admin profile for realassetcoin@gmail.com';
    ELSE
      -- Update existing profile to ensure admin role
      UPDATE public.profiles 
      SET role = 'admin', updated_at = now()
      WHERE (user_id = admin_user_id OR id = admin_user_id)
      AND role != 'admin';
      
      RAISE NOTICE 'Updated admin role for existing profile';
    END IF;
  ELSE
    RAISE NOTICE 'Admin user realassetcoin@gmail.com not found in auth.users';
  END IF;
END;
$$;

-- 6. Create a function to diagnose and fix common auth issues
CREATE OR REPLACE FUNCTION public.fix_auth_issues()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_text text := '';
  admin_count integer;
  profile_count integer;
BEGIN
  -- Count profiles
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  result_text := result_text || 'Total profiles: ' || profile_count || E'\n';
  
  -- Count admin profiles
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  result_text := result_text || 'Admin profiles: ' || admin_count || E'\n';
  
  -- Test is_admin function
  BEGIN
    IF public.is_admin() THEN
      result_text := result_text || 'is_admin() function: Working (current user is admin)' || E'\n';
    ELSE
      result_text := result_text || 'is_admin() function: Working (current user is not admin)' || E'\n';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'is_admin() function: ERROR - ' || SQLERRM || E'\n';
  END;
  
  -- Test check_admin_access function
  BEGIN
    IF public.check_admin_access() THEN
      result_text := result_text || 'check_admin_access() function: Working (current user is admin)' || E'\n';
    ELSE
      result_text := result_text || 'check_admin_access() function: Working (current user is not admin)' || E'\n';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'check_admin_access() function: ERROR - ' || SQLERRM || E'\n';
  END;
  
  RETURN result_text;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.fix_auth_issues() TO authenticated;

-- 7. Update RLS policies if they exist
-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    user_id = auth.uid() OR 
    id = auth.uid() OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    id = auth.uid() OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- 8. Test the fixes
SELECT public.fix_auth_issues();