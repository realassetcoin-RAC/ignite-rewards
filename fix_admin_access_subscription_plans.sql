-- Fix admin access to subscription plans
-- This ensures admins can view and manage subscription plans

-- First, let's make sure the table exists with all required columns
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

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'price_yearly') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN price_yearly DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'monthly_points') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN monthly_points INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'monthly_transactions') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN monthly_transactions INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'popular') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN popular BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'plan_number') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN plan_number INTEGER;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view active valid plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can manage all plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.merchant_subscription_plans;

-- Create simple, permissive policies for now
-- Policy 1: Anyone can view active plans
CREATE POLICY "Anyone can view active plans" 
ON public.merchant_subscription_plans 
FOR SELECT 
TO authenticated, anon
USING (is_active = true);

-- Policy 2: Admins can do everything
CREATE POLICY "Admins can manage all plans" 
ON public.merchant_subscription_plans 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy 3: If admin check function exists, use it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_admin_access') THEN
    -- Drop the previous admin policy and recreate with function
    DROP POLICY IF EXISTS "Admins can manage all plans" ON public.merchant_subscription_plans;
    
    CREATE POLICY "Admins can manage all plans" 
    ON public.merchant_subscription_plans 
    FOR ALL 
    TO authenticated
    USING (public.check_admin_access());
  END IF;
END $$;

-- Insert the 5 subscription plans if they don't exist
INSERT INTO public.merchant_subscription_plans (
  name, description, price_monthly, price_yearly, monthly_points, monthly_transactions, features, trial_days, is_active, popular, plan_number
) VALUES 
('StartUp', 'Perfect for small businesses just getting started', 20.00, 150.00, 100, 100, '["100 monthly points", "100 monthly transactions", "Basic analytics", "Email support", "Standard templates"]'::jsonb, 14, true, false, 1),
('Momentum Plan', 'Ideal for growing businesses with moderate transaction volume', 50.00, 500.00, 300, 300, '["300 monthly points", "300 monthly transactions", "Advanced analytics", "Priority email support", "Custom templates", "Basic integrations"]'::jsonb, 14, true, false, 2),
('Energizer Plan', 'For established businesses with high transaction volume', 100.00, 1000.00, 600, 600, '["600 monthly points", "600 monthly transactions", "Premium analytics", "Phone & email support", "Custom branding", "Advanced integrations", "API access"]'::jsonb, 14, true, true, 3),
('Cloud9 Plan', 'For large businesses requiring enterprise-level features', 250.00, 2500.00, 1800, 1800, '["1800 monthly points", "1800 monthly transactions", "Enterprise analytics", "Dedicated account manager", "White-label solution", "Custom integrations", "Full API access", "Priority feature requests"]'::jsonb, 14, true, false, 4),
('Super Plan', 'For enterprise clients with maximum transaction volume', 500.00, 5000.00, 4000, 4000, '["4000 monthly points", "4000 monthly transactions", "Custom analytics dashboard", "24/7 dedicated support", "Full white-label solution", "Custom development", "Unlimited API access", "Custom SLA", "On-site training"]'::jsonb, 14, true, false, 5)
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
  updated_at = now();

-- Verify everything worked
SELECT 'Verification:' as status, count(*) as total_plans FROM public.merchant_subscription_plans;
SELECT 'Active plans:' as status, count(*) as active_plans FROM public.merchant_subscription_plans WHERE is_active = true;

-- Show the plans
SELECT plan_number, name, price_monthly, price_yearly, monthly_points, monthly_transactions, popular, is_active 
FROM public.merchant_subscription_plans 
ORDER BY plan_number;


