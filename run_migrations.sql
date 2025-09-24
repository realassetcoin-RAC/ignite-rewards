-- Run Core Migrations for Ignite Rewards
-- Execute this after running setup_local_database.sql

-- Connect to the ignite_rewards database
\c ignite_rewards;

-- 1. Run the NFT types migration
\i SIMPLE_DATABASE_MIGRATION.sql

-- 2. Run the health tab fix
\i HEALTH_TAB_FIX.sql

-- 3. Create additional required tables from your migrations

-- Create nft_types table (from SIMPLE_DATABASE_MIGRATION.sql)
CREATE TABLE IF NOT EXISTS public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    description TEXT,
    image_url TEXT,
    buy_price_usdt DECIMAL(10,2) DEFAULT 0,
    rarity VARCHAR(50) DEFAULT 'Common',
    mint_quantity INTEGER DEFAULT 1000,
    is_upgradeable BOOLEAN DEFAULT false,
    is_evolvable BOOLEAN DEFAULT true,
    is_fractional_eligible BOOLEAN DEFAULT true,
    is_custodial BOOLEAN DEFAULT true,
    auto_staking_duration VARCHAR(20) DEFAULT 'Forever',
    earn_on_spend_ratio DECIMAL(5,4) DEFAULT 0.0100,
    upgrade_bonus_ratio DECIMAL(5,4) DEFAULT 0.0000,
    evolution_min_investment DECIMAL(10,2) DEFAULT 0.00,
    evolution_earnings_ratio DECIMAL(5,4) DEFAULT 0.0000,
    passive_income_rate DECIMAL(5,4) DEFAULT 0.0100,
    custodial_income_rate DECIMAL(5,4) DEFAULT 0.0000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    features JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    pricing_type VARCHAR(20) DEFAULT 'free',
    one_time_fee DECIMAL(10,2) DEFAULT 0.00,
    monthly_fee DECIMAL(10,2) DEFAULT 0.00,
    annual_fee DECIMAL(10,2) DEFAULT 0.00
);

-- Add missing fields if they don't exist
ALTER TABLE public.nft_types 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS passive_income_rate DECIMAL(5,4) DEFAULT 0.0100,
ADD COLUMN IF NOT EXISTS custodial_income_rate DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS one_time_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS annual_fee DECIMAL(10,2) DEFAULT 0.00;

-- Update existing records with default values
UPDATE public.nft_types 
SET display_name = nft_name 
WHERE display_name IS NULL OR display_name = '';

UPDATE public.nft_types 
SET description = 'NFT Loyalty Card'
WHERE description IS NULL;

UPDATE public.nft_types 
SET features = '{}'
WHERE features IS NULL;

-- Enable Row Level Security on nft_types
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for nft_types
DROP POLICY IF EXISTS "Everyone can view active NFT types" ON public.nft_types;
CREATE POLICY "Everyone can view active NFT types" 
ON public.nft_types
FOR SELECT 
TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage NFT types" ON public.nft_types;
CREATE POLICY "Admins can manage NFT types" 
ON public.nft_types
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Insert sample NFT types
INSERT INTO public.nft_types (
    nft_name, 
    display_name, 
    description, 
    buy_price_usdt, 
    rarity, 
    mint_quantity, 
    is_upgradeable, 
    is_evolvable, 
    is_fractional_eligible, 
    is_custodial, 
    auto_staking_duration, 
    earn_on_spend_ratio, 
    upgrade_bonus_ratio, 
    evolution_min_investment, 
    evolution_earnings_ratio, 
    passive_income_rate, 
    custodial_income_rate,
    pricing_type,
    one_time_fee,
    features
) VALUES 
(
    'Premium Rewards Card',
    'Premium Rewards Card',
    'Premium loyalty card with enhanced earning rates',
    99.99,
    'Rare',
    1000,
    true,
    true,
    true,
    true,
    'Forever',
    0.0150,
    0.0050,
    100.00,
    0.0025,
    0.0125,
    0.0025,
    'one_time',
    99.99,
    '["Premium Support", "Higher Earning Rates", "Exclusive Benefits"]'
),
(
    'Basic Loyalty Card',
    'Basic Loyalty Card',
    'Basic loyalty card for everyday users',
    0.00,
    'Common',
    10000,
    false,
    true,
    true,
    true,
    'Forever',
    0.0100,
    0.0000,
    0.00,
    0.0000,
    0.0100,
    0.0000,
    'free',
    0.00,
    '["Basic Support", "Standard Earning Rates"]'
)
ON CONFLICT (nft_name, is_custodial) DO NOTHING;

