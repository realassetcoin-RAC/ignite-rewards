-- Fix Database Schema Configuration for Referrals and Subscription Plans
-- This comprehensive migration ensures all tables, permissions, and RLS policies are properly configured

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the check_admin_access function if it doesn't exist
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure profiles table exists with proper role column
DO $$
BEGIN
  -- Check if profiles table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      full_name TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view their own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
    
    -- Grant permissions
    GRANT SELECT, UPDATE ON public.profiles TO authenticated;
  END IF;
  
  -- Ensure role column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- Create referral_campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.referral_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  reward_points INTEGER NOT NULL DEFAULT 10,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_referrals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id),
  merchant_id UUID,
  campaign_id UUID REFERENCES public.referral_campaigns(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'rewarded'
  reward_points INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create merchant_subscription_plans table if it doesn't exist
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
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.referral_campaigns;
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.referral_campaigns;
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can create their own referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can update their own referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins have full access to referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admin full access to referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admin full access to plans" ON public.merchant_subscription_plans;
DROP POLICY IF EXISTS "Public can view active plans" ON public.merchant_subscription_plans;

-- Create comprehensive RLS policies for referral_campaigns
CREATE POLICY "Anyone can view active campaigns" 
ON public.referral_campaigns 
FOR SELECT 
TO authenticated
USING (is_active = true OR public.check_admin_access());

CREATE POLICY "Admins can manage campaigns" 
ON public.referral_campaigns 
FOR ALL 
TO authenticated
USING (public.check_admin_access())
WITH CHECK (public.check_admin_access());

-- Create comprehensive RLS policies for user_referrals
CREATE POLICY "Users can view their own referrals" 
ON public.user_referrals 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = referrer_id 
  OR auth.uid() = referred_user_id
  OR public.check_admin_access()
);

CREATE POLICY "Users can create their own referrals" 
ON public.user_referrals 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = referrer_id
  OR public.check_admin_access()
);

CREATE POLICY "Users can update their own referrals" 
ON public.user_referrals 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = referrer_id
  OR public.check_admin_access()
)
WITH CHECK (
  auth.uid() = referrer_id
  OR public.check_admin_access()
);

CREATE POLICY "Admins can delete referrals" 
ON public.user_referrals 
FOR DELETE 
TO authenticated
USING (public.check_admin_access());

-- Create comprehensive RLS policies for merchant_subscription_plans
CREATE POLICY "Anyone can view active plans" 
ON public.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (is_active = true OR public.check_admin_access());

CREATE POLICY "Admins can insert plans" 
ON public.merchant_subscription_plans 
FOR INSERT 
TO authenticated
WITH CHECK (public.check_admin_access());

CREATE POLICY "Admins can update plans" 
ON public.merchant_subscription_plans 
FOR UPDATE 
TO authenticated
USING (public.check_admin_access())
WITH CHECK (public.check_admin_access());

CREATE POLICY "Admins can delete plans" 
ON public.merchant_subscription_plans 
FOR DELETE 
TO authenticated
USING (public.check_admin_access());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_campaigns TO authenticated;
GRANT ALL ON public.referral_campaigns TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_referrals TO authenticated;
GRANT ALL ON public.user_referrals TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_subscription_plans TO authenticated;
GRANT ALL ON public.merchant_subscription_plans TO service_role;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON public.user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON public.user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON public.user_referrals(status);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON public.merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_active ON public.referral_campaigns(is_active);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_referral_campaigns_updated_at ON public.referral_campaigns;
CREATE TRIGGER update_referral_campaigns_updated_at
  BEFORE UPDATE ON public.referral_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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

-- Insert default data if tables are empty
DO $$
BEGIN
  -- Insert default subscription plans
  IF NOT EXISTS (SELECT 1 FROM public.merchant_subscription_plans LIMIT 1) THEN
    INSERT INTO public.merchant_subscription_plans (name, description, price_monthly, features, trial_days) VALUES
    ('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support", "Up to 100 customers"]', 30),
    ('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access", "Up to 1000 customers", "Custom loyalty programs"]', 30),
    ('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support", "Unlimited customers", "White-label options"]', 30);
  END IF;

  -- Insert default referral campaign
  IF NOT EXISTS (SELECT 1 FROM public.referral_campaigns LIMIT 1) THEN
    INSERT INTO public.referral_campaigns (name, description, reward_points, start_date, end_date) VALUES
    ('Launch Campaign', 'Earn 10 points for each merchant referral with successful payment', 10, now(), now() + interval '1 year'),
    ('Holiday Special', 'Double points for referrals during the holiday season', 20, now(), now() + interval '3 months');
  END IF;
END $$;

-- Verify the tables are accessible and properly configured
DO $$
DECLARE
  referrals_count INTEGER;
  plans_count INTEGER;
  campaigns_count INTEGER;
BEGIN
  -- Test query on referral_campaigns
  SELECT COUNT(*) INTO campaigns_count FROM public.referral_campaigns;
  RAISE NOTICE 'referral_campaigns table accessible, count: %', campaigns_count;
  
  -- Test query on user_referrals
  SELECT COUNT(*) INTO referrals_count FROM public.user_referrals;
  RAISE NOTICE 'user_referrals table accessible, count: %', referrals_count;

  -- Test query on merchant_subscription_plans  
  SELECT COUNT(*) INTO plans_count FROM public.merchant_subscription_plans;
  RAISE NOTICE 'merchant_subscription_plans table accessible, count: %', plans_count;
  
  -- Verify schema permissions
  PERFORM has_schema_privilege('authenticated', 'public', 'USAGE');
  RAISE NOTICE 'Schema permissions verified for authenticated role';
END $$;

-- Add helpful comments
COMMENT ON TABLE public.user_referrals IS 'Stores user referral information and tracking';
COMMENT ON TABLE public.merchant_subscription_plans IS 'Defines available subscription plans for merchants';
COMMENT ON TABLE public.referral_campaigns IS 'Manages referral campaigns and reward configurations';
COMMENT ON COLUMN public.user_referrals.status IS 'Referral status: pending, completed, or rewarded';
COMMENT ON COLUMN public.merchant_subscription_plans.features IS 'JSON array of feature descriptions for the plan';

-- Create a view for easy referral statistics (optional but useful)
CREATE OR REPLACE VIEW public.referral_statistics AS
SELECT 
  r.referrer_id,
  p.email as referrer_email,
  p.full_name as referrer_name,
  COUNT(DISTINCT r.id) as total_referrals,
  COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) as completed_referrals,
  COUNT(DISTINCT CASE WHEN r.status = 'rewarded' THEN r.id END) as rewarded_referrals,
  SUM(r.reward_points) as total_points_earned
FROM public.user_referrals r
LEFT JOIN public.profiles p ON r.referrer_id = p.id
GROUP BY r.referrer_id, p.email, p.full_name;

-- Grant permissions on the view
GRANT SELECT ON public.referral_statistics TO authenticated;

-- Final verification: List all tables and their RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_referrals', 'merchant_subscription_plans', 'referral_campaigns')
ORDER BY tablename;