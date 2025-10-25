-- Test Popular Plan Update Functionality
-- This script tests if the popular plan checkbox functionality works correctly

-- =============================================================================
-- 1. CHECK CURRENT TABLE STRUCTURE
-- =============================================================================

-- Check if the popular column exists and its current values
SELECT 
  id,
  name,
  popular,
  is_active,
  plan_number,
  created_at
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- =============================================================================
-- 2. TEST UPDATE FUNCTIONALITY
-- =============================================================================

-- Test updating the first plan to be popular
UPDATE public.merchant_subscription_plans 
SET popular = true 
WHERE id = (
  SELECT id FROM public.merchant_subscription_plans 
  ORDER BY created_at 
  LIMIT 1
);

-- Check if the update worked
SELECT 
  id,
  name,
  popular,
  is_active,
  plan_number
FROM public.merchant_subscription_plans 
WHERE popular = true;

-- =============================================================================
-- 3. TEST TOGGLE FUNCTIONALITY
-- =============================================================================

-- Test toggling the popular status back to false
UPDATE public.merchant_subscription_plans 
SET popular = false 
WHERE popular = true 
LIMIT 1;

-- Verify the toggle worked
SELECT 
  id,
  name,
  popular,
  is_active,
  plan_number
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- =============================================================================
-- 4. TEST MULTIPLE UPDATES
-- =============================================================================

-- Test updating multiple fields including popular
UPDATE public.merchant_subscription_plans 
SET 
  popular = true,
  name = 'Updated Plan Name',
  price_monthly = 99.99
WHERE id = (
  SELECT id FROM public.merchant_subscription_plans 
  ORDER BY created_at 
  LIMIT 1
);

-- Verify all updates worked
SELECT 
  id,
  name,
  popular,
  price_monthly,
  is_active,
  plan_number
FROM public.merchant_subscription_plans 
WHERE name = 'Updated Plan Name';

-- =============================================================================
-- 5. RESET FOR TESTING
-- =============================================================================

-- Reset the test data back to original state
UPDATE public.merchant_subscription_plans 
SET 
  popular = false,
  name = 'StartUp',
  price_monthly = 30.00
WHERE name = 'Updated Plan Name';

-- Final verification
SELECT 
  id,
  name,
  popular,
  price_monthly,
  is_active,
  plan_number
FROM public.merchant_subscription_plans 
ORDER BY plan_number;
