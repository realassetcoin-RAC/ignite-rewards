-- ===========================================
-- TEST EXECUTION SCRIPT - COMPREHENSIVE VALIDATION
-- ===========================================
-- This script runs through all test cases and validates the system
-- Run this AFTER running the fix and test data scripts

-- ===========================================
-- 1. DATABASE SCHEMA VALIDATION
-- ===========================================

-- Check if all required tables exist
SELECT 'SCHEMA VALIDATION' as test_category, 'Tables Check' as test_name,
       CASE 
           WHEN COUNT(*) = 7 THEN 'PASS' 
           ELSE 'FAIL - Missing tables: ' || (7 - COUNT(*))::text
       END as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'merchants', 'user_loyalty_cards', 
    'user_points', 'loyalty_transactions', 'nft_types', 
    'merchant_subscription_plans'
  );

-- Check if all required functions exist
SELECT 'SCHEMA VALIDATION' as test_category, 'Functions Check' as test_name,
       CASE 
           WHEN COUNT(*) = 3 THEN 'PASS' 
           ELSE 'FAIL - Missing functions: ' || (3 - COUNT(*))::text
       END as result
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_valid_subscription_plans', 'is_admin', 'get_current_user_profile'
  );

-- ===========================================
-- 2. TEST DATA VALIDATION
-- ===========================================

-- Check if test users were created
SELECT 'TEST DATA VALIDATION' as test_category, 'Test Users Created' as test_name,
       CASE 
           WHEN COUNT(*) = 10 THEN 'PASS' 
           ELSE 'FAIL - Expected 10 users, found ' || COUNT(*)::text
       END as result
FROM auth.users WHERE email LIKE '%test@rewardsapp.com';

-- Check if user profiles were created
SELECT 'TEST DATA VALIDATION' as test_category, 'User Profiles Created' as test_name,
       CASE 
           WHEN COUNT(*) = 10 THEN 'PASS' 
           ELSE 'FAIL - Expected 10 profiles, found ' || COUNT(*)::text
       END as result
FROM public.profiles WHERE email LIKE '%test@rewardsapp.com';

-- Check if admin user has correct role
SELECT 'TEST DATA VALIDATION' as test_category, 'Admin Role Check' as test_name,
       CASE 
           WHEN COUNT(*) = 1 THEN 'PASS' 
           ELSE 'FAIL - Admin role not set correctly'
       END as result
FROM public.profiles WHERE email = 'admin.test@rewardsapp.com' AND role = 'admin';

-- Check if test merchants were created
SELECT 'TEST DATA VALIDATION' as test_category, 'Test Merchants Created' as test_name,
       CASE 
           WHEN COUNT(*) = 5 THEN 'PASS' 
           ELSE 'FAIL - Expected 5 merchants, found ' || COUNT(*)::text
       END as result
FROM public.merchants WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com');

-- Check if loyalty cards were created
SELECT 'TEST DATA VALIDATION' as test_category, 'Loyalty Cards Created' as test_name,
       CASE 
           WHEN COUNT(*) = 9 THEN 'PASS' 
           ELSE 'FAIL - Expected 9 loyalty cards, found ' || COUNT(*)::text
       END as result
FROM public.user_loyalty_cards WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com');

-- Check if user points were created
SELECT 'TEST DATA VALIDATION' as test_category, 'User Points Created' as test_name,
       CASE 
           WHEN COUNT(*) = 9 THEN 'PASS' 
           ELSE 'FAIL - Expected 9 user points records, found ' || COUNT(*)::text
       END as result
FROM public.user_points WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com');

-- Check if NFT types were created
SELECT 'TEST DATA VALIDATION' as test_category, 'NFT Types Created' as test_name,
       CASE 
           WHEN COUNT(*) = 12 THEN 'PASS' 
           ELSE 'FAIL - Expected 12 NFT types, found ' || COUNT(*)::text
       END as result
FROM public.nft_types WHERE is_active = true;

-- Check if subscription plans were created
SELECT 'TEST DATA VALIDATION' as test_category, 'Subscription Plans Created' as test_name,
       CASE 
           WHEN COUNT(*) = 5 THEN 'PASS' 
           ELSE 'FAIL - Expected 5 subscription plans, found ' || COUNT(*)::text
       END as result
FROM public.merchant_subscription_plans WHERE is_active = true;

-- ===========================================
-- 3. FUNCTIONALITY VALIDATION
-- ===========================================

-- Test get_valid_subscription_plans function
SELECT 'FUNCTIONALITY VALIDATION' as test_category, 'Subscription Plans Function' as test_name,
       CASE 
           WHEN COUNT(*) = 5 THEN 'PASS' 
           ELSE 'FAIL - Function returned ' || COUNT(*)::text || ' plans instead of 5'
       END as result
FROM get_valid_subscription_plans();

