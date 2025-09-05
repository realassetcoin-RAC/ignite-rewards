-- Comprehensive fix for referrals and subscription plans schema configuration errors
-- This ensures all tables are in the public schema where the Supabase client expects them

-- First, check if api.merchants exists (dependency for user_referrals)
DO $$
BEGIN
  -- If merchants table exists in api schema but not in public, we need to handle it
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchants')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchants') THEN
    -- Create a simple merchants table in public schema if needed
    CREATE TABLE public.merchants (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Ensure referral_campaigns table exists (dependency for user_referrals)
CREATE TABLE IF NOT EXISTS public.referral_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  reward_points INTEGER NOT NULL DEFAULT 10,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 year'),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Drop existing user_referrals table if it has wrong structure
DO $$
BEGIN
  -- Check if the table exists with wrong structure (missing columns)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_referrals')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_referrals' AND column_name = 'referral_code') THEN
    DROP TABLE public.user_referrals CASCADE;
  END IF;
END $$;

-- Create user_referrals table with correct structure
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id),
  merchant_id UUID REFERENCES public.merchants(id),
  campaign_id UUID REFERENCES public.referral_campaigns(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'rewarded'
  reward_points INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Drop existing merchant_subscription_plans table if it has wrong structure
DO $$
BEGIN
  -- Check if the table exists with wrong structure (wrong column names)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'price')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_subscription_plans' AND column_name = 'price_monthly') THEN
    DROP TABLE public.merchant_subscription_plans CASCADE;
  END IF;
END $$;

-- Create merchant_subscription_plans table with correct structure
CREATE TABLE IF NOT EXISTS public.merchant_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '[]',
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can create their own referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can update their own referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admin full access to referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins have full access to referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.user_referrals;

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admin full access to plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Public can view active plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can view all subscription plans" ON public.merchant_subscription_plans;

DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.referral_campaigns;
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.referral_campaigns;

-- Create comprehensive RLS policies for user_referrals
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
  FOR SELECT TO authenticated
  USING (
    auth.uid() = referrer_id 
    OR auth.uid() = referred_user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create referrals" ON public.user_referrals
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = referrer_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update referrals" ON public.user_referrals
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = referrer_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = referrer_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete referrals" ON public.user_referrals
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create comprehensive RLS policies for merchant_subscription_plans
CREATE POLICY "Anyone can view plans" ON public.merchant_subscription_plans
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert plans" ON public.merchant_subscription_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update plans" ON public.merchant_subscription_plans
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete plans" ON public.merchant_subscription_plans
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create comprehensive RLS policies for referral_campaigns
CREATE POLICY "Anyone can view campaigns" ON public.referral_campaigns
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage campaigns" ON public.referral_campaigns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT ALL ON public.user_referrals TO authenticated;
GRANT ALL ON public.merchant_subscription_plans TO authenticated;
GRANT ALL ON public.referral_campaigns TO authenticated;
GRANT ALL ON public.merchants TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON public.user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON public.user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON public.merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_active ON public.referral_campaigns(is_active);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_referrals_updated_at ON public.user_referrals;
CREATE TRIGGER update_user_referrals_updated_at
  BEFORE UPDATE ON public.user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_merchant_subscription_plans_updated_at ON public.merchant_subscription_plans;
CREATE TRIGGER update_merchant_subscription_plans_updated_at
  BEFORE UPDATE ON public.merchant_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_referral_campaigns_updated_at ON public.referral_campaigns;
CREATE TRIGGER update_referral_campaigns_updated_at
  BEFORE UPDATE ON public.referral_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default data if tables are empty
DO $$
BEGIN
  -- Insert default subscription plans
  IF NOT EXISTS (SELECT 1 FROM public.merchant_subscription_plans LIMIT 1) THEN
    INSERT INTO public.merchant_subscription_plans (name, description, price_monthly, features, trial_days) VALUES
    ('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]', 30),
    ('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]', 30),
    ('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]', 30);
  END IF;

  -- Insert default referral campaign
  IF NOT EXISTS (SELECT 1 FROM public.referral_campaigns LIMIT 1) THEN
    INSERT INTO public.referral_campaigns (name, description, reward_points, start_date, end_date) VALUES
    ('Launch Campaign', 'Earn 10 points for each merchant referral with successful payment', 10, now(), now() + interval '1 year');
  END IF;
END $$;

-- Verify the tables are accessible
DO $$
DECLARE
  referrals_count INTEGER;
  plans_count INTEGER;
  campaigns_count INTEGER;
BEGIN
  -- Test query on user_referrals
  SELECT COUNT(*) INTO referrals_count FROM public.user_referrals;
  RAISE NOTICE 'user_referrals table accessible, count: %', referrals_count;

  -- Test query on merchant_subscription_plans  
  SELECT COUNT(*) INTO plans_count FROM public.merchant_subscription_plans;
  RAISE NOTICE 'merchant_subscription_plans table accessible, count: %', plans_count;

  -- Test query on referral_campaigns
  SELECT COUNT(*) INTO campaigns_count FROM public.referral_campaigns;
  RAISE NOTICE 'referral_campaigns table accessible, count: %', campaigns_count;
  
  -- Check schema configuration
  RAISE NOTICE 'All tables are in the public schema and accessible';
END $$;

-- Add helpful comments
COMMENT ON TABLE public.user_referrals IS 'Stores user referral information and tracking';
COMMENT ON TABLE public.merchant_subscription_plans IS 'Defines available subscription plans for merchants';
COMMENT ON TABLE public.referral_campaigns IS 'Manages referral campaigns and reward configurations';