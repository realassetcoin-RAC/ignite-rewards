-- ===========================================
-- FIX SUBSCRIPTION PLANS SYNC
-- ===========================================
-- This script updates the database to match the frontend subscription plans
-- defined in src/data/subscriptionPlans.ts

-- Clear existing plans
DELETE FROM public.merchant_subscription_plans;

-- Insert the 5 subscription plans that match the frontend
INSERT INTO public.merchant_subscription_plans (
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
) VALUES 

-- Plan 1: StartUp
(
    gen_random_uuid(),
    'StartUp',
    'Perfect for small businesses just getting started',
    20.00,
    150.00,
    100,
    100,
    '[
        "100 monthly points",
        "100 monthly transactions", 
        "Basic analytics",
        "Email support",
        "Standard templates"
    ]'::jsonb,
    7,
    true,
    false,
    1,
    now(),
    null,
    now(),
    now()
),

-- Plan 2: Momentum Plan
(
    gen_random_uuid(),
    'Momentum Plan',
    'Ideal for growing businesses with moderate transaction volume',
    50.00,
    500.00,
    300,
    300,
    '[
        "300 monthly points",
        "300 monthly transactions",
        "Advanced analytics", 
        "Priority email support",
        "Custom templates",
        "Basic integrations"
    ]'::jsonb,
    14,
    true,
    false,
    2,
    now(),
    null,
    now(),
    now()
),

-- Plan 3: Energizer Plan (POPULAR)
(
    gen_random_uuid(),
    'Energizer Plan',
    'For established businesses with high transaction volume',
    100.00,
    1000.00,
    600,
    600,
    '[
        "600 monthly points",
        "600 monthly transactions",
        "Premium analytics",
        "Phone & email support", 
        "Custom branding",
        "Advanced integrations",
        "API access"
    ]'::jsonb,
    14,
    true,
    true,
    3,
    now(),
    null,
    now(),
    now()
),

-- Plan 4: Cloud9 Plan
(
    gen_random_uuid(),
    'Cloud9 Plan',
    'For large businesses requiring enterprise-level features',
    250.00,
    2500.00,
    1800,
    1800,
    '[
        "1800 monthly points",
        "1800 monthly transactions",
        "Enterprise analytics",
        "Dedicated account manager",
        "White-label solution", 
        "Custom integrations",
        "Full API access",
        "Priority feature requests"
    ]'::jsonb,
    30,
    true,
    false,
    4,
    now(),
    null,
    now(),
    now()
),

-- Plan 5: Super Plan
(
    gen_random_uuid(),
    'Super Plan',
    'For enterprise clients with maximum transaction volume',
    500.00,
    5000.00,
    4000,
    4000,
    '[
        "4000 monthly points",
        "4000 monthly transactions",
        "Custom analytics dashboard",
        "24/7 dedicated support",
        "Full white-label solution",
        "Custom development",
        "Unlimited API access",
        "Custom SLA",
        "On-site training"
    ]'::jsonb,
    30,
    true,
    false,
    5,
    now(),
    null,
    now(),
    now()
);

-- Verify the plans were inserted correctly
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

-- Success message
SELECT '✅ Subscription plans synced successfully!' as message,
       'Database now matches frontend plan definitions.' as details;
