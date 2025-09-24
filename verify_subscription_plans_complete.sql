-- Complete verification script for subscription plans
-- This will test every aspect to ensure everything is working

-- Test 1: Verify table exists and has correct structure
SELECT 'Table Structure Check:' as test;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans'
ORDER BY ordinal_position;

-- Test 2: Verify data exists
SELECT 'Data Verification:' as test;
SELECT 
  count(*) as total_plans,
  count(*) FILTER (WHERE is_active = true) as active_plans,
  count(*) FILTER (WHERE popular = true) as popular_plans
FROM public.merchant_subscription_plans;

-- Test 3: Show all plans with key details
SELECT 'All Plans:' as test;
SELECT 
  plan_number,
  name,
  price_monthly,
  price_yearly,
  monthly_points,
  monthly_transactions,
  is_active,
  popular,
  created_at
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Test 4: Check RLS status
SELECT 'RLS Status:' as test;
SELECT 
  CASE 
    WHEN relrowsecurity THEN 'ENABLED' 
    ELSE 'DISABLED' 
  END as rls_status
FROM pg_class 
WHERE relname = 'merchant_subscription_plans' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Test 5: Check RLS policies
SELECT 'RLS Policies:' as test;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'merchant_subscription_plans'
ORDER BY cmd, policyname;

-- Test 6: Test current user access
SELECT 'User Access Test:' as test;
SELECT 
  current_user as current_user,
  session_user as session_user,
  auth.uid() as auth_uid;

-- Test 7: Test if we can select from the table (this will show permission issues)
SELECT 'Direct Select Test:' as test;
SELECT 
  CASE 
    WHEN count(*) > 0 THEN 'SUCCESS - Can access data' 
    ELSE 'FAILED - Cannot access data' 
  END as result,
  count(*) as record_count
FROM public.merchant_subscription_plans;

-- Test 8: Test specific query that the component uses
SELECT 'Component Query Test:' as test;
SELECT 
  id,
  name,
  description,
  price_monthly,
  price_yearly,
  monthly_points,
  monthly_transactions,
  features,
  trial_days,
  is_active,
  popular,
  plan_number,
  valid_from,
  valid_until,
  created_at,
  updated_at
FROM public.merchant_subscription_plans
ORDER BY created_at DESC
LIMIT 5;

-- Test 9: Check if admin function exists and works
SELECT 'Admin Function Test:' as test;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_admin_access') 
    THEN 'Function EXISTS' 
    ELSE 'Function DOES NOT EXIST' 
  END as admin_function_status;

-- Test 10: Final verification
SELECT 'Final Verification:' as test;
SELECT 
  'All tests completed' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.merchant_subscription_plans WHERE is_active = true) 
    THEN 'SUCCESS - Active plans found' 
    ELSE 'FAILED - No active plans' 
  END as final_result;


