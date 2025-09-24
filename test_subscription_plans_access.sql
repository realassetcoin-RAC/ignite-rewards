-- Simple test to check subscription plans access
-- Run this in Supabase SQL Editor

-- Test 1: Can we see the table?
SELECT 'Table exists:' as test, count(*) as result FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans';

-- Test 2: Can we select from it?
SELECT 'Records in table:' as test, count(*) as result FROM public.merchant_subscription_plans;

-- Test 3: Show the actual data
SELECT 'Actual data:' as test, name, price_monthly, is_active FROM public.merchant_subscription_plans LIMIT 5;

-- Test 4: Check if admin function exists
SELECT 'Admin function exists:' as test, count(*) as result FROM pg_proc WHERE proname = 'check_admin_access';

-- Test 5: Test admin access (this might fail if you're not an admin)
SELECT 'Admin access test:' as test, public.check_admin_access() as result;


