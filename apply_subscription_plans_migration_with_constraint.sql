-- Apply subscription plans migration with unique constraint
-- This version adds a unique constraint on the name column first

-- Add new columns to merchant_subscription_plans table
ALTER TABLE public.merchant_subscription_plans 
ADD COLUMN IF NOT EXISTS price_yearly DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_transactions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plan_number INTEGER;

-- Create unique constraint on name column (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'merchant_subscription_plans_name_unique'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD CONSTRAINT merchant_subscription_plans_name_unique UNIQUE (name);
    END IF;
END $$;

-- Create index for efficient querying by validity dates
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_validity 
ON public.merchant_subscription_plans (valid_from, valid_until, is_active);

-- Create index for plan number ordering
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_number 
ON public.merchant_subscription_plans (plan_number);

-- Update RLS policies to include validity date filtering
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.merchant_subscription_plans;

CREATE POLICY "Anyone can view active valid plans" 
ON public.merchant_subscription_plans 
FOR SELECT 
TO authenticated, anon
USING (
  is_active = true 
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_until IS NULL OR valid_until >= now())
);

-- Create function to get currently valid plans
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_valid_subscription_plans() TO authenticated, anon;

-- Create function to check if a plan is currently valid
CREATE OR REPLACE FUNCTION public.is_plan_valid(plan_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  plan_valid BOOLEAN := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM public.merchant_subscription_plans 
    WHERE id = plan_id
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= now())
      AND (valid_until IS NULL OR valid_until >= now())
  ) INTO plan_valid;
  
  RETURN plan_valid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_plan_valid(UUID) TO authenticated, anon;

-- Clear existing plans first (remove all plans to ensure clean state)
DELETE FROM public.merchant_subscription_plans;

-- Insert the 5 subscription plans with ON CONFLICT (now that we have the unique constraint)
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
) VALUES 
-- Plan 1: StartUp
(1, 'StartUp', 'Perfect for small businesses just getting started with loyalty programs', 20.00, 150.00, 100, 100, '["Basic loyalty program setup", "Up to 100 monthly points", "100 transactions per month", "Email support", "Basic analytics"]'::jsonb, 7, true, false, now(), null),
-- Plan 2: Momentum Plan
(2, 'Momentum Plan', 'Ideal for growing businesses that need more capacity and features', 50.00, 500.00, 300, 300, '["Advanced loyalty program features", "Up to 300 monthly points", "300 transactions per month", "Priority email support", "Advanced analytics", "Custom branding", "API access"]'::jsonb, 14, true, true, now(), null),
-- Plan 3: Energizer Plan
(3, 'Energizer Plan', 'For established businesses that need high-volume loyalty management', 100.00, 1000.00, 600, 600, '["Premium loyalty program features", "Up to 600 monthly points", "600 transactions per month", "Phone & email support", "Premium analytics", "Full branding customization", "Full API access", "Multi-location support", "Advanced reporting"]'::jsonb, 14, true, false, now(), null),
-- Plan 4: Cloud9 Plan
(4, 'Cloud9 Plan', 'Enterprise-level solution for large businesses with complex needs', 250.00, 2500.00, 1800, 1800, '["Enterprise loyalty program features", "Up to 1800 monthly points", "1800 transactions per month", "Dedicated account manager", "Enterprise analytics", "White-label solution", "Full API & webhook access", "Unlimited locations", "Advanced reporting & insights", "Custom integrations", "24/7 priority support"]'::jsonb, 30, true, false, now(), null),
-- Plan 5: Super Plan
(5, 'Super Plan', 'Ultimate solution for enterprise businesses with unlimited needs', 500.00, 5000.00, 4000, 4000, '["Unlimited loyalty program features", "Up to 4000 monthly points", "4000 transactions per month", "Dedicated success team", "Enterprise-grade analytics", "Complete white-label solution", "Unlimited API access", "Global multi-location support", "Advanced AI insights", "Custom development", "Unlimited integrations", "24/7 dedicated support", "SLA guarantee"]'::jsonb, 30, true, false, now(), null)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  monthly_points = EXCLUDED.monthly_points,
  monthly_transactions = EXCLUDED.monthly_transactions,
  features = EXCLUDED.features,
  popular = EXCLUDED.popular,
  plan_number = EXCLUDED.plan_number,
  valid_from = EXCLUDED.valid_from,
  valid_until = EXCLUDED.valid_until,
  updated_at = now();

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
