-- EMERGENCY ADMIN ACCESS FIX
-- This script can be run directly in the Supabase SQL editor to fix admin authentication issues
-- Run this if the migration hasn't been applied or if there are still issues

-- 1. Create or replace the is_admin function with enhanced error handling
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin_user boolean := false;
  user_role text;
  user_exists boolean := false;
  current_user_id uuid;
BEGIN
  -- Use provided user_id or current user
  current_user_id := COALESCE(user_id, auth.uid());
  
  -- Return false if no user_id
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check profiles table (handle both schemas gracefully)
  BEGIN
    -- Try to get role from profiles table
    SELECT role::text INTO user_role
    FROM profiles
    WHERE id = current_user_id
    LIMIT 1;
    
    IF FOUND THEN
      user_exists := true;
      IF user_role IS NOT NULL AND user_role = 'admin' THEN
        is_admin_user := true;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE NOTICE 'Error checking profiles for user %: %', current_user_id, SQLERRM;
  END;

  -- Fallback: Check for known admin emails
  IF NOT is_admin_user THEN
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE id = current_user_id 
        AND email IN ('realassetcoin@gmail.com')
      ) INTO is_admin_user;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore auth.users access errors
      NULL;
    END;
  END IF;

  -- Log result for debugging
  RAISE NOTICE 'Admin check for user %: exists=%, role=%, is_admin=%', current_user_id, user_exists, user_role, is_admin_user;
  
  RETURN is_admin_user;
END;
$$;

-- 2. Create check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.is_admin(auth.uid());
$$;

-- 3. Create get_current_user_profile function
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
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found';
  END IF;

  -- Get user email from auth.users
  BEGIN
    SELECT auth.users.email INTO user_email
    FROM auth.users
    WHERE auth.users.id = current_user_id;
  EXCEPTION WHEN OTHERS THEN
    user_email := 'unknown@example.com';
  END;

  -- Try to get profile from profiles table
  BEGIN
    RETURN QUERY
    SELECT 
      p.id,
      COALESCE(p.email, user_email) as email,
      p.full_name,
      p.role::text,
      p.created_at,
      p.updated_at,
      p.totp_secret,
      COALESCE(p.mfa_enabled, false) as mfa_enabled,
      COALESCE(p.backup_codes, ARRAY[]::text[]) as backup_codes,
      p.mfa_setup_completed_at
    FROM profiles p
    WHERE p.id = current_user_id
    LIMIT 1;
    
    -- If we found a record, return
    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error checking profiles: %', SQLERRM;
  END;

  -- If no profile found, create a minimal one from auth data
  RETURN QUERY
  SELECT 
    current_user_id as id,
    user_email as email,
    'Admin User'::text as full_name,
    CASE 
      WHEN user_email = 'realassetcoin@gmail.com' THEN 'admin'::text
      ELSE 'user'::text
    END as role,
    NOW() as created_at,
    NOW() as updated_at,
    NULL::text as totp_secret,
    false as mfa_enabled,
    ARRAY[]::text[] as backup_codes,
    NULL::timestamp with time zone as mfa_setup_completed_at;
END;
$$;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated, anon;

-- 5. Ensure realassetcoin@gmail.com has admin access
DO $$
DECLARE
  target_user_id uuid;
  user_email text := 'realassetcoin@gmail.com';
BEGIN
  -- Get user ID from auth.users
  BEGIN
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Cannot access auth.users table';
    RETURN;
  END;
  
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User % not found in auth.users', user_email;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found user % with ID: %', user_email, target_user_id;
  
  -- Ensure user has admin role in profiles table
  BEGIN
    -- Try to update existing profile
    UPDATE profiles 
    SET role = 'admin',
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- If no rows were updated, insert new profile
    IF NOT FOUND THEN
      INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
      VALUES (
        target_user_id,
        user_email,
        'Admin User',
        'admin',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        updated_at = NOW();
    END IF;
    
    RAISE NOTICE 'Ensured admin role for user %', user_email;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating profile for %: %', user_email, SQLERRM;
  END;
  
  -- Test the admin function
  IF public.is_admin(target_user_id) THEN
    RAISE NOTICE 'SUCCESS: User % now has admin access', user_email;
  ELSE
    RAISE NOTICE 'WARNING: User % admin access verification failed', user_email;
  END IF;
END;
$$;

-- 6. Create a test function to verify everything works
CREATE OR REPLACE FUNCTION public.test_admin_functions()
RETURNS TABLE(
  test_name text,
  result boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  test_result boolean;
BEGIN
  current_user_id := auth.uid();
  
  -- Test 1: is_admin function
  BEGIN
    SELECT public.is_admin() INTO test_result;
    RETURN QUERY SELECT 'is_admin'::text, test_result, 'Function executed successfully'::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'is_admin'::text, false, SQLERRM::text;
  END;
  
  -- Test 2: check_admin_access function
  BEGIN
    SELECT public.check_admin_access() INTO test_result;
    RETURN QUERY SELECT 'check_admin_access'::text, test_result, 'Function executed successfully'::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'check_admin_access'::text, false, SQLERRM::text;
  END;
  
  -- Test 3: get_current_user_profile function
  BEGIN
    PERFORM public.get_current_user_profile();
    RETURN QUERY SELECT 'get_current_user_profile'::text, true, 'Function executed successfully'::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'get_current_user_profile'::text, false, SQLERRM::text;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_admin_functions() TO authenticated;

-- 7. Run the test
SELECT * FROM public.test_admin_functions();