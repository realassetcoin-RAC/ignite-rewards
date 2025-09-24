-- Safe fix for standardized public schema
-- Handles existing policies and tables gracefully

-- First, let's check if the table exists and what columns it has
-- (This is just for reference - you can run this to see current state)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans'
-- ORDER BY ordinal_position;

-- Create the table if it doesn't exist, or add missing columns if it does
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

-- Add any missing columns to existing table
DO $$
BEGIN
  -- Add price_yearly if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'price_yearly') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN price_yearly DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- Add monthly_points if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'monthly_points') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN monthly_points INTEGER DEFAULT 0;
  END IF;
  
  -- Add monthly_transactions if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'monthly_transactions') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN monthly_transactions INTEGER DEFAULT 0;
  END IF;
  
  -- Add popular if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'popular') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN popular BOOLEAN DEFAULT false;
  END IF;
  
  -- Add plan_number if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'plan_number') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN plan_number INTEGER;
  END IF;
  
  -- Add valid_from if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'valid_from') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN valid_from TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
  
  -- Add valid_until if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'valid_until') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN valid_until TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Safely handle existing policies - only create if they don't exist
DO $$
BEGIN
  -- Create "Anyone can view active valid plans" policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'merchant_subscription_plans' 
    AND policyname = 'Anyone can view active valid plans'
  ) THEN
    CREATE POLICY "Anyone can view active valid plans" 
    ON public.merchant_subscription_plans 
    FOR SELECT 
    TO authenticated, anon
    USING (
      is_active = true 
      AND (valid_from IS NULL OR valid_from <= now())
      AND (valid_until IS NULL OR valid_until >= now())
    );
  END IF;
  
  -- Create "Admins can manage all plans" policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'merchant_subscription_plans' 
    AND policyname = 'Admins can manage all plans'
  ) THEN
    CREATE POLICY "Admins can manage all plans" 
    ON public.merchant_subscription_plans 
    FOR ALL 
    TO authenticated
    USING (public.check_admin_access());
  END IF;
END $$;

-- Create indexes for better performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active 
ON public.merchant_subscription_plans (is_active);

CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_validity 
ON public.merchant_subscription_plans (valid_from, valid_until, is_active);

CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_number 
ON public.merchant_subscription_plans (plan_number);

-- Clear existing plans and insert the 5 exact plans from user's table
DELETE FROM public.merchant_subscription_plans;

-- Insert the 5 subscription plans from the user's table
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
  plan_number,
  valid_from,
  valid_until
) VALUES 

-- Plan #1: StartUp
(
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
  null
),

-- Plan #2: Momentum Plan
(
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
  null
),

-- Plan #3: Energizer Plan (Popular)
(
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
  null
),

-- Plan #4: Cloud9 Plan
(
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
  null
),

-- Plan #5: Super Plan
(
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
  null
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
  monthly_transactions as "Monthly Transactions",
  popular,
  is_active
FROM public.merchant_subscription_plans 
ORDER BY plan_number;

-- Show completion message
SELECT '✅ Public schema subscription plans table fixed and populated successfully!' as status;


