-- Complete Database Restoration Script
-- This script recreates all essential tables for the RAC Rewards application
-- Run this in Supabase SQL Editor to restore your database

-- =============================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. CREATE CORE USER TABLES
-- =============================================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    app_role TEXT DEFAULT 'user' CHECK (app_role IN ('user', 'merchant', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. CREATE MERCHANT SYSTEM TABLES
-- =============================================================================

-- Merchants table
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    contact_email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    subscription_plan TEXT CHECK (subscription_plan IN ('startup', 'momentum', 'energizer', 'cloud9', 'super')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Merchant subscription plans
CREATE TABLE IF NOT EXISTS public.merchant_subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL UNIQUE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('startup', 'momentum', 'energizer', 'cloud9', 'super')),
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '{}',
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. CREATE NFT AND LOYALTY SYSTEM TABLES
-- =============================================================================

-- NFT Types table
CREATE TABLE IF NOT EXISTS public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Less Common', 'Rare', 'Very Rare')),
    earn_on_spend_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.0100,
    buy_price_usdt DECIMAL(10,2) NOT NULL DEFAULT 0,
    upgrade_bonus_ratio DECIMAL(5,4) NOT NULL DEFAULT 0,
    evolution_min_investment DECIMAL(10,2) NOT NULL DEFAULT 0,
    evolution_earnings_ratio DECIMAL(5,4) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User loyalty cards
CREATE TABLE IF NOT EXISTS public.user_loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_type_id UUID REFERENCES public.nft_types(id),
    loyalty_number TEXT NOT NULL UNIQUE,
    card_number TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    points_balance INTEGER NOT NULL DEFAULT 0,
    tier_level TEXT NOT NULL DEFAULT 'Common',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Loyalty transactions
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    loyalty_number TEXT NOT NULL,
    transaction_amount DECIMAL(10,2) NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    transaction_reference TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. CREATE DAO SYSTEM TABLES
-- =============================================================================

-- DAO Organizations
CREATE TABLE IF NOT EXISTS public.dao_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    governance_token TEXT,
    treasury_address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- DAO Members
CREATE TABLE IF NOT EXISTS public.dao_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
    voting_power INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(dao_id, user_id)
);

-- DAO Proposals
CREATE TABLE IF NOT EXISTS public.dao_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
    proposer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposal_type TEXT NOT NULL CHECK (proposal_type IN ('governance', 'treasury', 'membership', 'other')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'executed')),
    voting_start TIMESTAMP WITH TIME ZONE,
    voting_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- DAO Votes
CREATE TABLE IF NOT EXISTS public.dao_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('yes', 'no', 'abstain')),
    voting_power INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(proposal_id, voter_id)
);

-- =============================================================================
-- 6. CREATE MARKETPLACE TABLES
-- =============================================================================

-- Marketplace listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price_usdt DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Marketplace investments
CREATE TABLE IF NOT EXISTS public.marketplace_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    investment_amount DECIMAL(10,2) NOT NULL,
    investment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 7. CREATE REFERRAL SYSTEM TABLES
-- =============================================================================

-- Referral campaigns
CREATE TABLE IF NOT EXISTS public.referral_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    points_per_referral INTEGER NOT NULL,
    max_referrals_per_user INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User referrals
CREATE TABLE IF NOT EXISTS public.user_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.referral_campaigns(id),
    points_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- =============================================================================
-- 8. CREATE WALLET AND CRYPTO TABLES
-- =============================================================================

-- User wallets
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    seed_phrase_encrypted TEXT,
    is_custodial BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User points
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================================================
-- 9. CREATE ADDITIONAL SUPPORTING TABLES
-- =============================================================================

-- Terms and privacy acceptance
CREATE TABLE IF NOT EXISTS public.terms_privacy_acceptance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    privacy_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    terms_accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    privacy_accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 10. INSERT DEFAULT DATA
-- =============================================================================

-- Insert default NFT types
INSERT INTO public.nft_types (nft_name, display_name, rarity, earn_on_spend_ratio, buy_price_usdt, is_active)
SELECT 'Common', 'Common Card', 'Common', 0.0100, 0.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Common');

INSERT INTO public.nft_types (nft_name, display_name, rarity, earn_on_spend_ratio, buy_price_usdt, is_active)
SELECT 'Less Common', 'Less Common Card', 'Less Common', 0.0150, 0.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Less Common');