-- Create trigger for nft_types updated_at
CREATE TRIGGER update_nft_types_updated_at
    BEFORE UPDATE ON public.nft_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create RPC functions that your application needs
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;

-- 5. Create a view for transaction_qr_codes (simplified version)
CREATE OR REPLACE VIEW public.transaction_qr_codes AS
SELECT 
    lt.id,
    lt.user_id,
    lt.merchant_id,
    lt.amount,
    lt.points_earned,
    lt.transaction_type,
    lt.status,
    lt.created_at,
    m.business_name as merchant_name,
    p.full_name as user_name
FROM public.loyalty_transactions lt
LEFT JOIN public.merchants m ON lt.merchant_id = m.id
LEFT JOIN public.profiles p ON lt.user_id = p.id;

-- 6. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 7. Create basic RLS policies (simplified for local development)
-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Merchants policies
DROP POLICY IF EXISTS "Users can view their own merchants" ON public.merchants;
CREATE POLICY "Users can view their own merchants" ON public.merchants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own merchants" ON public.merchants;
CREATE POLICY "Users can manage their own merchants" ON public.merchants
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Virtual cards policies
DROP POLICY IF EXISTS "Users can view their own cards" ON public.virtual_cards;
CREATE POLICY "Users can view their own cards" ON public.virtual_cards
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own cards" ON public.virtual_cards;
CREATE POLICY "Users can manage their own cards" ON public.virtual_cards
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Loyalty transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can create their own transactions" ON public.loyalty_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User loyalty cards policies
DROP POLICY IF EXISTS "Users can view their own loyalty cards" ON public.user_loyalty_cards;
CREATE POLICY "Users can view their own loyalty cards" ON public.user_loyalty_cards
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own loyalty cards" ON public.user_loyalty_cards;
CREATE POLICY "Users can manage their own loyalty cards" ON public.user_loyalty_cards
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User points policies
DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
CREATE POLICY "Users can view their own points" ON public.user_points
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own points" ON public.user_points;
CREATE POLICY "Users can update their own points" ON public.user_points
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User referrals policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.user_referrals;
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

DROP POLICY IF EXISTS "Users can create referrals" ON public.user_referrals;
CREATE POLICY "Users can create referrals" ON public.user_referrals
  FOR INSERT TO authenticated
  WITH CHECK (referrer_id = auth.uid());

-- User wallets policies
DROP POLICY IF EXISTS "Users can view their own wallets" ON public.user_wallets;
CREATE POLICY "Users can view their own wallets" ON public.user_wallets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own wallets" ON public.user_wallets;
CREATE POLICY "Users can manage their own wallets" ON public.user_wallets
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Merchant cards policies
DROP POLICY IF EXISTS "Merchants can view their cards" ON public.merchant_cards;
CREATE POLICY "Merchants can view their cards" ON public.merchant_cards
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Merchants can manage their cards" ON public.merchant_cards;
CREATE POLICY "Merchants can manage their cards" ON public.merchant_cards
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  );

-- Merchant subscription plans policies (public read)
DROP POLICY IF EXISTS "Everyone can view subscription plans" ON public.merchant_subscription_plans;
CREATE POLICY "Everyone can view subscription plans" ON public.merchant_subscription_plans
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Merchant subscriptions policies
DROP POLICY IF EXISTS "Merchants can view their subscriptions" ON public.merchant_subscriptions;
CREATE POLICY "Merchants can view their subscriptions" ON public.merchant_subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Merchants can manage their subscriptions" ON public.merchant_subscriptions;
CREATE POLICY "Merchants can manage their subscriptions" ON public.merchant_subscriptions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  );

-- Referral campaigns policies (public read)
DROP POLICY IF EXISTS "Everyone can view active campaigns" ON public.referral_campaigns;
CREATE POLICY "Everyone can view active campaigns" ON public.referral_campaigns
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Subscribers policies
DROP POLICY IF EXISTS "Anyone can view subscribers" ON public.subscribers;
CREATE POLICY "Anyone can view subscribers" ON public.subscribers
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can create subscribers" ON public.subscribers;
CREATE POLICY "Anyone can create subscribers" ON public.subscribers
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 8. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 9. Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_nft_types_is_active ON public.nft_types(is_active);
CREATE INDEX IF NOT EXISTS idx_nft_types_pricing_type ON public.nft_types(pricing_type);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_is_active ON public.merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_status ON public.merchant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_is_active ON public.referral_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_subscribers_is_active ON public.subscribers(is_active);

-- 10. Success message
SELECT 'Core migrations completed successfully!' as status;
