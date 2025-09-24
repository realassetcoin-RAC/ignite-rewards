-- Simple test to verify database connection and data
-- Run this in Supabase SQL Editor

-- Test 1: Basic connection
SELECT 'Connection test:' as test, 'SUCCESS' as result;

-- Test 2: Check if table exists
SELECT 'Table exists:' as test, 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans') 
    THEN 'YES' 
    ELSE 'NO' 
  END as result;

-- Test 3: Count records
SELECT 'Record count:' as test, count(*) as result FROM public.merchant_subscription_plans;

-- Test 4: Show first 3 plans
SELECT 'Sample data:' as test, name, price_monthly, is_active FROM public.merchant_subscription_plans LIMIT 3;

-- Test 5: Check RLS status
SELECT 'RLS enabled:' as test,
  CASE 
    WHEN relrowsecurity THEN 'YES' 
    ELSE 'NO' 
  END as result
FROM pg_class 
WHERE relname = 'merchant_subscription_plans' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');