INSERT INTO public.nft_types (nft_name, display_name, rarity, earn_on_spend_ratio, buy_price_usdt, is_active)
SELECT 'Rare', 'Rare Card', 'Rare', 0.0200, 0.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Rare');

INSERT INTO public.nft_types (nft_name, display_name, rarity, earn_on_spend_ratio, buy_price_usdt, is_active)
SELECT 'Very Rare', 'Very Rare Card', 'Very Rare', 0.0250, 0.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.nft_types WHERE nft_name = 'Very Rare');

-- Insert default merchant subscription plans
INSERT INTO public.merchant_subscription_plans (plan_name, plan_type, price_monthly, price_yearly, features, is_popular, is_active)
SELECT 'Startup Plan', 'startup', 29.99, 299.99, '{"max_merchants": 1, "max_transactions": 1000, "support": "email"}', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.merchant_subscription_plans WHERE plan_type = 'startup');

INSERT INTO public.merchant_subscription_plans (plan_name, plan_type, price_monthly, price_yearly, features, is_popular, is_active)
SELECT 'Momentum Plan', 'momentum', 59.99, 599.99, '{"max_merchants": 5, "max_transactions": 5000, "support": "priority"}', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.merchant_subscription_plans WHERE plan_type = 'momentum');

INSERT INTO public.merchant_subscription_plans (plan_name, plan_type, price_monthly, price_yearly, features, is_popular, is_active)
SELECT 'Energizer Plan', 'energizer', 99.99, 999.99, '{"max_merchants": 10, "max_transactions": 10000, "support": "phone"}', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.merchant_subscription_plans WHERE plan_type = 'energizer');

INSERT INTO public.merchant_subscription_plans (plan_name, plan_type, price_monthly, price_yearly, features, is_popular, is_active)
SELECT 'Cloud9 Plan', 'cloud9', 199.99, 1999.99, '{"max_merchants": 25, "max_transactions": 25000, "support": "dedicated"}', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.merchant_subscription_plans WHERE plan_type = 'cloud9');

INSERT INTO public.merchant_subscription_plans (plan_name, plan_type, price_monthly, price_yearly, features, is_popular, is_active)
SELECT 'Super Plan', 'super', 399.99, 3999.99, '{"max_merchants": -1, "max_transactions": -1, "support": "white-glove"}', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.merchant_subscription_plans WHERE plan_type = 'super');

-- Insert default DAO organizations
INSERT INTO public.dao_organizations (name, description, is_active)
SELECT 'RAC Governance DAO', 'Main governance organization for RAC Rewards platform', true
WHERE NOT EXISTS (SELECT 1 FROM public.dao_organizations WHERE name = 'RAC Governance DAO');

INSERT INTO public.dao_organizations (name, description, is_active)
SELECT 'Merchant Council', 'DAO for merchant representation and decision making', true
WHERE NOT EXISTS (SELECT 1 FROM public.dao_organizations WHERE name = 'Merchant Council');

INSERT INTO public.dao_organizations (name, description, is_active)
SELECT 'User Community DAO', 'Community-driven DAO for user feedback and proposals', true
WHERE NOT EXISTS (SELECT 1 FROM public.dao_organizations WHERE name = 'User Community DAO');

-- Insert default referral campaign
INSERT INTO public.referral_campaigns (name, points_per_referral, max_referrals_per_user, is_active)
SELECT 'Welcome Referral Program', 100, 10, true
WHERE NOT EXISTS (SELECT 1 FROM public.referral_campaigns WHERE name = 'Welcome Referral Program');

-- =============================================================================
-- 11. ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_privacy_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 12. CREATE BASIC RLS POLICIES
-- =============================================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User loyalty cards policies
CREATE POLICY "Users can view their own loyalty cards" ON public.user_loyalty_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own loyalty cards" ON public.user_loyalty_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loyalty cards" ON public.user_loyalty_cards FOR UPDATE USING (auth.uid() = user_id);

-- Merchants policies
CREATE POLICY "Users can view their own merchants" ON public.merchants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own merchants" ON public.merchants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own merchants" ON public.merchants FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for some tables
CREATE POLICY "Anyone can view subscription plans" ON public.merchant_subscription_plans FOR SELECT USING (true);
CREATE POLICY "Anyone can view NFT types" ON public.nft_types FOR SELECT USING (true);
CREATE POLICY "Anyone can view DAO organizations" ON public.dao_organizations FOR SELECT USING (true);
CREATE POLICY "Anyone can view referral campaigns" ON public.referral_campaigns FOR SELECT USING (true);

