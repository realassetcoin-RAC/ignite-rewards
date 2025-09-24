-- SIMPLE ADMIN FUNCTION TEST
-- Test the admin functions after fixing them

-- Test 1: Check if functions exist
SELECT 'Function existence check:' as test;
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_admin', 'check_admin_access')
ORDER BY routine_name;

-- Test 2: Test is_admin function
SELECT 'Testing is_admin()...' as test;
SELECT public.is_admin() as result;

-- Test 3: Test check_admin_access function  
SELECT 'Testing check_admin_access()...' as test;
SELECT public.check_admin_access() as result;

-- Test 4: Show current user
SELECT 'Current user info:' as info;
SELECT auth.uid() as user_id;

-- Test 5: Show all profiles
SELECT 'All profiles:' as info;
SELECT id, email, role FROM public.profiles LIMIT 5;

-- Test 6: Show admin profiles
SELECT 'Admin profiles:' as info;
SELECT id, email, role FROM public.profiles WHERE role = 'admin';