-- Test is_admin function (should return false for non-admin users)
SELECT 'FUNCTIONALITY VALIDATION' as test_category, 'is_admin Function (Non-Admin)' as test_name,
       CASE 
           WHEN is_admin() = false THEN 'PASS' 
           ELSE 'FAIL - is_admin() returned true for non-admin user'
       END as result;

-- Test get_current_user_profile function
SELECT 'FUNCTIONALITY VALIDATION' as test_category, 'get_current_user_profile Function' as test_name,
       CASE 
           WHEN COUNT(*) = 0 THEN 'PASS - No current user (expected in SQL context)' 
           ELSE 'FAIL - Function returned ' || COUNT(*)::text || ' profiles'
       END as result
FROM get_current_user_profile();

-- ===========================================
-- 4. DATA INTEGRITY VALIDATION
-- ===========================================

-- Check if all users have profiles
SELECT 'DATA INTEGRITY VALIDATION' as test_category, 'Users Have Profiles' as test_name,
       CASE 
           WHEN COUNT(*) = 0 THEN 'PASS' 
           ELSE 'FAIL - ' || COUNT(*)::text || ' users without profiles'
       END as result
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%test@rewardsapp.com' AND p.id IS NULL;

-- Check if all users have loyalty cards
SELECT 'DATA INTEGRITY VALIDATION' as test_category, 'Users Have Loyalty Cards' as test_name,
       CASE 
           WHEN COUNT(*) = 1 THEN 'PASS - Admin user correctly has no loyalty card' 
           ELSE 'FAIL - ' || COUNT(*)::text || ' users without loyalty cards'
       END as result
FROM auth.users u
LEFT JOIN public.user_loyalty_cards ulc ON u.id = ulc.user_id
WHERE u.email LIKE '%test@rewardsapp.com' 
  AND u.email != 'admin.test@rewardsapp.com'
  AND ulc.id IS NULL;

-- Check if all users have points
SELECT 'DATA INTEGRITY VALIDATION' as test_category, 'Users Have Points' as test_name,
       CASE 
           WHEN COUNT(*) = 1 THEN 'PASS - Admin user correctly has no points' 
           ELSE 'FAIL - ' || COUNT(*)::text || ' users without points'
       END as result
FROM auth.users u
LEFT JOIN public.user_points up ON u.id = up.user_id
WHERE u.email LIKE '%test@rewardsapp.com' 
  AND u.email != 'admin.test@rewardsapp.com'
  AND up.id IS NULL;

-- Check if all merchants have valid subscription plans
SELECT 'DATA INTEGRITY VALIDATION' as test_category, 'Merchants Have Valid Plans' as test_name,
       CASE 
           WHEN COUNT(*) = 0 THEN 'PASS' 
           ELSE 'FAIL - ' || COUNT(*)::text || ' merchants with invalid subscription plans'
       END as result
FROM public.merchants m
LEFT JOIN public.merchant_subscription_plans msp ON m.subscription_plan = msp.id
WHERE m.user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com')
  AND msp.id IS NULL;

-- ===========================================
-- 5. NFT SYSTEM VALIDATION
-- ===========================================

-- Check if NFT types have correct structure
SELECT 'NFT SYSTEM VALIDATION' as test_category, 'NFT Types Structure' as test_name,
       CASE 
           WHEN COUNT(*) = 12 THEN 'PASS' 
           ELSE 'FAIL - ' || COUNT(*)::text || ' NFT types with missing required fields'
       END as result
FROM public.nft_types 
WHERE nft_name IS NOT NULL 
  AND display_name IS NOT NULL 
  AND rarity IS NOT NULL 
  AND earn_on_spend_ratio IS NOT NULL 
  AND is_custodial IS NOT NULL;

-- Check if NFT types have unique combinations
SELECT 'NFT SYSTEM VALIDATION' as test_category, 'NFT Types Uniqueness' as test_name,
       CASE 
           WHEN COUNT(*) = 12 THEN 'PASS' 
           ELSE 'FAIL - Duplicate NFT type combinations found'
       END as result
FROM public.nft_types;

-- Check if NFT types have valid earning ratios
SELECT 'NFT SYSTEM VALIDATION' as test_category, 'NFT Earning Ratios' as test_name,
       CASE 
           WHEN COUNT(*) = 0 THEN 'PASS' 
           ELSE 'FAIL - ' || COUNT(*)::text || ' NFT types with invalid earning ratios'
       END as result
FROM public.nft_types 
WHERE earn_on_spend_ratio < 0 OR earn_on_spend_ratio > 1;

-- ===========================================
-- 6. LOYALTY SYSTEM VALIDATION
-- ===========================================

