-- Update Subscription Plan Prices
-- Date: 2025-09-30
-- Purpose: Set correct prices for all subscription plans

-- Update StartUp Plan
UPDATE public.merchant_subscription_plans 
SET 
    price = 20,
    max_points_distribution = 100,
    currency = 'USD',
    billing_cycle = 'monthly'
WHERE plan_name = 'StartUp Plan';

-- Update Momentum Plan
UPDATE public.merchant_subscription_plans 
SET 
    price = 50,
    max_points_distribution = 300,
    currency = 'USD',
    billing_cycle = 'monthly'
WHERE plan_name = 'Momentum Plan';

-- Update Energizer Plan
UPDATE public.merchant_subscription_plans 
SET 
    price = 100,
    max_points_distribution = 600,
    currency = 'USD',
    billing_cycle = 'monthly'
WHERE plan_name = 'Energizer Plan';

-- Update Cloud Plan
UPDATE public.merchant_subscription_plans 
SET 
    price = 250,
    max_points_distribution = 1800,
    currency = 'USD',
    billing_cycle = 'monthly'
WHERE plan_name = 'Cloud Plan';

-- Update Super Plan
UPDATE public.merchant_subscription_plans 
SET 
    price = 500,
    max_points_distribution = 4000,
    currency = 'USD',
    billing_cycle = 'monthly'
WHERE plan_name = 'Super Plan';

-- Verify the updates
SELECT 
    plan_name,
    display_name,
    price,
    currency,
    max_transactions,
    max_points_distribution,
    billing_cycle,
    is_active
FROM public.merchant_subscription_plans
ORDER BY price ASC;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '=== SUBSCRIPTION PLAN PRICES UPDATED ===';
    RAISE NOTICE 'All plans now have correct pricing';
    RAISE NOTICE 'StartUp: $20/mo, 100 points, 100 txns';
    RAISE NOTICE 'Momentum: $50/mo, 300 points, 300 txns';
    RAISE NOTICE 'Energizer: $100/mo, 600 points, 600 txns';
    RAISE NOTICE 'Cloud: $250/mo, 1800 points, 1800 txns';
    RAISE NOTICE 'Super: $500/mo, 4000 points, 4000 txns';
END $$;

