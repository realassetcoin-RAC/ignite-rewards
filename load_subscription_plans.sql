-- LOAD MERCHANT SUBSCRIPTION PLANS
-- This script populates the merchant_subscription_plans table with comprehensive plans

-- Clear existing plans (optional - remove if you want to keep existing data)
-- DELETE FROM public.merchant_subscription_plans;

-- Insert comprehensive subscription plans
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
-- STARTER PLAN
(
  gen_random_uuid(),
  'Starter',
  'Perfect for small businesses just getting started with loyalty programs',
  29.99,
  299.99,
  1000,
  100,
  '["Basic loyalty program", "Up to 100 transactions/month", "Email support", "Basic analytics", "QR code generation", "Customer management"]'::jsonb,
  14,
  true,
  false,
  1,
  now(),
  null,
  now(),
  now()
),

-- GROWTH PLAN
(
  gen_random_uuid(),
  'Growth',
  'Ideal for growing businesses that need more advanced features',
  79.99,
  799.99,
  5000,
  500,
  '["Advanced loyalty program", "Up to 500 transactions/month", "Priority support", "Advanced analytics", "Custom branding", "API access", "Referral system", "Multi-location support"]'::jsonb,
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
  'For established businesses requiring enterprise-level features',
  199.99,
  1999.99,
  15000,
  1500,
  '["Enterprise loyalty program", "Up to 1500 transactions/month", "24/7 support", "Real-time analytics", "White-label solution", "Full API access", "Advanced referral system", "Multi-location management", "Custom integrations", "Dedicated account manager"]'::jsonb,
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
  'For large enterprises with complex loyalty program requirements',
  499.99,
  4999.99,
  50000,
  5000,
  '["Custom enterprise solution", "Unlimited transactions", "24/7 dedicated support", "Custom analytics dashboard", "Full white-label solution", "Unlimited API access", "Advanced referral & rewards system", "Multi-brand management", "Custom integrations", "Dedicated success manager", "SLA guarantee", "Custom reporting"]'::jsonb,
  30,
  true,
  false,
  4,
  now(),
  null,
  now(),
  now()
),

-- FREE TRIAL PLAN
(
  gen_random_uuid(),
  'Free Trial',
  'Try our platform risk-free with full access to all features',
  0.00,
  0.00,
  100,
  10,
  '["Full platform access", "Up to 10 transactions", "Email support", "Basic analytics", "14-day trial period"]'::jsonb,
  14,
  true,
  false,
  0,
  now(),
  null,
  now(),
  now()
),

-- SEASONAL PROMO PLAN
(
  gen_random_uuid(),
  'Holiday Special',
  'Limited-time holiday promotion with special pricing',
  39.99,
  399.99,
  2000,
  200,
  '["Growth plan features", "Special holiday pricing", "Limited time offer", "Valid until end of year"]'::jsonb,
  7,
  true,
  false,
  5,
  now(),
  '2024-12-31 23:59:59+00'::timestamptz,
  now(),
  now()
);

-- Verify the plans were inserted
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
  valid_until
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Test the RPC function
SELECT 'Testing get_valid_subscription_plans function...' as test;
SELECT * FROM public.get_valid_subscription_plans() ORDER BY plan_number;

-- Show summary
SELECT 
  'Subscription Plans Loaded Successfully!' as status,
  count(*) as total_plans,
  count(*) FILTER (WHERE is_active = true) as active_plans,
  count(*) FILTER (WHERE popular = true) as popular_plans
FROM public.merchant_subscription_plans;
