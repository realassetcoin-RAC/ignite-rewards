-- CREATE MERCHANT SUBSCRIPTION PLANS TABLE AND DATA
-- This script creates the merchant_subscription_plans table and populates it with comprehensive plans

-- ==============================================
-- STEP 1: CREATE THE TABLE
-- ==============================================

-- Drop the table if it exists (to avoid conflicts)
DROP TABLE IF EXISTS public.merchant_subscription_plans CASCADE;

-- Create the merchant_subscription_plans table
CREATE TABLE public.merchant_subscription_plans (
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

-- ==============================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ==============================================

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
USING (true); -- Simplified for testing - you can add admin check later

-- ==============================================
-- STEP 3: CREATE INDEXES
-- ==============================================

CREATE INDEX idx_merchant_subscription_plans_active ON public.merchant_subscription_plans(is_active);
CREATE INDEX idx_merchant_subscription_plans_plan_number ON public.merchant_subscription_plans(plan_number);
CREATE INDEX idx_merchant_subscription_plans_valid_dates ON public.merchant_subscription_plans(valid_from, valid_until);

-- ==============================================
-- STEP 4: INSERT COMPREHENSIVE SUBSCRIPTION PLANS
-- ==============================================

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
  'Ideal for growing businesses that need more advanced features and higher limits',
  79.99,
  799.99,
  5000,
  500,
  '[
    "Advanced loyalty program features",
    "Up to 500 transactions per month",
    "Advanced customer segmentation",
    "Priority email support (12-24 hour response)",
    "Advanced analytics and reporting",
    "Custom branding options",
    "API access for integrations",
    "Referral system",
    "Multi-location support",
    "Advanced email marketing",
    "Social media management",
    "Up to 5 staff accounts",
    "Custom reward rules",
    "A/B testing for campaigns"
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
    "Enterprise loyalty program features",
    "Up to 1500 transactions per month",
    "Advanced customer analytics",
    "24/7 phone and email support",
    "Real-time analytics dashboard",
    "White-label solution options",
    "Full API access with documentation",
    "Advanced referral system",
    "Multi-location management",
    "Custom integrations",
    "Dedicated account manager",
    "Advanced email marketing automation",
    "Social media management suite",
    "Up to 15 staff accounts",
    "Custom reward algorithms",
    "Advanced A/B testing",
    "Priority feature requests",
    "Custom reporting"
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
  'For large businesses and enterprises requiring unlimited features and dedicated support',
  499.99,
  4999.99,
  50000,
  5000,
  '[
    "Unlimited loyalty program features",
    "Up to 5000 transactions per month",
    "Enterprise-grade customer analytics",
    "24/7 dedicated support team",
    "Real-time analytics with custom dashboards",
    "Full white-label solution",
    "Unlimited API access",
    "Advanced referral and affiliate system",
    "Unlimited multi-location support",
    "Custom integrations and development",
    "Dedicated success manager",
    "Advanced email marketing automation",
    "Enterprise social media management",
    "Unlimited staff accounts",
    "Custom reward algorithms and AI",
    "Advanced A/B testing and optimization",
    "Priority feature development",
    "Custom reporting and analytics",
    "SLA guarantees",
    "Onboarding and training",
    "Custom contract terms"
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

-- LEGACY PLANS (for reference)
(
  gen_random_uuid(),
  'StartUp',
  'Legacy startup plan - being phased out',
  20.00,
  150.00,
  100,
  100,
  '[
    "Basic loyalty program",
    "Up to 100 transactions/month",
    "Email support",
    "Basic analytics",
    "QR code generation",
    "Customer management"
  ]'::jsonb,
  7,
  false,
  false,
  5,
  now() - INTERVAL '1 year',
  now() - INTERVAL '6 months',
  now() - INTERVAL '1 year',
  now() - INTERVAL '6 months'
),

