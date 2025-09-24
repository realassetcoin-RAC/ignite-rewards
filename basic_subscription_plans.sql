-- BASIC MERCHANT SUBSCRIPTION PLANS
-- Simple script to load essential subscription plans

-- Insert basic subscription plans
INSERT INTO public.merchant_subscription_plans (
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
  plan_number
) VALUES 

-- FREE TRIAL
(
  'Free Trial',
  'Try our platform with full access for 14 days',
  0.00,
  0.00,
  100,
  10,
  '["14-day free trial", "Full platform access", "Up to 10 transactions", "Email support"]'::jsonb,
  14,
  true,
  false,
  0
),

-- STARTER
(
  'Starter',
  'Perfect for small businesses',
  29.99,
  299.99,
  1000,
  100,
  '["Basic loyalty program", "Up to 100 transactions/month", "Email support", "Basic analytics"]'::jsonb,
  14,
  true,
  false,
  1
),

-- GROWTH (POPULAR)
(
  'Growth',
  'Ideal for growing businesses',
  79.99,
  799.99,
  5000,
  500,
  '["Advanced features", "Up to 500 transactions/month", "Priority support", "API access"]'::jsonb,
  14,
  true,
  true,
  2
),

-- PROFESSIONAL
(
  'Professional',
  'For established businesses',
  199.99,
  1999.99,
  15000,
  1500,
  '["Enterprise features", "Up to 1500 transactions/month", "24/7 support", "White-label options"]'::jsonb,
  30,
  true,
  false,
  3
),

-- ENTERPRISE
(
  'Enterprise',
  'For large enterprises',
  499.99,
  4999.99,
  50000,
  5000,
  '["Custom solutions", "Unlimited transactions", "Dedicated support", "Full customization"]'::jsonb,
  30,
  true,
  false,
  4
);

-- Verify plans were loaded
SELECT 
  plan_number,
  name,
  price_monthly,
  price_yearly,
  popular,
  is_active
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Test the function
SELECT * FROM public.get_valid_subscription_plans() ORDER BY plan_number;
