-- Fix merchant_monthly_points table and ensure it exists with proper permissions
-- This script ensures the table exists and has the correct structure

-- Create merchant_monthly_points table if it doesn't exist
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Merchants can view their own points" ON public.merchant_monthly_points;
DROP POLICY IF EXISTS "Merchants can update their own points" ON public.merchant_monthly_points;
DROP POLICY IF EXISTS "System can insert points records" ON public.merchant_monthly_points;
DROP POLICY IF EXISTS "Admins can manage all points" ON public.merchant_monthly_points;

-- Create RLS policies for merchant_monthly_points
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
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Grant necessary permissions
GRANT ALL ON public.merchant_monthly_points TO authenticated;
GRANT ALL ON public.merchant_monthly_points TO service_role;

-- Add comment to document the table
COMMENT ON TABLE public.merchant_monthly_points IS 'Tracks monthly points distribution for merchants with caps';

-- Ensure merchant_subscription_plans has the required columns
ALTER TABLE public.merchant_subscription_plans 
ADD COLUMN IF NOT EXISTS monthly_points_cap INTEGER DEFAULT 1000;

-- Update existing subscription plans with points caps if they don't have them
UPDATE public.merchant_subscription_plans 
SET monthly_points_cap = CASE 
  WHEN name = 'Basic' THEN 5000
  WHEN name = 'Premium' THEN 25000
  WHEN name = 'Enterprise' THEN 100000
  ELSE 1000
END
WHERE monthly_points_cap IS NULL OR monthly_points_cap = 1000;

-- Add comment to document the new field
COMMENT ON COLUMN public.merchant_subscription_plans.monthly_points_cap IS 'Maximum number of points a merchant can distribute per month';
