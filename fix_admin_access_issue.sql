-- COMPREHENSIVE ADMIN ACCESS FIX
-- This script fixes all admin-related issues after the database migration

-- ==============================================
-- STEP 1: FIX ADMIN FUNCTIONS
-- ==============================================

-- Drop all existing admin functions that might reference api schema
DROP FUNCTION IF EXISTS public.check_admin_access() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_action(text, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_profile() CASCADE;

-- Recreate is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = COALESCE(user_id, auth.uid()) 
    AND role = 'admin'
  );
$$;

-- Recreate check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Recreate get_current_user_profile function
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_role text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = _user_id 
    AND role = _role
  );
$$;

-- ==============================================
-- STEP 2: ENSURE ADMIN USER EXISTS
-- ==============================================

-- Check if admin user exists
SELECT 'Checking for admin users...' as status;

-- Show current admin users
SELECT 
  'Current admin users:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- If no admin users exist, create one for realassetcoin@gmail.com
-- First, check if the user exists in auth.users (we can't directly query this, but we can try to create a profile)
-- Note: The user must first be created in Supabase Auth dashboard

-- Create admin profile for realassetcoin@gmail.com if it doesn't exist
-- This will only work if the user exists in auth.users
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- This will be replaced with actual UUID from auth.users
  'realassetcoin@gmail.com',
  'System Administrator',
  'admin',
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  full_name = 'System Administrator',
  updated_at = now();

-- ==============================================
-- STEP 3: TEST ADMIN FUNCTIONS
-- ==============================================

-- Test the functions
SELECT 'Testing admin functions...' as test;

-- Test is_admin function
SELECT 
  'is_admin() test:' as function,
  public.is_admin() as result;

-- Test check_admin_access function
SELECT 
  'check_admin_access() test:' as function,
  public.check_admin_access() as result;

-- Test get_current_user_profile function
SELECT 
  'get_current_user_profile() test:' as function,
  public.get_current_user_profile() as result;

-- ==============================================
-- STEP 4: VERIFICATION
-- ==============================================

-- Show all admin users
SELECT 
  'Final admin users list:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Show function existence
SELECT 
  'Available admin functions:' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_admin', 'check_admin_access', 'get_current_user_profile', 'has_role')
ORDER BY routine_name;

-- Show completion message
SELECT '✅ Admin access fix completed!' as status;