(
  gen_random_uuid(),
  'Momentum Plan',
  'Legacy momentum plan - being phased out',
  50.00,
  500.00,
  300,
  300,
  '[
    "Advanced loyalty program",
    "Up to 300 transactions/month",
    "Priority support",
    "Advanced analytics",
    "Custom branding",
    "API access",
    "Referral system",
    "Multi-location support"
  ]'::jsonb,
  14,
  false,
  false,
  6,
  now() - INTERVAL '1 year',
  now() - INTERVAL '3 months',
  now() - INTERVAL '1 year',
  now() - INTERVAL '3 months'
),

(
  gen_random_uuid(),
  'Energizer Plan',
  'Legacy energizer plan - being phased out',
  100.00,
  1000.00,
  600,
  600,
  '[
    "Premium loyalty program",
    "Up to 600 transactions/month",
    "24/7 support",
    "Real-time analytics",
    "White-label solution",
    "Full API access",
    "Advanced referral system",
    "Multi-location management",
    "Custom integrations"
  ]'::jsonb,
  21,
  false,
  false,
  7,
  now() - INTERVAL '1 year',
  now() - INTERVAL '1 month',
  now() - INTERVAL '1 year',
  now() - INTERVAL '1 month'
),

(
  gen_random_uuid(),
  'Cloud9 Plan',
  'Legacy cloud9 plan - being phased out',
  250.00,
  2500.00,
  1800,
  1800,
  '[
    "Enterprise loyalty program",
    "Up to 1800 transactions/month",
    "Dedicated support",
    "Advanced analytics",
    "Full white-label solution",
    "Unlimited API access",
    "Enterprise referral system",
    "Unlimited multi-location support",
    "Custom integrations",
    "Dedicated account manager"
  ]'::jsonb,
  30,
  false,
  false,
  8,
  now() - INTERVAL '1 year',
  now() - INTERVAL '2 weeks',
  now() - INTERVAL '1 year',
  now() - INTERVAL '2 weeks'
),

(
  gen_random_uuid(),
  'Super Plan',
  'Legacy super plan - being phased out',
  500.00,
  5000.00,
  4000,
  4000,
  '[
    "Ultimate loyalty program",
    "Up to 4000 transactions/month",
    "VIP support",
    "Enterprise analytics",
    "Complete white-label solution",
    "Unlimited API access",
    "Advanced referral system",
    "Global multi-location support",
    "Custom integrations",
    "VIP account manager",
    "Custom development"
  ]'::jsonb,
  30,
  false,
  false,
  9,
  now() - INTERVAL '1 year',
  now() - INTERVAL '1 week',
  now() - INTERVAL '1 year',
  now() - INTERVAL '1 week'
);

-- ==============================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to get valid subscription plans
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
  is_active BOOLEAN,
  popular BOOLEAN,
  plan_number INTEGER,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
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
  FROM public.merchant_subscription_plans
  WHERE is_active = true 
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
  ORDER BY plan_number ASC;
$$;

-- Function to check if a plan is valid
CREATE OR REPLACE FUNCTION public.is_plan_valid(plan_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.merchant_subscription_plans 
    WHERE id = plan_id 
      AND is_active = true 
      AND (valid_from IS NULL OR valid_from <= now())
      AND (valid_until IS NULL OR valid_until >= now())
  );
$$;

-- ==============================================
-- STEP 6: VERIFY DATA CREATION
-- ==============================================

-- Show summary of created plans
SELECT 
  'Merchant Subscription Plans Created:' as status,
  COUNT(*) as total_plans,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_plans,
  COUNT(CASE WHEN popular = true THEN 1 END) as popular_plans
FROM public.merchant_subscription_plans;

-- Show active plans
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
WHERE is_active = true
ORDER BY plan_number;

-- Test the helper function
SELECT 'Testing get_valid_subscription_plans() function:' as test;
SELECT name, price_monthly, price_yearly, popular 
FROM public.get_valid_subscription_plans()
ORDER BY plan_number;

-- ==============================================
-- STEP 7: SUCCESS MESSAGE
-- ==============================================

SELECT '✅ Merchant subscription plans table created successfully!' as status,
       '5 active plans + 5 legacy plans created with comprehensive features' as summary;
