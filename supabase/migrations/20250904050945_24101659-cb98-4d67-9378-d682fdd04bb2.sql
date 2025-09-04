-- Phase 1: Database Structure & Core Features

-- 1. User Wallets Table (Solana wallet integration)
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solana_address TEXT NOT NULL UNIQUE,
  encrypted_seed_phrase TEXT NOT NULL,
  wallet_type TEXT DEFAULT 'generated', -- 'generated' or 'connected'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_wallets
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_wallets
CREATE POLICY "Users can view their own wallet" 
ON public.user_wallets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" 
ON public.user_wallets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
ON public.user_wallets 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Referral Campaigns Table (Admin-managed campaigns)
CREATE TABLE public.referral_campaigns (
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

-- Enable RLS for referral_campaigns
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_campaigns
CREATE POLICY "Anyone can view active campaigns" 
ON public.referral_campaigns 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage campaigns" 
ON public.referral_campaigns 
FOR ALL 
USING (public.check_admin_access());

-- 3. User Referrals Table
CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id),
  merchant_id UUID REFERENCES api.merchants(id),
  campaign_id UUID REFERENCES public.referral_campaigns(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'rewarded'
  reward_points INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_referrals
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_referrals
CREATE POLICY "Users can view their own referrals" 
ON public.user_referrals 
FOR SELECT 
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals" 
ON public.user_referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all referrals" 
ON public.user_referrals 
FOR ALL 
USING (public.check_admin_access());

-- 4. Merchant Subscription Plans Table
CREATE TABLE public.merchant_subscription_plans (
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

-- Enable RLS for merchant_subscription_plans
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for merchant_subscription_plans
CREATE POLICY "Anyone can view active plans" 
ON public.merchant_subscription_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage plans" 
ON public.merchant_subscription_plans 
FOR ALL 
USING (public.check_admin_access());

-- 5. Add logo_url to merchants table and subscription fields
ALTER TABLE api.merchants 
ADD COLUMN logo_url TEXT,
ADD COLUMN subscription_plan_id UUID REFERENCES public.merchant_subscription_plans(id),
ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN industry TEXT;

-- 6. Loyalty Transactions enhancement for points tracking
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES api.merchants(id) ON DELETE CASCADE,
  loyalty_number TEXT NOT NULL,
  transaction_amount DECIMAL(10,2) NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  transaction_reference TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for loyalty_transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.loyalty_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Merchants can view their transactions" 
ON public.loyalty_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM api.merchants m 
    WHERE m.id = loyalty_transactions.merchant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can create transactions" 
ON public.loyalty_transactions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.merchants m 
    WHERE m.id = loyalty_transactions.merchant_id 
    AND m.user_id = auth.uid()
  )
);

-- 7. User Points Balance Table
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_points
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_points
CREATE POLICY "Users can view their own points" 
ON public.user_points 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own points" 
ON public.user_points 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 8. Create triggers for updated_at columns
CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_campaigns_updated_at
  BEFORE UPDATE ON public.referral_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_referrals_updated_at
  BEFORE UPDATE ON public.user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_merchant_subscription_plans_updated_at
  BEFORE UPDATE ON public.merchant_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON public.user_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Functions for referral code generation
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 8-character referral code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.user_referrals 
    WHERE referral_code = code;
    
    -- Exit loop if code is unique
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to create user referral code on signup
CREATE OR REPLACE FUNCTION public.create_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert referral code for new user
  INSERT INTO public.user_referrals (referrer_id, referral_code)
  VALUES (NEW.id, public.generate_referral_code());
  
  -- Initialize user points
  INSERT INTO public.user_points (user_id, total_points, available_points, lifetime_points)
  VALUES (NEW.id, 0, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create referral code on user signup
CREATE TRIGGER create_user_referral_code_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_referral_code();

-- 11. Insert default subscription plans
INSERT INTO public.merchant_subscription_plans (name, description, price_monthly, features, trial_days) VALUES
('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]', 30),
('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]', 30),
('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]', 30);

-- 12. Insert default referral campaign
INSERT INTO public.referral_campaigns (name, description, reward_points, start_date, end_date) VALUES
('Launch Campaign', 'Earn 10 points for each merchant referral with successful payment', 10, now(), now() + interval '1 year');