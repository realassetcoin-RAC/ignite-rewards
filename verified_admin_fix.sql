-- VERIFIED ADMIN FIX - ADDRESSES ROOT CAUSE
-- This fix resolves the schema mismatch issue that causes persistent admin panel loading problems
-- Apply this script in Supabase Dashboard → SQL Editor

-- ============================================================================
-- PART 1: DIAGNOSE CURRENT STATE
-- ============================================================================

-- First, let's see what we're working with
DO $$
DECLARE
  api_profiles_exists boolean;
  public_profiles_exists boolean;
  api_admin_exists boolean;
  public_admin_exists boolean;
BEGIN
  -- Check table existence
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'profiles'
  ) INTO api_profiles_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) INTO public_profiles_exists;
  
  -- Check admin user existence
  IF api_profiles_exists THEN
    SELECT EXISTS(
      SELECT 1 FROM api.profiles 
      WHERE email = 'realassetcoin@gmail.com' AND role = 'admin'
    ) INTO api_admin_exists;
  END IF;
  
  IF public_profiles_exists THEN
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE email = 'realassetcoin@gmail.com' AND role = 'admin'
    ) INTO public_admin_exists;
  END IF;
  
  -- Log current state
  RAISE NOTICE 'Current State:';
  RAISE NOTICE '  api.profiles exists: %', api_profiles_exists;
  RAISE NOTICE '  public.profiles exists: %', public_profiles_exists;
  RAISE NOTICE '  admin in api.profiles: %', COALESCE(api_admin_exists, false);
  RAISE NOTICE '  admin in public.profiles: %', COALESCE(public_admin_exists, false);
END $$;

-- ============================================================================
-- PART 2: ENSURE public.profiles TABLE EXISTS WITH CORRECT STRUCTURE
-- ============================================================================

-- Create public.profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  totp_secret text,
  mfa_enabled boolean DEFAULT false,
  backup_codes text[],
  mfa_setup_completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: MIGRATE DATA FROM api.profiles TO public.profiles (IF NEEDED)
-- ============================================================================

-- Migrate data from api.profiles to public.profiles if api.profiles exists
DO $$
DECLARE
  api_count integer;
  public_count integer;
BEGIN
  -- Check if api.profiles exists and has data
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'profiles') THEN
    SELECT COUNT(*) INTO api_count FROM api.profiles;
    SELECT COUNT(*) INTO public_count FROM public.profiles;
    
    RAISE NOTICE 'api.profiles has % records, public.profiles has % records', api_count, public_count;
    
    -- If api.profiles has data and public.profiles is empty, migrate
    IF api_count > 0 AND public_count = 0 THEN
      RAISE NOTICE 'Migrating data from api.profiles to public.profiles...';
      
      INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at, totp_secret, mfa_enabled, backup_codes, mfa_setup_completed_at)
      SELECT id, email, full_name, role, created_at, updated_at, totp_secret, mfa_enabled, backup_codes, mfa_setup_completed_at
      FROM api.profiles
      ON CONFLICT (id) DO NOTHING;
      
      RAISE NOTICE 'Migration completed';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PART 4: ENSURE ADMIN USER EXISTS IN public.profiles
-- ============================================================================

-- Create or update admin user in public.profiles
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get admin user ID from auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'realassetcoin@gmail.com' 
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Insert or update admin profile
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (admin_user_id, 'realassetcoin@gmail.com', 'Admin User', 'admin', now(), now())
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      email = 'realassetcoin@gmail.com',
      full_name = 'Admin User',
      updated_at = now();
    
    RAISE NOTICE 'Admin user profile ensured in public.profiles';
  ELSE
    RAISE WARNING 'Admin user realassetcoin@gmail.com not found in auth.users';
  END IF;
END $$;

-- ============================================================================
-- PART 5: CREATE UNIFIED RPC FUNCTIONS (ALL USING public.profiles)
-- ============================================================================

-- Drop existing conflicting functions
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.check_admin_access();
DROP FUNCTION IF EXISTS public.get_current_user_profile();

-- Create unified is_admin function (using public.profiles only)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
  user_email text;
BEGIN
  -- Return false if no user_id
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check role in public.profiles
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = user_id;
  
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Fallback: check known admin emails
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = user_id;
  
  RETURN user_email IN ('realassetcoin@gmail.com');
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Create unified check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN public.is_admin(user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Create unified get_current_user_profile function
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
  user_email text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found';
  END IF;

  -- Get user email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = current_user_id;

  -- Return profile from public.profiles, or create fallback
  RETURN QUERY
  SELECT 
    COALESCE(p.id, current_user_id) as id,
    COALESCE(p.email, user_email) as email,
    COALESCE(p.full_name, split_part(user_email, '@', 1)) as full_name,
    COALESCE(p.role, 'user') as role,
    COALESCE(p.created_at, au.created_at) as created_at,
    COALESCE(p.updated_at, au.updated_at) as updated_at,
    p.totp_secret,
    COALESCE(p.mfa_enabled, false) as mfa_enabled,
    COALESCE(p.backup_codes, ARRAY[]::text[]) as backup_codes,
    p.mfa_setup_completed_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE au.id = current_user_id;
END;
$$;

-- ============================================================================
-- PART 6: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- ============================================================================
-- PART 7: CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    public.is_admin()
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR 
    public.is_admin()
  );

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    id = auth.uid()
  );

-- ============================================================================
-- PART 8: VERIFICATION
-- ============================================================================

-- Test the functions
DO $$
DECLARE
  admin_count integer;
  function_count integer;
  test_result boolean;
BEGIN
  -- Count admin profiles
  SELECT COUNT(*) INTO admin_count 
  FROM public.profiles 
  WHERE role = 'admin';
  
  -- Count required functions
  SELECT COUNT(*) INTO function_count 
  FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid 
  WHERE n.nspname = 'public' 
    AND p.proname IN ('is_admin', 'check_admin_access', 'get_current_user_profile');
  
  -- Test is_admin function
  SELECT public.is_admin() INTO test_result;
  
  -- Log results
  RAISE NOTICE 'Verification Results:';
  RAISE NOTICE '  Admin profiles: %', admin_count;
  RAISE NOTICE '  Required functions: %', function_count;
  RAISE NOTICE '  is_admin() test: %', test_result;
  
  IF admin_count > 0 AND function_count = 3 THEN
    RAISE NOTICE 'SUCCESS: Admin fix completed successfully!';
  ELSE
    RAISE WARNING 'WARNING: Some issues may remain';
  END IF;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
  'Admin fix completed!' as status,
  'All functions now use public.profiles consistently' as details,
  'Test admin access in your application' as next_step;