-- Migration to add validity dates and yearly pricing to merchant subscription plans
-- This enables time-based plan availability and yearly pricing options

-- Add new columns to merchant_subscription_plans table
ALTER TABLE public.merchant_subscription_plans 
ADD COLUMN IF NOT EXISTS price_yearly DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_transactions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plan_number INTEGER;

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

-- Add comment to the table
COMMENT ON TABLE public.merchant_subscription_plans IS 'Merchant subscription plans with validity dates and yearly pricing options';
COMMENT ON COLUMN public.merchant_subscription_plans.price_yearly IS 'Yearly price for the subscription plan';
COMMENT ON COLUMN public.merchant_subscription_plans.monthly_points IS 'Number of points allocated per month';
COMMENT ON COLUMN public.merchant_subscription_plans.monthly_transactions IS 'Number of transactions allowed per month';
COMMENT ON COLUMN public.merchant_subscription_plans.valid_from IS 'Plan becomes available from this date (NULL means available immediately)';
COMMENT ON COLUMN public.merchant_subscription_plans.valid_until IS 'Plan expires after this date (NULL means no expiration)';
COMMENT ON COLUMN public.merchant_subscription_plans.popular IS 'Whether this plan is marked as popular/recommended';
COMMENT ON COLUMN public.merchant_subscription_plans.plan_number IS 'Display order number for the plan';