-- =============================================================================
-- 13. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- 14. CREATE ESSENTIAL FUNCTIONS
-- =============================================================================

-- Create get_user_loyalty_card function
CREATE OR REPLACE FUNCTION public.get_user_loyalty_card(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    nft_type_id UUID,
    loyalty_number TEXT,
    card_number TEXT,
    full_name TEXT,
    email TEXT,
    points_balance INTEGER,
    tier_level TEXT,
    is_active BOOLEAN,
    nft_name TEXT,
    nft_display_name TEXT,
    nft_rarity TEXT,
    nft_earn_ratio DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ulc.id,
        ulc.user_id,
        ulc.nft_type_id,
        ulc.loyalty_number,
        ulc.card_number,
        ulc.full_name,
        ulc.email,
        ulc.points_balance,
        ulc.tier_level,
        ulc.is_active,
        nt.nft_name,
        nt.display_name as nft_display_name,
        nt.rarity as nft_rarity,
        nt.earn_on_spend_ratio as nft_earn_ratio,
        ulc.created_at
    FROM public.user_loyalty_cards ulc
    LEFT JOIN public.nft_types nt ON ulc.nft_type_id = nt.id
    WHERE ulc.user_id = user_uuid
    AND ulc.is_active = TRUE
    ORDER BY ulc.created_at DESC
    LIMIT 1;
END;
$$;

-- Create generate_loyalty_number function
CREATE OR REPLACE FUNCTION public.generate_loyalty_number(user_email TEXT DEFAULT '')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    first_char TEXT;
    random_suffix TEXT;
    loyalty_num TEXT;
    counter INTEGER := 0;
BEGIN
    IF user_email IS NOT NULL AND LENGTH(user_email) > 0 THEN
        first_char := UPPER(SUBSTRING(user_email, 1, 1));
    ELSE
        first_char := 'U';
    END IF;
    
    random_suffix := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
    loyalty_num := first_char || random_suffix;
    
    WHILE EXISTS (SELECT 1 FROM public.user_loyalty_cards WHERE loyalty_number = loyalty_num) AND counter < 100 LOOP
        random_suffix := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
        loyalty_num := first_char || random_suffix;
        counter := counter + 1;
    END LOOP;
    
    RETURN loyalty_num;
END;
$$;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.get_user_loyalty_card(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_loyalty_card(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_number(TEXT) TO anon;

-- =============================================================================
-- 15. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- User loyalty cards indexes
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_user_id ON public.user_loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_loyalty_number ON public.user_loyalty_cards(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_is_active ON public.user_loyalty_cards(is_active);

-- Merchants indexes
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON public.merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON public.merchants(status);

-- Loyalty transactions indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_merchant_id ON public.loyalty_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_date ON public.loyalty_transactions(transaction_date);

-- DAO indexes
CREATE INDEX IF NOT EXISTS idx_dao_members_dao_id ON public.dao_members(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_user_id ON public.dao_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_dao_id ON public.dao_proposals(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal_id ON public.dao_votes(proposal_id);

-- =============================================================================
-- 16. FINAL VERIFICATION
-- =============================================================================

DO $$
DECLARE
    table_count INTEGER;
    nft_count INTEGER;
    plan_count INTEGER;
    dao_count INTEGER;
BEGIN
    -- Count created tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    -- Count default data
    SELECT COUNT(*) INTO nft_count FROM public.nft_types;
    SELECT COUNT(*) INTO plan_count FROM public.merchant_subscription_plans;
    SELECT COUNT(*) INTO dao_count FROM public.dao_organizations;
    
    RAISE NOTICE 'Database restoration completed successfully!';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'NFT types: %', nft_count;
    RAISE NOTICE 'Subscription plans: %', plan_count;
    RAISE NOTICE 'DAO organizations: %', dao_count;
END $$;

-- Show final status
SELECT 
    'Database restoration completed successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables_created,
    (SELECT COUNT(*) FROM public.nft_types) as nft_types,
    (SELECT COUNT(*) FROM public.merchant_subscription_plans) as subscription_plans,
    (SELECT COUNT(*) FROM public.dao_organizations) as dao_organizations;
