-- FINAL FIX FOR ADMIN FUNCTIONS
-- This script fixes the admin functions and handles the ON CONFLICT issue properly

-- ==============================================
-- STEP 1: CHECK TABLE STRUCTURE
-- ==============================================

-- Check the profiles table structure and constraints
SELECT 
  'profiles table constraints:' as info,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- Check the profiles table structure
SELECT 
  'profiles table columns:' as info,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ==============================================
-- STEP 2: DROP AND RECREATE FUNCTIONS
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
-- STEP 3: CREATE ADMIN USER (WITHOUT ON CONFLICT)
-- ==============================================

-- First, check if admin user already exists
SELECT 
  'Checking for existing admin users...' as status,
  count(*) as admin_count
FROM public.profiles 
WHERE role = 'admin'::app_role;

-- Create admin user for realassetcoin@gmail.com if it doesn't exist
-- Use a different approach since we don't know the constraint structure
DO $$
BEGIN
  -- Check if admin user already exists
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = 'realassetcoin@gmail.com'
  ) THEN
    -- Insert new admin user
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
    );
    RAISE NOTICE 'Admin user created successfully';
  ELSE
    -- Update existing user to admin
    UPDATE public.profiles 
    SET 
      role = 'admin'::app_role,
      full_name = 'System Administrator',
      updated_at = now()
    WHERE email = 'realassetcoin@gmail.com';
    RAISE NOTICE 'Existing user updated to admin';
  END IF;
END $$;

-- ==============================================
-- STEP 4: TEST THE FUNCTIONS
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

-- Test has_role function
SELECT 
  'has_role(admin) test:' as function,
  public.has_role('admin', auth.uid()) as result;

-- Test get_current_user_profile function
SELECT 
  'get_current_user_profile() test:' as function,
  public.get_current_user_profile() as result;

-- ==============================================
-- STEP 5: VERIFICATION
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
SELECT '✅ Admin functions fixed successfully!' as status;

