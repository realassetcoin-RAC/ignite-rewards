-- Test API access to subscription plans
-- This will help us verify if the issue is with the API or the component

-- Test 1: Direct table access
SELECT 'Direct table access:' as test, count(*) as result FROM public.merchant_subscription_plans;

-- Test 2: Check if we can select all columns
SELECT 'Full data access:' as test, id, name, price_monthly, is_active FROM public.merchant_subscription_plans LIMIT 3;

-- Test 3: Check RLS status
SELECT 'RLS Status:' as test, 
  CASE 
    WHEN relrowsecurity THEN 'ENABLED' 
    ELSE 'DISABLED' 
  END as result
FROM pg_class 
WHERE relname = 'merchant_subscription_plans' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Test 4: Check current user and permissions
SELECT 'Current user:' as test, current_user as result;
SELECT 'Session user:' as test, session_user as result;

-- Test 5: Check if we're authenticated
SELECT 'Auth check:' as test, 
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED' 
    ELSE 'NOT AUTHENTICATED' 
  END as result;

-- Test 6: Check user profile and role
SELECT 'User profile:' as test, 
  p.role as user_role,
  p.email as user_email
FROM public.profiles p 
WHERE p.id = auth.uid();

-- Test 7: Verify all 5 plans exist with correct data
SELECT 'Plan verification:' as test, 
  plan_number, 
  name, 
  price_monthly, 
  price_yearly,
  monthly_points,
  monthly_transactions,
  is_active,
  popular
FROM public.merchant_subscription_plans 
ORDER BY plan_number;


