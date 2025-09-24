-- Insert the exact subscription plans from the user's table
-- This matches the 5 plans shown in the attached image

-- Clear existing plans first (optional - uncomment if needed)
-- DELETE FROM public.merchant_subscription_plans;

-- Insert the exact 5 subscription plans from the user's table
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

-- Plan #1: StartUp
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
  14,
  true,
  false,
  1,
  now(),
  null,
  now(),
  now()
),

-- Plan #2: Momentum Plan
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

-- Plan #3: Energizer Plan (Popular)
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

-- Plan #4: Cloud9 Plan
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
  14,
  true,
  false,
  4,
  now(),
  null,
  now(),
  now()
),

-- Plan #5: Super Plan
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
  14,
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
  'Subscription Plans Summary:' as info,
  count(*) as total_plans,
  count(*) FILTER (WHERE is_active = true) as active_plans,
  count(*) FILTER (WHERE popular = true) as popular_plans
FROM public.merchant_subscription_plans;

-- Show all plans with key details matching the user's table
SELECT 
  plan_number as "Plan #",
  name as "Plan Name",
  price_monthly as "Monthly Price $",
  price_yearly as "Yearly Price $",
  monthly_points as "Monthly Points",
  monthly_transactions as "Monthly Transactions permitted",
  popular,
  is_active
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Show completion message
SELECT '✅ Exact subscription plans from user table loaded successfully!' as status;