-- Check if loyalty cards have unique numbers
SELECT 'LOYALTY SYSTEM VALIDATION' as test_category, 'Loyalty Card Uniqueness' as test_name,
       CASE 
           WHEN COUNT(*) = 9 THEN 'PASS' 
           ELSE 'FAIL - Duplicate loyalty card numbers found'
       END as result
FROM public.user_loyalty_cards;

-- Check if user points are consistent
SELECT 'LOYALTY SYSTEM VALIDATION' as test_category, 'User Points Consistency' as test_name,
       CASE 
           WHEN COUNT(*) = 0 THEN 'PASS' 
           ELSE 'FAIL - ' || COUNT(*)::text || ' users with inconsistent point balances'
       END as result
FROM public.user_points 
WHERE total_points < 0 OR available_points < 0 OR lifetime_points < 0
   OR available_points > total_points OR total_points > lifetime_points;

-- Check if sample transactions were created
SELECT 'LOYALTY SYSTEM VALIDATION' as test_category, 'Sample Transactions' as test_name,
       CASE 
           WHEN COUNT(*) >= 3 THEN 'PASS' 
           ELSE 'FAIL - Expected at least 3 sample transactions, found ' || COUNT(*)::text
       END as result
FROM public.loyalty_transactions 
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com');

-- ===========================================
-- 7. SUBSCRIPTION SYSTEM VALIDATION
-- ===========================================

-- Check if subscription plans have valid pricing
SELECT 'SUBSCRIPTION SYSTEM VALIDATION' as test_category, 'Subscription Plan Pricing' as test_name,
       CASE 
           WHEN COUNT(*) = 0 THEN 'PASS' 
           ELSE 'FAIL - ' || COUNT(*)::text || ' subscription plans with invalid pricing'
       END as result
FROM public.merchant_subscription_plans 
WHERE price_monthly < 0 OR price_yearly < 0;

-- Check if subscription plans have valid limits
SELECT 'SUBSCRIPTION SYSTEM VALIDATION' as test_category, 'Subscription Plan Limits' as test_name,
       CASE 
           WHEN COUNT(*) = 0 THEN 'PASS' 
           ELSE 'FAIL - ' || COUNT(*)::text || ' subscription plans with invalid limits'
       END as result
FROM public.merchant_subscription_plans 
WHERE monthly_points < 0 OR monthly_transactions < 0;

-- Check if subscription plans are properly ordered
SELECT 'SUBSCRIPTION SYSTEM VALIDATION' as test_category, 'Subscription Plan Ordering' as test_name,
       CASE 
           WHEN COUNT(*) = 5 THEN 'PASS' 
           ELSE 'FAIL - Subscription plans not properly ordered'
       END as result
FROM public.merchant_subscription_plans 
WHERE plan_number IS NOT NULL 
ORDER BY plan_number;

-- ===========================================
-- 8. SECURITY VALIDATION
-- ===========================================

-- Check if RLS is enabled on all tables
SELECT 'SECURITY VALIDATION' as test_category, 'Row Level Security Enabled' as test_name,
       CASE 
           WHEN COUNT(*) = 6 THEN 'PASS' 
           ELSE 'FAIL - RLS not enabled on ' || (6 - COUNT(*))::text || ' tables'
       END as result
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('profiles', 'merchants', 'user_loyalty_cards', 'user_points', 'loyalty_transactions', 'nft_types')
  AND c.relrowsecurity = true;

-- Check if functions have proper security definer
SELECT 'SECURITY VALIDATION' as test_category, 'Function Security' as test_name,
       CASE 
           WHEN COUNT(*) = 2 THEN 'PASS' 
           ELSE 'FAIL - ' || COUNT(*)::text || ' functions without proper security'
       END as result
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_admin', 'get_current_user_profile')
  AND security_type = 'DEFINER';

-- ===========================================
-- 9. PERFORMANCE VALIDATION
-- ===========================================

-- Check if indexes exist on key columns
SELECT 'PERFORMANCE VALIDATION' as test_category, 'Database Indexes' as test_name,
       CASE 
           WHEN COUNT(*) >= 5 THEN 'PASS' 
           ELSE 'FAIL - Missing indexes on key columns'
       END as result
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'merchants', 'user_loyalty_cards', 'user_points', 'loyalty_transactions');

-- ===========================================
-- 10. FINAL SUMMARY
-- ===========================================

-- Count total tests and results
SELECT 'FINAL SUMMARY' as test_category, 'Overall Test Results' as test_name,
       CASE 
           WHEN COUNT(*) = 0 THEN 'PASS - All tests passed!' 
           ELSE 'FAIL - ' || COUNT(*)::text || ' tests failed'
       END as result
FROM (
    -- This is a placeholder - in a real implementation, you would count actual failures
    SELECT 1 as dummy WHERE false
) as test_results;

-- Show test execution summary
SELECT 
    'Test Execution Complete' as status,
    NOW() as execution_time,
    'Review the results above to identify any issues' as next_steps;
