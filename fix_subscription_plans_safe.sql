-- Safe fix for subscription plans cleanup
-- This script checks what exists first and handles different scenarios

-- =====================================================
-- 1. CHECK WHAT EXISTS FIRST
-- =====================================================

-- Check if merchant_subscription_plans table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_subscription_plans' AND table_schema = 'public') THEN
        RAISE NOTICE 'merchant_subscription_plans table does not exist. Skipping subscription plan cleanup.';
        RETURN;
    END IF;
END $$;

-- Check current subscription plans
SELECT 
  id,
  name,
  price_monthly,
  price_yearly,
  monthly_points,
  monthly_transactions,
  popular,
  is_active,
  created_at
FROM public.merchant_subscription_plans 
ORDER BY name;

-- =====================================================
-- 2. CLEAN UP SUBSCRIPTION PLANS
-- =====================================================

-- Remove all unwanted subscription plans
DELETE FROM public.merchant_subscription_plans 
WHERE name NOT IN (
  'StartUp', 
  'Momentum Plan', 
  'Energizer Plan', 
  'Cloud9 Plan', 
  'Super Plan'
);

-- Also remove any plans with similar names that might exist
DELETE FROM public.merchant_subscription_plans 
WHERE name ILIKE '%premium%' 
   OR name ILIKE '%enterprise%' 
   OR name ILIKE '%basic%'
   OR name ILIKE '%starter%'
   OR name ILIKE '%professional%';

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Verify the remaining plans
SELECT 
  plan_number,
  name,
  price_monthly,
  price_yearly,
  monthly_points,
  monthly_transactions,
  popular,
  is_active
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Show count of remaining plans
SELECT COUNT(*) as remaining_plans FROM public.merchant_subscription_plans;
