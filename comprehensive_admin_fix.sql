-- COMPREHENSIVE ADMIN PANEL FIX SCRIPT
-- This script addresses all known admin panel loading issues
-- Apply this script in Supabase Dashboard → SQL Editor

-- ============================================================================
-- PART 1: ENSURE ALL REQUIRED FUNCTIONS EXIST
-- ============================================================================

-- 1. Create or replace is_admin function
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
  -- Get user email for known admin check
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  -- Check if user has admin role in profiles table
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  
  -- Return true if role is admin OR if email is in known admin list
  RETURN (
    user_role = 'admin' OR 
    user_email IN ('realassetcoin@gmail.com')
  );
EXCEPTION WHEN OTHERS THEN
  -- Fallback: check known admin emails
  RETURN user_email IN ('realassetcoin@gmail.com');
END;
$$;

-- 2. Create or replace check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use the is_admin function
  RETURN public.is_admin(user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- 3. Create or replace get_current_user_profile function
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
  current_user_email text;
BEGIN
  current_user_id := auth.uid();
  
  -- Get user email from auth.users
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
  
  -- Return profile data, creating fallback if profile doesn't exist
  RETURN QUERY
  SELECT 
    COALESCE(p.id, current_user_id) as id,
    COALESCE(p.email, current_user_email) as email,
    COALESCE(p.full_name, split_part(current_user_email, '@', 1)) as full_name,
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
-- PART 2: ENSURE ADMIN USER PROFILE EXISTS
-- ============================================================================

-- Create admin profile for realassetcoin@gmail.com if it doesn't exist
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
  'admin' as role,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.email = 'realassetcoin@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
  );

-- Update existing profile to admin if it exists but isn't admin
UPDATE public.profiles 
SET 
  role = 'admin',
  updated_at = NOW()
WHERE email = 'realassetcoin@gmail.com' 
  AND role != 'admin';

-- ============================================================================
-- PART 3: GRANT PROPER PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- Ensure authenticated users can read profiles
GRANT SELECT ON public.profiles TO authenticated;

-- ============================================================================
-- PART 4: CREATE DIAGNOSTIC FUNCTION
-- ============================================================================

-- Create a diagnostic function to test admin access
CREATE OR REPLACE FUNCTION public.diagnose_admin_access()
RETURNS TABLE(
  test_name text,
  result text,
  details text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  current_user_email text;
  profile_exists boolean;
  profile_role text;
  is_admin_result boolean;
  check_admin_result boolean;
BEGIN
  current_user_id := auth.uid();
  
  -- Get current user email
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
  
  -- Test 1: Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = current_user_id) INTO profile_exists;
  
  -- Test 2: Get profile role
  SELECT role INTO profile_role FROM public.profiles WHERE id = current_user_id;
  
  -- Test 3: Test is_admin function
  SELECT public.is_admin() INTO is_admin_result;
  
  -- Test 4: Test check_admin_access function
  SELECT public.check_admin_access() INTO check_admin_result;
  
  -- Return test results
  RETURN QUERY
  SELECT 'User ID'::text, current_user_id::text, 'Current authenticated user ID'::text
  UNION ALL
  SELECT 'User Email'::text, COALESCE(current_user_email, 'NULL')::text, 'Email from auth.users'::text
  UNION ALL
  SELECT 'Profile Exists'::text, profile_exists::text, 'Whether profile exists in profiles table'::text
  UNION ALL
  SELECT 'Profile Role'::text, COALESCE(profile_role, 'NULL')::text, 'Role from profiles table'::text
  UNION ALL
  SELECT 'is_admin() Result'::text, is_admin_result::text, 'Result of is_admin() function'::text
  UNION ALL
  SELECT 'check_admin_access() Result'::text, check_admin_result::text, 'Result of check_admin_access() function'::text
  UNION ALL
  SELECT 'Known Admin Email'::text, (current_user_email IN ('realassetcoin@gmail.com'))::text, 'Whether email is in known admin list'::text;
END;
$$;

-- Grant execute permission on diagnostic function
GRANT EXECUTE ON FUNCTION public.diagnose_admin_access() TO authenticated;

-- ============================================================================
-- PART 5: VERIFICATION QUERIES
-- ============================================================================

-- Run verification queries
DO $$
DECLARE
  admin_count integer;
  function_count integer;
BEGIN
  -- Count admin profiles
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  
  -- Count required functions
  SELECT COUNT(*) INTO function_count 
  FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid 
  WHERE n.nspname = 'public' 
    AND p.proname IN ('is_admin', 'check_admin_access', 'get_current_user_profile');
  
  -- Log results
  RAISE NOTICE 'Admin profiles found: %', admin_count;
  RAISE NOTICE 'Required functions found: %', function_count;
  
  IF admin_count = 0 THEN
    RAISE WARNING 'No admin profiles found!';
  END IF;
  
  IF function_count < 3 THEN
    RAISE WARNING 'Not all required functions found!';
  END IF;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Admin panel fix completed successfully!' as status,
       'Run SELECT * FROM public.diagnose_admin_access(); to test' as next_step;