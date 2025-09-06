-- Add popular field to merchant subscription plans
-- This allows admins to mark plans as popular from the admin dashboard

-- Add the popular column to the merchant_subscription_plans table
ALTER TABLE public.merchant_subscription_plans 
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false;

-- Add the popular column to the api.merchant_subscription_plans table (if it exists)
ALTER TABLE api.merchant_subscription_plans 
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false;

-- Update existing plans to have popular = false by default
UPDATE public.merchant_subscription_plans 
SET popular = false 
WHERE popular IS NULL;

UPDATE api.merchant_subscription_plans 
SET popular = false 
WHERE popular IS NULL;

-- Add a comment to document the new column
COMMENT ON COLUMN public.merchant_subscription_plans.popular IS 'Marks this plan as popular/recommended in the merchant signup modal';
COMMENT ON COLUMN api.merchant_subscription_plans.popular IS 'Marks this plan as popular/recommended in the merchant signup modal';

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'merchant_subscription_plans' 
  AND column_name = 'popular'
  AND table_schema IN ('public', 'api');
