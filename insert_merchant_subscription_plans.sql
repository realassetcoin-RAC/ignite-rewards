-- Insert the 5 merchant subscription plans based on the provided table
-- These plans include validity dates and yearly pricing options

-- Clear existing plans (optional - remove this if you want to keep existing data)
-- DELETE FROM public.merchant_subscription_plans;

-- Insert Plan 1: StartUp
INSERT INTO public.merchant_subscription_plans (
  plan_number,
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
  valid_from,
  valid_until
) VALUES (
  1,
  'StartUp',
  'Perfect for small businesses just getting started with loyalty programs',
  20.00,
  150.00,
  100,
  100,
  '["Basic loyalty program setup", "Up to 100 monthly points", "100 transactions per month", "Email support", "Basic analytics"]'::jsonb,
  7,
  true,
  false,
  now(),
  null -- No expiration date
);

-- Insert Plan 2: Momentum Plan
INSERT INTO public.merchant_subscription_plans (
  plan_number,
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
  valid_from,
  valid_until
) VALUES (
  2,
  'Momentum Plan',
  'Ideal for growing businesses that need more capacity and features',
  50.00,
  500.00,
  300,
  300,
  '["Advanced loyalty program features", "Up to 300 monthly points", "300 transactions per month", "Priority email support", "Advanced analytics", "Custom branding", "API access"]'::jsonb,
  14,
  true,
  true, -- Marked as popular
  now(),
  null -- No expiration date
);

-- Insert Plan 3: Energizer Plan
INSERT INTO public.merchant_subscription_plans (
  plan_number,
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
  valid_from,
  valid_until
) VALUES (
  3,
  'Energizer Plan',
  'For established businesses that need high-volume loyalty management',
  100.00,
  1000.00,
  600,
  600,
  '["Premium loyalty program features", "Up to 600 monthly points", "600 transactions per month", "Phone & email support", "Premium analytics", "Full branding customization", "Full API access", "Multi-location support", "Advanced reporting"]'::jsonb,
  14,
  true,
  false,
  now(),
  null -- No expiration date
);

-- Insert Plan 4: Cloud9 Plan
INSERT INTO public.merchant_subscription_plans (
  plan_number,
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
  valid_from,
  valid_until
) VALUES (
  4,
  'Cloud9 Plan',
  'Enterprise-level solution for large businesses with complex needs',
  250.00,
  2500.00,
  1800,
  1800,
  '["Enterprise loyalty program features", "Up to 1800 monthly points", "1800 transactions per month", "Dedicated account manager", "Enterprise analytics", "White-label solution", "Full API & webhook access", "Unlimited locations", "Advanced reporting & insights", "Custom integrations", "24/7 priority support"]'::jsonb,
  30,
  true,
  false,
  now(),
  null -- No expiration date
);

-- Insert Plan 5: Super Plan
INSERT INTO public.merchant_subscription_plans (
  plan_number,
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
  valid_from,
  valid_until
) VALUES (
  5,
  'Super Plan',
  'Ultimate solution for enterprise businesses with unlimited needs',
  500.00,
  5000.00,
  4000,
  4000,
  '["Unlimited loyalty program features", "Up to 4000 monthly points", "4000 transactions per month", "Dedicated success team", "Enterprise-grade analytics", "Complete white-label solution", "Unlimited API access", "Global multi-location support", "Advanced AI insights", "Custom development", "Unlimited integrations", "24/7 dedicated support", "SLA guarantee"]'::jsonb,
  30,
  true,
  false,
  now(),
  null -- No expiration date
);

-- Verify the inserted plans
SELECT 
  plan_number,
  name,
  price_monthly,
  price_yearly,
  monthly_points,
  monthly_transactions,
  popular,
  valid_from,
  valid_until,
  is_active
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Test the get_valid_subscription_plans function
SELECT * FROM public.get_valid_subscription_plans();
