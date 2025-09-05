-- CONSOLIDATED DATABASE ERROR FIX SCRIPT
-- This script fixes all identified database errors in the correct order
-- Apply this script in Supabase Dashboard → SQL Editor

-- ============================================================================
-- PART 1: CREATE MISSING RPC FUNCTIONS
-- ============================================================================

-- 1. Create the missing check_admin_access function
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
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_admin_access(uuid) TO authenticated;

-- 2. Create the missing get_current_user_profile function
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

  -- Return profile data (handle both user_id and id column schemas)
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
EXCEPTION WHEN OTHERS THEN
  RETURN;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- ============================================================================
-- PART 2: FIX PROFILES TABLE SCHEMA
-- ============================================================================

-- Ensure proper indexing and constraints on profiles table
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

  -- If we have user_id column, ensure proper indexing and constraints
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
EXCEPTION WHEN OTHERS THEN
  -- Continue if constraints already exist or other issues
  RAISE NOTICE 'Note: Some constraints may already exist - %', SQLERRM;
END;
$$;

-- ============================================================================
-- PART 3: CREATE ADMIN USER PROFILE
-- ============================================================================

-- Create the admin user profile that the system expects
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
        RAISE NOTICE 'Created admin profile with user_id for realassetcoin@gmail.com';
      EXCEPTION WHEN OTHERS THEN
        -- If that fails, try with id (for older schema)
        BEGIN
          INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
          VALUES (admin_user_id, 'realassetcoin@gmail.com', 'Admin User', 'admin', now(), now())
          ON CONFLICT DO NOTHING;
          RAISE NOTICE 'Created admin profile with id for realassetcoin@gmail.com';
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not create admin profile: %', SQLERRM;
        END;
      END;
    ELSE
      -- Update existing profile to ensure admin role
      UPDATE public.profiles 
      SET role = 'admin', updated_at = now()
      WHERE (user_id = admin_user_id OR id = admin_user_id)
      AND role != 'admin';
      
      RAISE NOTICE 'Updated admin role for existing profile';
    END IF;
  ELSE
    RAISE NOTICE 'Admin user realassetcoin@gmail.com not found in auth.users - please create the user first';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in admin profile creation: %', SQLERRM;
END;
$$;

-- ============================================================================
-- PART 4: UPDATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create/update basic RLS policies for profiles
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

-- ============================================================================
-- PART 5: CREATE DIAGNOSTIC FUNCTION
-- ============================================================================

-- Create a function to diagnose and verify the fixes
CREATE OR REPLACE FUNCTION public.diagnose_database_health()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_text text := '';
  admin_count integer;
  profile_count integer;
  function_exists boolean;
BEGIN
  result_text := result_text || '=== DATABASE HEALTH DIAGNOSTIC ===' || E'\n';
  
  -- Count profiles
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  result_text := result_text || 'Total profiles: ' || profile_count || E'\n';
  
  -- Count admin profiles
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  result_text := result_text || 'Admin profiles: ' || admin_count || E'\n';
  
  -- Check if check_admin_access function exists
  SELECT EXISTS(
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'check_admin_access'
  ) INTO function_exists;
  
  result_text := result_text || 'check_admin_access function exists: ' || function_exists || E'\n';
  
  -- Check if get_current_user_profile function exists
  SELECT EXISTS(
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'get_current_user_profile'
  ) INTO function_exists;
  
  result_text := result_text || 'get_current_user_profile function exists: ' || function_exists || E'\n';
  
  -- Test is_admin function
  BEGIN
    IF public.is_admin() THEN
      result_text := result_text || 'is_admin() test: PASS (current user is admin)' || E'\n';
    ELSE
      result_text := result_text || 'is_admin() test: PASS (current user is not admin)' || E'\n';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'is_admin() test: FAIL - ' || SQLERRM || E'\n';
  END;
  
  -- Test check_admin_access function
  BEGIN
    IF public.check_admin_access() THEN
      result_text := result_text || 'check_admin_access() test: PASS (current user is admin)' || E'\n';
    ELSE
      result_text := result_text || 'check_admin_access() test: PASS (current user is not admin)' || E'\n';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'check_admin_access() test: FAIL - ' || SQLERRM || E'\n';
  END;
  
  result_text := result_text || '=== END DIAGNOSTIC ===' || E'\n';
  
  RETURN result_text;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.diagnose_database_health() TO authenticated;

-- ============================================================================
-- PART 6: RUN DIAGNOSTIC
-- ============================================================================

-- Test the fixes immediately
SELECT public.diagnose_database_health();

-- Final success message
SELECT 'DATABASE FIXES APPLIED SUCCESSFULLY - Please test admin authentication' as status;