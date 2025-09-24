-- DIAGNOSE ADMIN ACCESS ISSUE
-- Run this script to identify the exact problem with admin access

-- ==============================================
-- STEP 1: CHECK AUTHENTICATION STATE
-- ==============================================

-- Check current authenticated user (if any)
SELECT 
  'Current authenticated user:' as info,
  auth.uid() as user_id,
  auth.email() as user_email;

-- ==============================================
-- STEP 2: CHECK PROFILES TABLE STRUCTURE
-- ==============================================

-- Check if profiles table exists
SELECT 
  'profiles table exists:' as info,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) as table_exists;

-- Check profiles table structure
SELECT 
  'profiles table columns:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check profiles table constraints
SELECT 
  'profiles table constraints:' as info,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- ==============================================
-- STEP 3: CHECK ROLE ENUM TYPE
-- ==============================================

-- Check if app_role enum exists
SELECT 
  'app_role enum exists:' as info,
  EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'app_role'
  ) as enum_exists;

-- Check app_role enum values
SELECT 
  'app_role enum values:' as info,
  enumlabel as role_value
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'app_role'
)
ORDER BY enumsortorder;

-- ==============================================
-- STEP 4: CHECK EXISTING PROFILES
-- ==============================================

-- Check all profiles
SELECT 
  'All profiles:' as info,
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM public.profiles 
ORDER BY created_at DESC;

-- Check specifically for realassetcoin@gmail.com
SELECT 
  'realassetcoin@gmail.com profile:' as info,
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM public.profiles 
WHERE email = 'realassetcoin@gmail.com';

-- Check admin users
SELECT 
  'Admin users:' as info,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'::app_role OR role = 'admin'
ORDER BY created_at DESC;

-- ==============================================
-- STEP 5: CHECK ADMIN FUNCTIONS
-- ==============================================

-- Check if admin functions exist
SELECT 
  'Admin functions exist:' as info,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_admin', 'check_admin_access', 'get_current_user_profile')
ORDER BY routine_name;

-- Test admin functions (if authenticated)
SELECT 
  'Testing admin functions:' as info,
  public.is_admin() as is_admin_result,
  public.check_admin_access() as check_admin_result;

-- ==============================================
-- STEP 6: CHECK RLS POLICIES
-- ==============================================

-- Check RLS status
SELECT 
  'RLS status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Check RLS policies
SELECT 
  'RLS policies:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- ==============================================
-- STEP 7: CHECK PERMISSIONS
-- ==============================================

-- Check table permissions
SELECT 
  'Table permissions:' as info,
  table_schema,
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY grantee, privilege_type;

-- ==============================================
-- STEP 8: SUMMARY AND RECOMMENDATIONS
-- ==============================================

-- Provide summary
SELECT 'DIAGNOSIS SUMMARY:' as info;
SELECT '=================' as separator;

-- Check if the main issue is identified
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'realassetcoin@gmail.com') 
    THEN '❌ ISSUE: No profile exists for realassetcoin@gmail.com'
    WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'realassetcoin@gmail.com' AND (role = 'admin'::app_role OR role = 'admin'))
    THEN '❌ ISSUE: Profile exists but user is not admin'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'is_admin')
    THEN '❌ ISSUE: is_admin function does not exist'
    ELSE '✅ All checks passed - issue may be elsewhere'
  END as diagnosis;

-- Provide recommendations
SELECT 'RECOMMENDATIONS:' as info;
SELECT '================' as separator;
SELECT '1. Run the fix_admin_access_comprehensive.sql script' as rec1;
SELECT '2. Sign out and sign back in with realassetcoin@gmail.com' as rec2;
SELECT '3. Check browser console for JavaScript errors' as rec3;
SELECT '4. Verify Supabase project settings and API keys' as rec4;



