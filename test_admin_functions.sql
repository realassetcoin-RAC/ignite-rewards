-- TEST ADMIN FUNCTIONS
-- This script tests the admin-related functions in your database

-- Test 1: Check if is_admin() function exists and works
SELECT 'Testing is_admin() function...' as test;
SELECT public.is_admin() as is_admin_user;

-- Test 2: Check if check_admin_access() function exists and works
SELECT 'Testing check_admin_access() function...' as test;
SELECT public.check_admin_access() as admin_access_check;

-- Test 3: Check current user context
SELECT 'Current user context:' as info;
SELECT auth.uid() as current_user_id;

-- Test 4: Check if there are any admin users in the profiles table
SELECT 'Admin users in profiles table:' as info;
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Test 5: Check if the current user has admin role
SELECT 'Current user admin status:' as info;
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN 'Current user IS an admin'
    ELSE 'Current user is NOT an admin'
  END as admin_status;

-- Test 6: List all available functions in public schema
SELECT 'Available functions in public schema:' as info;
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%admin%'
ORDER BY routine_name;

-- Test 7: Check if functions exist
SELECT 'Function existence check:' as info;
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'is_admin'
    ) THEN 'is_admin() function EXISTS'
    ELSE 'is_admin() function does NOT exist'
  END as is_admin_function_exists;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'check_admin_access'
    ) THEN 'check_admin_access() function EXISTS'
    ELSE 'check_admin_access() function does NOT exist'
  END as check_admin_access_function_exists;
