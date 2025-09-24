-- ===========================================
-- CHECK CURRENT SUBSCRIPTION PLANS
-- ===========================================
-- This script shows what subscription plans are currently in your database

-- Check if the table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans')
        THEN '✅ Table exists'
        ELSE '❌ Table does not exist'
    END as table_status;

-- Show current plans (if table exists)
SELECT 
    plan_number,
    name,
    description,
    price_monthly,
    price_yearly,
    monthly_points,
    monthly_transactions,
    popular,
    is_active,
    created_at
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Count total plans
SELECT 
    COUNT(*) as total_plans,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_plans,
    COUNT(CASE WHEN popular = true THEN 1 END) as popular_plans
FROM public.merchant_subscription_plans;
