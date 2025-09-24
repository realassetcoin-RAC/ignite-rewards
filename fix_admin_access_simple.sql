-- SIMPLE ADMIN ACCESS FIX
-- This script fixes the admin access issue without using ON CONFLICT
-- Run this script in your Supabase SQL editor

-- ==============================================
-- STEP 1: CHECK CURRENT STATE
-- ==============================================

-- Check if realassetcoin@gmail.com profile exists
SELECT 
  'Current profile for realassetcoin@gmail.com:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE email = 'realassetcoin@gmail.com';

-- ==============================================
-- STEP 2: ENSURE ADMIN FUNCTIONS EXIST
-- ==============================================

-- Drop and recreate admin functions
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.check_admin_access() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_profile() CASCADE;

-- Create is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = COALESCE(user_id, auth.uid()) 
    AND (role = 'admin'::app_role OR role = 'admin')
  );
$$;

-- Create check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin'::app_role OR role = 'admin')
  );
$$;

-- Create get_current_user_profile function
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
-- STEP 3: CREATE/UPDATE ADMIN USER
-- ==============================================

-- Method 1: Update existing profile if it exists
UPDATE public.profiles 
SET 
    role = 'admin'::app_role,
    full_name = 'System Administrator',
    updated_at = now()
WHERE email = 'realassetcoin@gmail.com';

-- Method 2: Insert new profile if it doesn't exist
-- This will only insert if no profile exists for this email
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'realassetcoin@gmail.com',
    'System Administrator',
    'admin'::app_role,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = 'realassetcoin@gmail.com'
);

-- ==============================================
-- STEP 4: VERIFICATION
-- ==============================================

-- Show the updated profile
SELECT 
  'Updated profile for realassetcoin@gmail.com:' as info,
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM public.profiles 
WHERE email = 'realassetcoin@gmail.com';

-- Show all admin users
SELECT 
  'All admin users:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'::app_role OR role = 'admin'
ORDER BY created_at DESC;

-- Test admin functions
SELECT 'Testing admin functions...' as test;

-- Show function existence
SELECT 
  'Available admin functions:' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_admin', 'check_admin_access', 'get_current_user_profile')
ORDER BY routine_name;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

SELECT '✅ Simple admin access fix completed!' as status;
SELECT 'Next steps:' as info;
SELECT '1. Sign out and sign back in with realassetcoin@gmail.com' as step1;
SELECT '2. Try accessing the admin dashboard again' as step2;
SELECT '3. If still having issues, check the browser console for errors' as step3;



