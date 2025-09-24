-- COMPREHENSIVE MERCHANT SUBSCRIPTION PLANS
-- This script creates a complete set of subscription plans with detailed features

-- Clear existing plans (optional)
-- DELETE FROM public.merchant_subscription_plans;

-- Insert comprehensive subscription plans with detailed features
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

-- FREE TRIAL PLAN
(
  gen_random_uuid(),
  'Free Trial',
  'Experience our platform with full access to all features for 14 days',
  0.00,
  0.00,
  100,
  10,
  '[
    "Full platform access for 14 days",
    "Up to 10 transactions",
    "Basic customer management",
    "Email support",
    "Basic analytics dashboard",
    "QR code generation",
    "Mobile app access"
  ]'::jsonb,
  14,
  true,
  false,
  0,
  now(),
  null,
  now(),
  now()
),

-- STARTER PLAN
(
  gen_random_uuid(),
  'Starter',
  'Perfect for small businesses and startups looking to build customer loyalty',
  29.99,
  299.99,
  1000,
  100,
  '[
    "Basic loyalty program setup",
    "Up to 100 transactions per month",
    "Customer database management",
    "Email support (24-48 hour response)",
    "Basic analytics and reporting",
    "QR code generation",
    "Mobile app for customers",
    "Basic email marketing tools",
    "Social media integration",
    "Up to 2 staff accounts"
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

-- GROWTH PLAN (POPULAR)
(
  gen_random_uuid(),
  'Growth',
  'Ideal for growing businesses that need advanced features and better support',
  79.99,
  799.99,
  5000,
  500,
  '[
    "Advanced loyalty program features",
    "Up to 500 transactions per month",
    "Advanced customer segmentation",
    "Priority email support (12-24 hour response)",
    "Advanced analytics and insights",
    "Custom branding options",
    "API access for integrations",
    "Referral program management",
    "Multi-location support",
    "Advanced email marketing",
    "Social media management tools",
    "Up to 5 staff accounts",
    "Basic custom integrations"
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

-- PROFESSIONAL PLAN
(
  gen_random_uuid(),
  'Professional',
  'For established businesses requiring enterprise-level features and support',
  199.99,
  1999.99,
  15000,
  1500,
  '[
    "Enterprise-grade loyalty platform",
    "Up to 1500 transactions per month",
    "Advanced customer analytics",
    "24/7 phone and email support",
    "Real-time analytics dashboard",
    "White-label solution options",
    "Full API access with documentation",
    "Advanced referral and rewards system",
    "Multi-location and multi-brand management",
    "Custom integrations support",
    "Dedicated account manager",
    "Advanced reporting and insights",
    "Up to 15 staff accounts",
    "Custom training sessions"
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

-- ENTERPRISE PLAN
(
  gen_random_uuid(),
  'Enterprise',
  'For large enterprises with complex requirements and need for custom solutions',
  499.99,
  4999.99,
  50000,
  5000,
  '[
    "Custom enterprise loyalty solution",
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
),

-- SEASONAL PROMO PLAN
(
  gen_random_uuid(),
  'Holiday Special',
  'Limited-time holiday promotion with special pricing and bonus features',
  39.99,
  399.99,
  2000,
  200,
  '[
    "Growth plan features at starter price",
    "Special holiday pricing (50% off)",
    "Bonus: Extra 1000 points per month",
    "Limited time offer - valid until end of year",
    "Priority onboarding support",
    "Holiday-themed email templates",
    "Special holiday analytics reports"
  ]'::jsonb,
  7,
  true,
  false,
  5,
  now(),
  '2024-12-31 23:59:59+00'::timestamptz,
  now(),
  now()
),

-- NONPROFIT PLAN
(
  gen_random_uuid(),
  'Nonprofit',
  'Special pricing for registered nonprofit organizations',
  19.99,
  199.99,
  2000,
  200,
  '[
    "Special nonprofit pricing (50% off regular rates)",
    "All Growth plan features",
    "Up to 200 transactions per month",
    "Nonprofit-specific templates",
    "Donation tracking integration",
    "Volunteer management tools",
    "Grant reporting features",
    "Priority support for nonprofits"
  ]'::jsonb,
  30,
  true,
  false,
  6,
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
  count(*) FILTER (WHERE popular = true) as popular_plans,
  count(*) FILTER (WHERE price_monthly = 0) as free_plans
FROM public.merchant_subscription_plans;

-- Show all plans with key details
SELECT 
  plan_number,
  name,
  price_monthly,
  price_yearly,
  monthly_points,
  monthly_transactions,
  trial_days,
  popular,
  is_active,
  CASE 
    WHEN valid_until IS NULL THEN 'No expiration'
    ELSE valid_until::text
  END as valid_until
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Test the RPC function to ensure it works
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
SELECT '✅ Subscription plans loaded successfully!' as status;
