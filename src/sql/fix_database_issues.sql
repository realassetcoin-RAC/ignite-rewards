-- Fix Database Issues Script
-- This script addresses the critical issues found in the comprehensive check

-- 1. Fix referral_campaigns table structure
-- Add missing columns to match application requirements
ALTER TABLE public.referral_campaigns 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS points_per_referral integer,
ADD COLUMN IF NOT EXISTS max_referrals_per_user integer;

-- Update existing data to use the new columns
UPDATE public.referral_campaigns 
SET 
  name = COALESCE(name, COALESCE(campaign_name, 'Default Campaign')),
  points_per_referral = COALESCE(reward_amount::integer, 100),
  max_referrals_per_user = COALESCE(max_referrals, 10)
WHERE name IS NULL;

-- Make the new columns NOT NULL after updating
ALTER TABLE public.referral_campaigns 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN points_per_referral SET NOT NULL,
ALTER COLUMN max_referrals_per_user SET NOT NULL;

-- 2. Create missing loyalty_cards table
CREATE TABLE IF NOT EXISTS public.loyalty_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  loyalty_number varchar(8) NOT NULL UNIQUE,
  card_type varchar(50) NOT NULL DEFAULT 'basic',
  is_active boolean DEFAULT TRUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create index for loyalty_number
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_loyalty_number ON public.loyalty_cards(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_user_id ON public.loyalty_cards(user_id);

-- 3. Create missing transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  merchant_id uuid NOT NULL,
  loyalty_number varchar(8) NOT NULL,
  transaction_amount numeric(10,2) NOT NULL,
  transaction_reference varchar(255),
  points_earned integer NOT NULL DEFAULT 0,
  transaction_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON public.transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_loyalty_number ON public.transactions(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);

-- 4. Fix discount_codes foreign key
-- First, make sure the column exists
ALTER TABLE public.discount_codes 
ADD COLUMN IF NOT EXISTS merchant_id uuid;

-- Add the foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'discount_codes_merchant_id_fkey'
  ) THEN
    ALTER TABLE public.discount_codes 
    ADD CONSTRAINT discount_codes_merchant_id_fkey 
    FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Create missing index for email_notifications
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON public.email_notifications(user_id);

-- 6. Create subscription_plans table (optional but useful)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE,
  description text,
  price_monthly numeric(10,2) NOT NULL,
  price_yearly numeric(10,2),
  features text[] DEFAULT '{}',
  transaction_limit integer,
  points_limit integer,
  is_active boolean DEFAULT TRUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, transaction_limit, points_limit)
VALUES 
  ('Basic', 'Basic plan for small merchants', 29.99, 299.99, ARRAY['basic_analytics', 'email_support'], 1000, 10000),
  ('Premium', 'Premium plan with advanced features', 79.99, 799.99, ARRAY['advanced_analytics', 'custom_nft', 'discount_codes', 'priority_support'], 5000, 50000),
  ('Enterprise', 'Enterprise plan for large businesses', 199.99, 1999.99, ARRAY['unlimited_analytics', 'custom_nft', 'discount_codes', 'api_access', 'dedicated_support'], NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- 7. Add loyalty_number column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS loyalty_number varchar(8) UNIQUE;

-- Create index for loyalty_number in profiles
CREATE INDEX IF NOT EXISTS idx_profiles_loyalty_number ON public.profiles(loyalty_number);

-- 8. Update existing profiles with loyalty numbers if they don't have them
UPDATE public.profiles 
SET loyalty_number = CONCAT(
  UPPER(LEFT(COALESCE(full_name, email), 1)),
  LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 7, '0')
)
WHERE loyalty_number IS NULL;

-- 9. Create a function to generate unique loyalty numbers
CREATE OR REPLACE FUNCTION generate_loyalty_number()
RETURNS varchar(8) AS $$
DECLARE
  new_number varchar(8);
  counter integer := 1;
BEGIN
  LOOP
    new_number := 'U' || LPAD(counter::text, 7, '0');
    
    -- Check if this number already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE loyalty_number = new_number
      UNION
      SELECT 1 FROM public.loyalty_cards WHERE loyalty_number = new_number
    ) THEN
      RETURN new_number;
    END IF;
    
    counter := counter + 1;
    
    -- Prevent infinite loop
    IF counter > 9999999 THEN
      RAISE EXCEPTION 'Unable to generate unique loyalty number';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 10. Create a trigger to automatically generate loyalty numbers for new users
CREATE OR REPLACE FUNCTION set_loyalty_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loyalty_number IS NULL THEN
    NEW.loyalty_number := generate_loyalty_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS trigger_set_loyalty_number ON public.profiles;
CREATE TRIGGER trigger_set_loyalty_number
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_loyalty_number();

-- Display completion message
SELECT 'Database issues fixed successfully!' as status;
