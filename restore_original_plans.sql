-- RESTORE ORIGINAL SUBSCRIPTION PLANS
-- This script deletes all existing plans and restores the original plans you shared

-- Delete all existing subscription plans
DELETE FROM public.merchant_subscription_plans;

-- Insert the original plans you shared
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

-- BASIC PLAN
(
  gen_random_uuid(),
  'Basic',
  'Perfect for small businesses getting started with loyalty programs',
  19.99,
  199.99,
  500,
  50,
  '[
    "Basic loyalty program setup",
    "Up to 50 transactions per month",
    "Customer database management",
    "Email support",
    "Basic analytics",
    "QR code generation",
    "Mobile app access"
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

-- PROFESSIONAL PLAN (POPULAR)
(
  gen_random_uuid(),
  'Professional',
  'Ideal for growing businesses with advanced features',
  49.99,
  499.99,
  2000,
  200,
  '[
    "Advanced loyalty program features",
    "Up to 200 transactions per month",
    "Advanced customer segmentation",
    "Priority email support",
    "Advanced analytics and insights",
    "Custom branding options",
    "API access",
    "Referral program management",
    "Multi-location support",
    "Advanced email marketing"
  ]'::jsonb,
  14,
  true,
  true,
  2,
  now(),
  null,
  now(),
  now()
),

-- ENTERPRISE PLAN
(
  gen_random_uuid(),
  'Enterprise',
  'For established businesses requiring enterprise-level features',
  99.99,
  999.99,
  10000,
  1000,
  '[
    "Enterprise-grade loyalty platform",
    "Up to 1000 transactions per month",
    "Advanced customer analytics",
    "24/7 phone and email support",
    "Real-time analytics dashboard",
    "White-label solution options",
    "Full API access with documentation",
    "Advanced referral and rewards system",
    "Multi-location and multi-brand management",
    "Custom integrations support",
    "Dedicated account manager",
    "Advanced reporting and insights"
  ]'::jsonb,
  30,
  true,
  false,
  3,
  now(),
  null,
  now(),
  now()
),

-- PREMIUM PLAN
(
  gen_random_uuid(),
  'Premium',
  'For large enterprises with unlimited needs',
  199.99,
  1999.99,
  50000,
  5000,
  '[
    "Unlimited loyalty program features",
    "Unlimited transactions",
    "24/7 dedicated support team",
    "Custom analytics and reporting dashboard",
    "Full white-label solution",
    "Unlimited API access with custom endpoints",
    "Advanced multi-brand and multi-location management",
    "Custom integrations and third-party connections",
    "Dedicated success manager",
    "SLA guarantee (99.9% uptime)",
    "Custom reporting and data export",
    "Unlimited staff accounts",
    "Custom training and onboarding",
    "Priority feature requests",
    "Advanced security features"
  ]'::jsonb,
  30,
  true,
  false,
  4,
  now(),
  null,
  now(),
  now()
);

-- Verify the plans were restored correctly
SELECT 
  'Original Plans Restored Successfully!' as status,
  count(*) as total_plans,
  count(*) FILTER (WHERE is_active = true) as active_plans,
  count(*) FILTER (WHERE popular = true) as popular_plans
FROM public.merchant_subscription_plans;

-- Show all restored plans
SELECT 
  plan_number,
  name,
  description,
  price_monthly,
  price_yearly,
  monthly_points,
  monthly_transactions,
  trial_days,
  popular,
  is_active
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Test the RPC function
SELECT 'Testing get_valid_subscription_plans function...' as test;
SELECT 
  name,
  price_monthly,
  price_yearly,
  monthly_points,
  popular
FROM public.get_valid_subscription_plans() 
ORDER BY plan_number;

-- Show completion message
SELECT '✅ Original subscription plans restored successfully!' as final_status;
