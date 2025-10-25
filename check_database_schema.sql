-- Database Schema Check Script
-- This script will check the current state of the database before making changes

-- =============================================================================
-- 1. CHECK IF MERCHANT_SUBSCRIPTION_PLANS TABLE EXISTS
-- =============================================================================

-- Check in public schema
SELECT 
  'public.merchant_subscription_plans' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans'
    ) THEN 'EXISTS' 
    ELSE 'NOT EXISTS' 
  END as status;

-- Check in api schema
SELECT 
  'api.merchant_subscription_plans' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
    ) THEN 'EXISTS' 
    ELSE 'NOT EXISTS' 
  END as status;

-- =============================================================================
-- 2. CHECK COLUMNS IN EXISTING TABLES
-- =============================================================================

-- Check columns in public schema table (if it exists)
SELECT 
  'public.merchant_subscription_plans' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'merchant_subscription_plans'
ORDER BY ordinal_position;

-- Check columns in api schema table (if it exists)
SELECT 
  'api.merchant_subscription_plans' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'api' 
  AND table_name = 'merchant_subscription_plans'
ORDER BY ordinal_position;

-- =============================================================================
-- 3. CHECK DATA IN EXISTING TABLES
-- =============================================================================

-- Check data in public schema table (if it exists)
SELECT 
  'public.merchant_subscription_plans' as table_name,
  COUNT(*) as row_count,
  string_agg(name, ', ') as plan_names
FROM public.merchant_subscription_plans
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans'
);

-- Check data in api schema table (if it exists)
SELECT 
  'api.merchant_subscription_plans' as table_name,
  COUNT(*) as row_count,
  string_agg(name, ', ') as plan_names
FROM api.merchant_subscription_plans
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
);

-- =============================================================================
-- 4. CHECK RLS POLICIES
-- =============================================================================

-- Check RLS policies on public schema table
SELECT 
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
  AND tablename = 'merchant_subscription_plans';

-- Check RLS policies on api schema table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'api' 
  AND tablename = 'merchant_subscription_plans';

-- =============================================================================
-- 5. CHECK PERMISSIONS
-- =============================================================================

-- Check table permissions
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'merchant_subscription_plans'
ORDER BY schemaname;

-- =============================================================================
-- 6. SUMMARY REPORT
-- =============================================================================

DO $$
DECLARE
  public_exists boolean;
  api_exists boolean;
  public_count integer := 0;
  api_count integer := 0;
BEGIN
  -- Check if tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans'
  ) INTO public_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
  ) INTO api_exists;
  
  -- Count rows if tables exist
  IF public_exists THEN
    SELECT COUNT(*) INTO public_count FROM public.merchant_subscription_plans;
  END IF;
  
  IF api_exists THEN
    SELECT COUNT(*) INTO api_count FROM api.merchant_subscription_plans;
  END IF;
  
  -- Report results
  RAISE NOTICE '';
  RAISE NOTICE '=== DATABASE SCHEMA CHECK RESULTS ===';
  RAISE NOTICE '';
  RAISE NOTICE 'public.merchant_subscription_plans:';
  RAISE NOTICE '  - Exists: %', public_exists;
  RAISE NOTICE '  - Row count: %', public_count;
  RAISE NOTICE '';
  RAISE NOTICE 'api.merchant_subscription_plans:';
  RAISE NOTICE '  - Exists: %', api_exists;
  RAISE NOTICE '  - Row count: %', api_count;
  RAISE NOTICE '';
  
  IF public_exists AND public_count > 0 THEN
    RAISE NOTICE '✅ RECOMMENDATION: Use public.merchant_subscription_plans (has data)';
  ELSIF api_exists AND api_count > 0 THEN
    RAISE NOTICE '✅ RECOMMENDATION: Use api.merchant_subscription_plans (has data)';
  ELSIF public_exists THEN
    RAISE NOTICE '⚠️  RECOMMENDATION: Use public.merchant_subscription_plans (empty table)';
  ELSIF api_exists THEN
    RAISE NOTICE '⚠️  RECOMMENDATION: Use api.merchant_subscription_plans (empty table)';
  ELSE
    RAISE NOTICE '❌ RECOMMENDATION: Create table in public schema';
  END IF;
  
  RAISE NOTICE '';
END $$;
