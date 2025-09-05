-- PERMANENT ADMIN AUTHENTICATION FIX
-- This migration provides a comprehensive solution to admin dashboard loading issues
-- by ensuring consistent function definitions and proper user permissions

-- 1. Drop all existing conflicting functions
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS api.is_admin(uuid);
DROP FUNCTION IF EXISTS public.check_admin_access();
DROP FUNCTION IF EXISTS public.get_current_user_profile();
DROP FUNCTION IF EXISTS public.debug_user_profile(uuid);

-- 2. Create a unified, robust is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public, api'
AS $$
DECLARE
  is_admin_user boolean := false;
  user_role text;
  user_exists boolean := false;
BEGIN
  -- Return false if no user_id provided
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check api.profiles first (primary location)
  BEGIN
    SELECT role::text INTO user_role
    FROM api.profiles
    WHERE id = user_id
    LIMIT 1;
    
    IF FOUND THEN
      user_exists := true;
      IF user_role IS NOT NULL AND user_role = 'admin' THEN
        is_admin_user := true;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to public schema check if api schema fails
    NULL;
  END;

  -- Check public.profiles as fallback
  IF NOT user_exists THEN
    BEGIN
      SELECT role::text INTO user_role
      FROM public.profiles
      WHERE id = user_id
      LIMIT 1;
      
      IF FOUND THEN
        user_exists := true;
        IF user_role IS NOT NULL AND user_role = 'admin' THEN
          is_admin_user := true;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail
      RAISE NOTICE 'Error checking public.profiles for user %: %', user_id, SQLERRM;
    END;
  END IF;

  -- Log result for debugging
  RAISE NOTICE 'Admin check for user %: exists=%, role=%, is_admin=%', user_id, user_exists, user_role, is_admin_user;
  
  RETURN is_admin_user;
END;
$$;

-- 3. Create a unified get_current_user_profile function
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
SET search_path TO 'public, api'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found';
  END IF;

  -- Try api.profiles first
  BEGIN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.role::text,
      p.created_at,
      p.updated_at,
      p.totp_secret,
      p.mfa_enabled,
      p.backup_codes,
      p.mfa_setup_completed_at
    FROM api.profiles p
    WHERE p.id = current_user_id
    LIMIT 1;
    
    -- If we found a record, return
    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to public schema check
    RAISE NOTICE 'Error checking api.profiles: %', SQLERRM;
  END;

  -- Try public.profiles as fallback
  BEGIN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.role::text,
      p.created_at,
      p.updated_at,
      p.totp_secret,
      p.mfa_enabled,
      p.backup_codes,
      p.mfa_setup_completed_at
    FROM public.profiles p
    WHERE p.id = current_user_id
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error accessing profiles: %', SQLERRM;
  END;
END;
$$;

-- 4. Create check_admin_access function for backward compatibility
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.is_admin(auth.uid());
$$;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;

-- 6. Ensure the specific user realassetcoin@gmail.com has admin access
-- First, find the user ID
DO $$
DECLARE
  target_user_id uuid;
  user_exists_in_api boolean := false;
  user_exists_in_public boolean := false;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'realassetcoin@gmail.com'
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User realassetcoin@gmail.com not found in auth.users';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found user realassetcoin@gmail.com with ID: %', target_user_id;
  
  -- Check if user exists in api.profiles
  SELECT EXISTS(SELECT 1 FROM api.profiles WHERE id = target_user_id) INTO user_exists_in_api;
  
  -- Check if user exists in public.profiles
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = target_user_id) INTO user_exists_in_public;
  
  RAISE NOTICE 'User exists in api.profiles: %, public.profiles: %', user_exists_in_api, user_exists_in_public;
  
  -- Ensure user has admin role in api.profiles (primary location)
  IF user_exists_in_api THEN
    UPDATE api.profiles 
    SET role = 'admin'::api.app_role,
        updated_at = NOW()
    WHERE id = target_user_id;
    RAISE NOTICE 'Updated role to admin in api.profiles';
  ELSE
    -- Create profile in api.profiles if it doesn't exist
    BEGIN
      INSERT INTO api.profiles (id, email, full_name, role, created_at, updated_at)
      SELECT 
        target_user_id,
        'realassetcoin@gmail.com',
        COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
        'admin'::api.app_role,
        NOW(),
        NOW()
      FROM auth.users
      WHERE id = target_user_id;
      RAISE NOTICE 'Created admin profile in api.profiles';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating api.profiles record: %', SQLERRM;
    END;
  END IF;
  
  -- Ensure user has admin role in public.profiles (fallback location)
  IF user_exists_in_public THEN
    UPDATE public.profiles 
    SET role = 'admin'::public.app_role,
        updated_at = NOW()
    WHERE id = target_user_id;
    RAISE NOTICE 'Updated role to admin in public.profiles';
  ELSE
    -- Create profile in public.profiles if it doesn't exist
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
      SELECT 
        target_user_id,
        'realassetcoin@gmail.com',
        COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
        'admin'::public.app_role,
        NOW(),
        NOW()
      FROM auth.users
      WHERE id = target_user_id;
      RAISE NOTICE 'Created admin profile in public.profiles';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating public.profiles record: %', SQLERRM;
    END;
  END IF;
  
  -- Test the admin function
  IF public.is_admin(target_user_id) THEN
    RAISE NOTICE 'SUCCESS: User realassetcoin@gmail.com now has admin access';
  ELSE
    RAISE NOTICE 'ERROR: User realassetcoin@gmail.com still does not have admin access';
  END IF;
END;
$$;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_profiles_role ON api.profiles(role);
CREATE INDEX IF NOT EXISTS idx_public_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_api_profiles_email ON api.profiles(email);
CREATE INDEX IF NOT EXISTS idx_public_profiles_email ON public.profiles(email);

-- 8. Create a diagnostic function for troubleshooting
CREATE OR REPLACE FUNCTION public.diagnose_admin_access(check_email text DEFAULT NULL)
RETURNS TABLE(
  schema_name text,
  user_id uuid,
  email text,
  role text,
  full_name text,
  is_admin_result boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public, api'
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- If email provided, get that user's ID, otherwise use current user
  IF check_email IS NOT NULL THEN
    SELECT id INTO target_user_id FROM auth.users WHERE auth.users.email = check_email LIMIT 1;
    IF target_user_id IS NULL THEN
      RAISE EXCEPTION 'User with email % not found', check_email;
    END IF;
  ELSE
    target_user_id := auth.uid();
    IF target_user_id IS NULL THEN
      RAISE EXCEPTION 'No authenticated user found';
    END IF;
  END IF;

  -- Check api.profiles
  RETURN QUERY
  SELECT 
    'api'::text as schema_name,
    p.id,
    p.email,
    p.role::text,
    p.full_name,
    public.is_admin(p.id) as is_admin_result,
    p.created_at
  FROM api.profiles p
  WHERE p.id = target_user_id;

  -- Check public.profiles
  RETURN QUERY
  SELECT 
    'public'::text as schema_name,
    p.id,
    p.email,
    p.role::text,
    p.full_name,
    public.is_admin(p.id) as is_admin_result,
    p.created_at
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.diagnose_admin_access(text) TO authenticated;

-- 9. Test the functions work correctly
SELECT public.diagnose_admin_access('realassetcoin@gmail.com');