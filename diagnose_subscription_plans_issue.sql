-- Diagnostic script to troubleshoot subscription plans not showing in admin dashboard
-- Run this in your Supabase SQL Editor to identify the issue

-- 1. Check if the table exists
SELECT 
  'Table Existence Check:' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans') 
    THEN '✅ Table EXISTS' 
    ELSE '❌ Table DOES NOT EXIST' 
  END as result;

-- 2. Check table structure
SELECT 
  'Table Structure:' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans'
ORDER BY ordinal_position;

-- 3. Check if there are any records
SELECT 
  'Record Count:' as check_type,
  count(*) as total_records,
  count(*) FILTER (WHERE is_active = true) as active_records
FROM public.merchant_subscription_plans;

-- 4. Show all records
SELECT 
  'All Records:' as check_type,
  id,
  name,
  price_monthly,
  price_yearly,
  monthly_points,
  monthly_transactions,
  is_active,
  popular,
  plan_number
FROM public.merchant_subscription_plans
ORDER BY plan_number;

-- 5. Check RLS policies
SELECT 
  'RLS Policies:' as check_type,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'merchant_subscription_plans';

-- 6. Check if RLS is enabled
SELECT 
  'RLS Status:' as check_type,
  CASE 
    WHEN relrowsecurity THEN '✅ RLS ENABLED' 
    ELSE '❌ RLS DISABLED' 
  END as result
FROM pg_class 
WHERE relname = 'merchant_subscription_plans' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 7. Test admin access function
SELECT 
  'Admin Access Function:' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_admin_access') 
    THEN '✅ Function EXISTS' 
    ELSE '❌ Function DOES NOT EXIST' 
  END as result;

-- 8. Test current user permissions
SELECT 
  'Current User:' as check_type,
  current_user as user_name,
  session_user as session_user;

-- 9. Test if we can select from the table (this will show any permission issues)
SELECT 
  'Direct Select Test:' as check_type,
  CASE 
    WHEN count(*) > 0 THEN '✅ Can SELECT from table' 
    ELSE '❌ Cannot SELECT from table or no records' 
  END as result
FROM public.merchant_subscription_plans;

-- 10. Check if the get_valid_subscription_plans function exists
SELECT 
  'Helper Function:' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_valid_subscription_plans') 
    THEN '✅ Function EXISTS' 
    ELSE '❌ Function DOES NOT EXIST' 
  END as result;

-- 11. Test the helper function if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_valid_subscription_plans') THEN
    RAISE NOTICE 'Testing get_valid_subscription_plans function...';
  ELSE
    RAISE NOTICE 'get_valid_subscription_plans function does not exist';
  END IF;
END $$;

-- 12. Show any error messages that might be relevant
SELECT 
  'Diagnostic Complete' as status,
  'Check the results above to identify the issue' as next_step;