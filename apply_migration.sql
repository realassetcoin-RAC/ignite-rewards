-- Apply the new migration for email limits and points caps
-- Run this in your Supabase SQL Editor

-- Add new columns to merchant_subscription_plans table
DO $$
BEGIN
  -- Check and add email_limit if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'email_limit') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN email_limit INTEGER DEFAULT 1;
  END IF;
  
  -- Check and add monthly_points_cap if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'monthly_points_cap') THEN
    ALTER TABLE public.merchant_subscription_plans ADD COLUMN monthly_points_cap INTEGER DEFAULT 1000;
  END IF;
END $$;

-- Create merchant_emails table to store merchant email addresses
CREATE TABLE IF NOT EXISTS public.merchant_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, email_address)
);

-- Enable RLS for merchant_emails
ALTER TABLE public.merchant_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for merchant_emails
DROP POLICY IF EXISTS "Merchants can view their own emails" ON public.merchant_emails;
DROP POLICY IF EXISTS "Merchants can insert their own emails" ON public.merchant_emails;
DROP POLICY IF EXISTS "Merchants can update their own emails" ON public.merchant_emails;
DROP POLICY IF EXISTS "Merchants can delete their own emails" ON public.merchant_emails;
DROP POLICY IF EXISTS "Admins can manage all emails" ON public.merchant_emails;

CREATE POLICY "Merchants can view their own emails" 
ON public.merchant_emails 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = merchant_emails.merchant_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can insert their own emails" 
ON public.merchant_emails 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = merchant_emails.merchant_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can update their own emails" 
ON public.merchant_emails 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = merchant_emails.merchant_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can delete their own emails" 
ON public.merchant_emails 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = merchant_emails.merchant_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all emails" 
ON public.merchant_emails 
FOR ALL 
TO authenticated
USING (public.check_admin_access());

-- Create merchant_monthly_points table to track points distribution
CREATE TABLE IF NOT EXISTS public.merchant_monthly_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  points_distributed INTEGER DEFAULT 0,
  points_cap INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, year, month)
);

-- Enable RLS for merchant_monthly_points
ALTER TABLE public.merchant_monthly_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for merchant_monthly_points
DROP POLICY IF EXISTS "Merchants can view their own points" ON public.merchant_monthly_points;
DROP POLICY IF EXISTS "Merchants can update their own points" ON public.merchant_monthly_points;
DROP POLICY IF EXISTS "System can insert points records" ON public.merchant_monthly_points;
DROP POLICY IF EXISTS "Admins can manage all points" ON public.merchant_monthly_points;

CREATE POLICY "Merchants can view their own points" 
ON public.merchant_monthly_points 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = merchant_monthly_points.merchant_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can update their own points" 
ON public.merchant_monthly_points 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = merchant_monthly_points.merchant_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert points records" 
ON public.merchant_monthly_points 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage all points" 
ON public.merchant_monthly_points 
FOR ALL 
TO authenticated
USING (public.check_admin_access());

-- Update existing subscription plans with email limits and points caps
UPDATE public.merchant_subscription_plans 
SET 
  email_limit = CASE 
    WHEN name = 'Basic' THEN 3
    WHEN name = 'Premium' THEN 10
    WHEN name = 'Enterprise' THEN 50
    ELSE 1
  END,
  monthly_points_cap = CASE 
    WHEN name = 'Basic' THEN 5000
    WHEN name = 'Premium' THEN 25000
    WHEN name = 'Enterprise' THEN 100000
    ELSE 1000
  END
WHERE email_limit IS NULL OR monthly_points_cap IS NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN public.merchant_subscription_plans.email_limit IS 'Maximum number of email addresses a merchant can add for their business';
COMMENT ON COLUMN public.merchant_subscription_plans.monthly_points_cap IS 'Maximum number of points a merchant can distribute per month';
COMMENT ON TABLE public.merchant_emails IS 'Stores email addresses associated with merchant accounts';
COMMENT ON TABLE public.merchant_monthly_points IS 'Tracks monthly points distribution for merchants with caps';
