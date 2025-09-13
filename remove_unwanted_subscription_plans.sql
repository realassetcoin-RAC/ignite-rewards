-- Remove unwanted subscription plans (Premium, Enterprise, Basic)
-- Keep only the 5 plans from the provided table: StartUp, Momentum Plan, Energizer Plan, Cloud9 Plan, Super Plan

-- Remove plans that are not in the approved list
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

-- Verify the remaining plans
SELECT 
  plan_number,
  name,
  price_monthly,
  price_yearly,
  monthly_points,
  monthly_transactions,
  popular,
  is_active,
  created_at
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Show count of remaining plans
SELECT COUNT(*) as remaining_plans FROM public.merchant_subscription_plans;
