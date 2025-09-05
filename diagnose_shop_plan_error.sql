-- Diagnostic script for "Failed to save plan: the schema must be one of the following:api" error
-- Run this to understand the current state of your database

-- Check if merchant_subscription_plans table exists in public schema
SELECT 
  'merchant_subscription_plans in public schema' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans'
    ) THEN 'EXISTS'
    ELSE 'DOES NOT EXIST'
  END as result;

-- Check if merchant_subscription_plans table exists in api schema
SELECT 
  'merchant_subscription_plans in api schema' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
    ) THEN 'EXISTS'
    ELSE 'DOES NOT EXIST'
  END as result;

-- Check RLS status on merchant_subscription_plans
SELECT 
  'RLS enabled on merchant_subscription_plans' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'merchant_subscription_plans' AND rowsecurity = true
    ) THEN 'ENABLED'
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'merchant_subscription_plans' AND rowsecurity = false
    ) THEN 'DISABLED'
    ELSE 'TABLE DOES NOT EXIST'
  END as result;

-- Check RLS policies on merchant_subscription_plans
SELECT 
  'RLS policies on merchant_subscription_plans' as check_name,
  COALESCE(
    (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname = 'public' AND tablename = 'merchant_subscription_plans'),
    '0'
  ) as result;

-- Check table permissions
SELECT 
  'Table permissions for authenticated users' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_privileges 
      WHERE table_schema = 'public' 
      AND table_name = 'merchant_subscription_plans' 
      AND grantee = 'authenticated'
      AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) THEN 'HAS PERMISSIONS'
    ELSE 'NO PERMISSIONS'
  END as result;

-- Check if profiles table exists for admin role checks
SELECT 
  'profiles table in public schema' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN 'EXISTS'
    ELSE 'DOES NOT EXIST'
  END as result;

-- Check if profiles table exists in api schema
SELECT 
  'profiles table in api schema' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'api' AND table_name = 'profiles'
    ) THEN 'EXISTS'
    ELSE 'DOES NOT EXIST'
  END as result;

-- Check current user's role (if authenticated)
SELECT 
  'Current user role in public.profiles' as check_name,
  CASE 
    WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED'
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN 'ADMIN'
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid()
    ) THEN 'USER'
    ELSE 'NO PROFILE FOUND'
  END as result;

-- Check current user's role in api.profiles (if exists)
SELECT 
  'Current user role in api.profiles' as check_name,
  CASE 
    WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED'
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'api' AND table_name = 'profiles'
    ) THEN 'TABLE DOES NOT EXIST'
    WHEN EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN 'ADMIN'
    WHEN EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid()
    ) THEN 'USER'
    ELSE 'NO PROFILE FOUND'
  END as result;

-- Check if we can actually query the merchant_subscription_plans table
DO $$
DECLARE
  plan_count integer;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO plan_count FROM public.merchant_subscription_plans;
    RAISE NOTICE '✅ Can query merchant_subscription_plans: % plans found', plan_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Cannot query merchant_subscription_plans: %', SQLERRM;
  END;
END $$;

-- Check schema configuration
SELECT 
  'Schema Configuration Summary' as section,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN 'CORRECT: Both tables in public schema'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
    ) THEN 'ISSUE: merchant_subscription_plans in api schema (should be public)'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'api' AND table_name = 'profiles'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN 'ISSUE: profiles in api schema (should be public)'
    ELSE 'ISSUE: Missing required tables'
  END as result;