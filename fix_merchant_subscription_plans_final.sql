-- FINAL FIX: Create merchant_subscription_plans table in public schema with all required columns
-- This ensures the admin dashboard can properly display and manage subscription plans

-- Drop the table if it exists in api schema (cleanup)
DROP TABLE IF EXISTS api.merchant_subscription_plans CASCADE;

-- Create the table in public schema with all required columns
CREATE TABLE IF NOT EXISTS public.merchant_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  monthly_transactions INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  popular BOOLEAN DEFAULT false,
  plan_number INTEGER,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active valid plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can manage all plans" ON public.merchant_subscription_plans;

-- Create RLS policies
CREATE POLICY "Anyone can view active valid plans" 
ON public.merchant_subscription_plans 
FOR SELECT 
TO authenticated, anon
USING (
  is_active = true 
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_until IS NULL OR valid_until >= now())
);

CREATE POLICY "Admins can manage all plans" 
ON public.merchant_subscription_plans 
FOR ALL 
TO authenticated
USING (public.check_admin_access());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active 
ON public.merchant_subscription_plans (is_active);

CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_validity 
ON public.merchant_subscription_plans (valid_from, valid_until, is_active);

CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_number 
ON public.merchant_subscription_plans (plan_number);

-- Create or replace the function to get valid plans
CREATE OR REPLACE FUNCTION public.get_valid_subscription_plans()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  monthly_points INTEGER,
  monthly_transactions INTEGER,
  features JSONB,
  trial_days INTEGER,
  popular BOOLEAN,
  plan_number INTEGER,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price_monthly,
    p.price_yearly,
    p.monthly_points,
    p.monthly_transactions,
    p.features,
    p.trial_days,
    p.popular,
    p.plan_number,
    p.valid_from,
    p.valid_until,
    p.created_at,
    p.updated_at
  FROM public.merchant_subscription_plans p
  WHERE p.is_active = true
    AND (p.valid_from IS NULL OR p.valid_from <= now())
    AND (p.valid_until IS NULL OR p.valid_until >= now())
  ORDER BY p.plan_number ASC, p.price_monthly ASC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_valid_subscription_plans() TO authenticated, anon;

-- Insert the 5 subscription plans from the user's table
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
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  monthly_points = EXCLUDED.monthly_points,
  monthly_transactions = EXCLUDED.monthly_transactions,
  features = EXCLUDED.features,
  trial_days = EXCLUDED.trial_days,
  is_active = EXCLUDED.is_active,
  popular = EXCLUDED.popular,
  plan_number = EXCLUDED.plan_number,
  valid_from = EXCLUDED.valid_from,
  valid_until = EXCLUDED.valid_until,
  updated_at = now();

-- Verify the plans were inserted correctly
SELECT 
  'Subscription Plans Summary:' as info,
  count(*) as total_plans,
  count(*) FILTER (WHERE is_active = true) as active_plans,
  count(*) FILTER (WHERE popular = true) as popular_plans
FROM public.merchant_subscription_plans;

-- Show all plans with key details
SELECT 
  plan_number as "Plan #",
  name as "Plan Name",
  price_monthly as "Monthly Price $",
  price_yearly as "Yearly Price $",
  monthly_points as "Monthly Points",
  monthly_transactions as "Monthly Transactions",
  popular,
  is_active
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Test the function
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
SELECT '✅ Merchant subscription plans table created and populated successfully!' as status;


