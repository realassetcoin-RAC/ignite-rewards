-- SCHEMA DIAGNOSTIC SCRIPT
-- This script identifies the actual schema configuration and data location
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================================================
-- PART 1: CHECK SCHEMA EXISTENCE AND STRUCTURE
-- ============================================================================

-- Check if api schema exists
SELECT 
  'api schema exists' as check_name,
  EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'api') as result;

-- Check if public schema exists  
SELECT 
  'public schema exists' as check_name,
  EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'public') as result;

-- ============================================================================
-- PART 2: CHECK PROFILES TABLE IN BOTH SCHEMAS
-- ============================================================================

-- Check profiles table in api schema
SELECT 
  'api.profiles table exists' as check_name,
  EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'profiles'
  ) as result;

-- Check profiles table in public schema
SELECT 
  'public.profiles table exists' as check_name,
  EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) as result;

-- ============================================================================
-- PART 3: CHECK DATA IN BOTH SCHEMAS
-- ============================================================================

-- Count profiles in api schema
SELECT 
  'api.profiles count' as check_name,
  COALESCE(
    (SELECT COUNT(*)::text FROM api.profiles), 
    'TABLE DOES NOT EXIST'
  ) as result;

-- Count profiles in public schema
SELECT 
  'public.profiles count' as check_name,
  COALESCE(
    (SELECT COUNT(*)::text FROM public.profiles), 
    'TABLE DOES NOT EXIST'
  ) as result;

-- ============================================================================
-- PART 4: CHECK ADMIN USER IN BOTH SCHEMAS
-- ============================================================================

-- Check admin user in api.profiles
SELECT 
  'admin user in api.profiles' as check_name,
  CASE 
    WHEN NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'profiles')
    THEN 'TABLE DOES NOT EXIST'
    WHEN EXISTS(SELECT 1 FROM api.profiles WHERE email = 'realassetcoin@gmail.com' AND role = 'admin')
    THEN 'EXISTS'
    ELSE 'NOT FOUND'
  END as result;

-- Check admin user in public.profiles
SELECT 
  'admin user in public.profiles' as check_name,
  CASE 
    WHEN NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN 'TABLE DOES NOT EXIST'
    WHEN EXISTS(SELECT 1 FROM public.profiles WHERE email = 'realassetcoin@gmail.com' AND role = 'admin')
    THEN 'EXISTS'
    ELSE 'NOT FOUND'
  END as result;

-- ============================================================================
-- PART 5: CHECK RPC FUNCTIONS AND THEIR SCHEMA REFERENCES
-- ============================================================================

-- Check which functions exist
SELECT 
  'RPC functions' as check_name,
  string_agg(proname, ', ') as result
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
  AND p.proname IN ('is_admin', 'check_admin_access', 'get_current_user_profile');

-- Check function definitions for schema references
SELECT 
  'Function schema references' as check_name,
  CASE 
    WHEN EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_admin')
    THEN 'Functions exist - check definitions manually'
    ELSE 'Functions do not exist'
  END as result;

-- ============================================================================
-- PART 6: CHECK CURRENT USER AND AUTH STATE
-- ============================================================================

-- Check current authenticated user
SELECT 
  'Current user ID' as check_name,
  COALESCE(auth.uid()::text, 'NO USER AUTHENTICATED') as result;

-- Check if current user exists in auth.users
SELECT 
  'Current user in auth.users' as check_name,
  CASE 
    WHEN auth.uid() IS NULL THEN 'NO USER AUTHENTICATED'
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid())
    THEN 'EXISTS'
    ELSE 'NOT FOUND'
  END as result;

-- ============================================================================
-- PART 7: SUMMARY AND RECOMMENDATIONS
-- ============================================================================

-- Generate summary
SELECT 
  'DIAGNOSTIC SUMMARY' as section,
  '==================' as details
UNION ALL
SELECT 
  'Schema Configuration' as section,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'profiles')
         AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN 'BOTH SCHEMAS HAVE PROFILES TABLE - CONFLICT!'
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'profiles')
    THEN 'ONLY api.profiles EXISTS'
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN 'ONLY public.profiles EXISTS'
    ELSE 'NO PROFILES TABLE FOUND'
  END as details
UNION ALL
SELECT 
  'Admin User Location' as section,
  CASE 
    WHEN EXISTS(SELECT 1 FROM api.profiles WHERE email = 'realassetcoin@gmail.com' AND role = 'admin')
         AND EXISTS(SELECT 1 FROM public.profiles WHERE email = 'realassetcoin@gmail.com' AND role = 'admin')
    THEN 'EXISTS IN BOTH SCHEMAS'
    WHEN EXISTS(SELECT 1 FROM api.profiles WHERE email = 'realassetcoin@gmail.com' AND role = 'admin')
    THEN 'EXISTS IN api.profiles ONLY'
    WHEN EXISTS(SELECT 1 FROM public.profiles WHERE email = 'realassetcoin@gmail.com' AND role = 'admin')
    THEN 'EXISTS IN public.profiles ONLY'
    ELSE 'NOT FOUND IN ANY SCHEMA'
  END as details
UNION ALL
SELECT 
  'Recommended Action' as section,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'profiles')
         AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN 'CONSOLIDATE TO SINGLE SCHEMA - CHOOSE public.profiles'
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'profiles')
    THEN 'UPDATE FRONTEND TO USE api.profiles OR MIGRATE TO public.profiles'
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN 'UPDATE RPC FUNCTIONS TO USE public.profiles CONSISTENTLY'
    ELSE 'CREATE PROFILES TABLE IN public SCHEMA'
  END as details;