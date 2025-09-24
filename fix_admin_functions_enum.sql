-- FIX ADMIN FUNCTIONS FOR ENUM TYPE
-- This script fixes the admin functions to work with the app_role enum type

-- ==============================================
-- STEP 1: CHECK CURRENT ENUM VALUES
-- ==============================================

-- Check what values are in the app_role enum
SELECT 
  'app_role enum values:' as info,
  unnest(enum_range(NULL::app_role)) as enum_value;

-- Check current profiles table structure
SELECT 
  'profiles table structure:' as info,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'role';

-- ==============================================
-- STEP 2: DROP AND RECREATE FUNCTIONS WITH PROPER TYPES
-- ==============================================

-- Drop existing functions
DROP FUNCTION IF EXISTS public.check_admin_access() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_profile() CASCADE;

-- Recreate is_admin function with proper enum handling
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = COALESCE(user_id, auth.uid()) 
    AND role = 'admin'::app_role
  );
$$;

-- Recreate check_admin_access function with proper enum handling
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'::app_role
  );
$$;

-- Recreate has_role function with proper enum handling
CREATE OR REPLACE FUNCTION public.has_role(_role text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = _user_id 
    AND role = _role::app_role
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
    p.role::text,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- ==============================================
-- STEP 3: TEST THE FUNCTIONS
-- ==============================================

-- Test the functions
SELECT 'Testing admin functions with enum types...' as test;

-- Test is_admin function
SELECT 
  'is_admin() test:' as function,
  public.is_admin() as result;

-- Test check_admin_access function
SELECT 
  'check_admin_access() test:' as function,
  public.check_admin_access() as result;

-- Test has_role function with different roles
SELECT 
  'has_role(admin) test:' as function,
  public.has_role('admin', auth.uid()) as result;

SELECT 
  'has_role(user) test:' as function,
  public.has_role('user', auth.uid()) as result;

-- Test get_current_user_profile function
SELECT 
  'get_current_user_profile() test:' as function,
  public.get_current_user_profile() as result;

-- ==============================================
-- STEP 4: VERIFY ADMIN USERS
-- ==============================================

-- Show all admin users
SELECT 
  'Admin users in database:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'::app_role
ORDER BY created_at DESC;

-- Show all users with their roles
SELECT 
  'All users with roles:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
ORDER BY role, created_at DESC;

-- ==============================================
-- STEP 5: CREATE ADMIN USER IF NEEDED
-- ==============================================

-- Create admin user for realassetcoin@gmail.com if it doesn't exist
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'realassetcoin@gmail.com',
  'System Administrator',
  'admin'::app_role,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin'::app_role,
  full_name = 'System Administrator',
  updated_at = now();

-- ==============================================
-- FINAL VERIFICATION
-- ==============================================

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
SELECT '✅ Admin functions fixed for enum types!' as status;

