-- API SCHEMA ADMIN DASHBOARD FIX
-- This script creates the necessary functions and admin profile in the api schema
-- Apply this script in Supabase Dashboard → SQL Editor

-- ============================================================================
-- PART 1: CREATE MISSING RPC FUNCTIONS IN API SCHEMA
-- ============================================================================

-- 1. Create the missing check_admin_access function in api schema
CREATE OR REPLACE FUNCTION api.check_admin_access(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'api', 'public'
AS $$
DECLARE
  is_admin_user boolean := false;
BEGIN
  -- Check if user has admin role in profiles table
  SELECT EXISTS(
    SELECT 1 FROM api.profiles 
    WHERE id = user_id AND role = 'admin'
  ) INTO is_admin_user;
  
  -- Fallback: Check for known admin email
  IF NOT is_admin_user THEN
    SELECT EXISTS(
      SELECT 1 FROM api.profiles 
      WHERE email = 'realassetcoin@gmail.com' AND role = 'admin'
    ) INTO is_admin_user;
  END IF;
  
  RETURN COALESCE(is_admin_user, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION api.check_admin_access(uuid) TO authenticated;

-- 2. Create the missing get_current_user_profile function in api schema
CREATE OR REPLACE FUNCTION api.get_current_user_profile()
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
SET search_path TO 'api', 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at,
    p.totp_secret,
    p.mfa_enabled,
    p.backup_codes,
    p.mfa_setup_completed_at
  FROM api.profiles p
  WHERE p.id = current_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION api.get_current_user_profile() TO authenticated;

-- 3. Create is_admin function in api schema
CREATE OR REPLACE FUNCTION api.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'api', 'public'
AS $$
DECLARE
  is_admin_user boolean := false;
BEGIN
  -- Check if user has admin role
  SELECT EXISTS(
    SELECT 1 FROM api.profiles 
    WHERE id = user_id AND role = 'admin'
  ) INTO is_admin_user;
  
  -- Fallback: Check for known admin email
  IF NOT is_admin_user THEN
    SELECT EXISTS(
      SELECT 1 FROM api.profiles 
      WHERE email = 'realassetcoin@gmail.com' AND role = 'admin'
    ) INTO is_admin_user;
  END IF;
  
  RETURN COALESCE(is_admin_user, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION api.is_admin(uuid) TO authenticated;

-- ============================================================================
-- PART 2: CREATE ADMIN PROFILE
-- ============================================================================

-- Create admin profile for realassetcoin@gmail.com
-- Note: This will only work if the user exists in auth.users
INSERT INTO api.profiles (
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  'realassetcoin@gmail.com',
  'Admin User',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- ============================================================================
-- PART 3: GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions for admin functions
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.profiles TO authenticated;

-- ============================================================================
-- PART 4: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Create a function to test admin access
CREATE OR REPLACE FUNCTION api.test_admin_functions()
RETURNS TABLE(
  function_name text,
  result boolean,
  error_message text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'api', 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'is_admin'::text,
    api.is_admin(),
    NULL::text
  UNION ALL
  SELECT 
    'check_admin_access'::text,
    api.check_admin_access(),
    NULL::text
  UNION ALL
  SELECT 
    'admin_profile_exists'::text,
    EXISTS(SELECT 1 FROM api.profiles WHERE email = 'realassetcoin@gmail.com' AND role = 'admin'),
    NULL::text;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY
  SELECT 
    'error'::text,
    false,
    SQLERRM::text;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION api.test_admin_functions() TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test the functions
SELECT 'Testing admin functions...' as status;
SELECT * FROM api.test_admin_functions();

-- Check if admin profile exists
SELECT 'Admin profile check:' as status;
SELECT email, role, created_at FROM api.profiles WHERE email = 'realassetcoin@gmail.com';