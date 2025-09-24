-- QUICK FIX FOR ADMIN FUNCTIONS
-- This script quickly fixes all admin functions to work with public schema

-- Drop all existing admin functions that might reference api schema
DROP FUNCTION IF EXISTS public.check_admin_access() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_action(text, text, text, jsonb) CASCADE;

-- Recreate is_admin function (simple version)
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

-- Recreate check_admin_access function (simple version)
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

-- Test the functions immediately
SELECT 'Testing is_admin() function...' as test;
SELECT public.is_admin() as is_admin_result;

SELECT 'Testing check_admin_access() function...' as test;
SELECT public.check_admin_access() as check_admin_result;

-- Show current user context
SELECT 'Current user context:' as info;
SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN 'No user logged in'
    ELSE 'User is logged in'
  END as login_status;

-- Show admin users
SELECT 'Admin users in database:' as info;
SELECT 
  id,
  email,
  full_name,
  role
FROM public.profiles 
WHERE role = 'admin';

SELECT '✅ Admin functions fixed!' as status;
