-- DELETE ALL SUBSCRIPTION PLANS
-- This script removes all existing subscription plans from the database

-- Delete all subscription plans
DELETE FROM public.merchant_subscription_plans;

-- Verify all plans have been deleted
SELECT 
  'All subscription plans deleted successfully!' as status,
  count(*) as remaining_plans
FROM public.merchant_subscription_plans;

-- Show empty result to confirm deletion
SELECT 
  'No plans remaining' as message,
  count(*) as plan_count
FROM public.merchant_subscription_plans;

-- Test the RPC function (should return empty result)
SELECT 'Testing get_valid_subscription_plans function (should be empty)...' as test;
SELECT * FROM public.get_valid_subscription_plans();

-- Final confirmation
SELECT '✅ All subscription plans have been deleted!' as final_status;
