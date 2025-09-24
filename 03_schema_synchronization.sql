-- ===========================================
-- COMPLETE SCHEMA SYNCHRONIZATION
-- ===========================================
-- This script creates the complete database schema from local to cloud
-- Run this AFTER clearing the cloud database

-- ===========================================
-- STEP 1: CREATE EXTENSIONS
-- ===========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- STEP 2: CREATE ENUM TYPES
-- ===========================================

-- Create all enum types
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('customer', 'admin', 'merchant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE merchant_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE card_type AS ENUM ('standard', 'premium', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pricing_type AS ENUM ('free', 'one_time', 'subscription');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_plan AS ENUM ('basic', 'standard', 'premium', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE marketplace_listing_type AS ENUM ('asset', 'initiative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE marketplace_listing_status AS ENUM ('draft', 'active', 'funded', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_type AS ENUM ('time_bound', 'open_ended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- STEP 3: CREATE CORE TABLES
-- ===========================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role app_role DEFAULT 'customer',
    phone TEXT,
    date_of_birth DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    terms_accepted BOOLEAN DEFAULT FALSE,
    privacy_policy_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchants table
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    status merchant_status DEFAULT 'pending',
    subscription_plan subscription_plan DEFAULT 'basic',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFT Types table
CREATE TABLE IF NOT EXISTS public.nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    rarity TEXT DEFAULT 'common',
    tier_level TEXT DEFAULT 'bronze',
    earn_on_spend_ratio DECIMAL(5,2) DEFAULT 1.00,
    buy_price_usdt DECIMAL(10,2) DEFAULT 0.00,
    is_custodial BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    benefits TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Loyalty Cards table
CREATE TABLE IF NOT EXISTS public.user_loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    loyalty_number TEXT UNIQUE NOT NULL,
    card_number TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    points_balance INTEGER DEFAULT 0,
    tier_level TEXT DEFAULT 'bronze',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Points table
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    pending_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty Transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'transfer', 'bonus', 'referral')),
    points_amount INTEGER NOT NULL,
    transaction_value DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    description TEXT,
    reference_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP 4: CREATE REFERRAL SYSTEM TABLES
-- ===========================================

-- Referral Campaigns table
CREATE TABLE IF NOT EXISTS public.referral_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    points_per_referral INTEGER NOT NULL DEFAULT 100,
    max_referrals_per_user INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Referrals table
CREATE TABLE IF NOT EXISTS public.user_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.referral_campaigns(id) ON DELETE SET NULL,
    referral_code TEXT,
    points_awarded INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP 5: CREATE MERCHANT SYSTEM TABLES
-- ===========================================

-- Merchant Subscription Plans table
CREATE TABLE IF NOT EXISTS public.merchant_subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    max_transactions INTEGER,
    max_points_distribution INTEGER,
    features TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Virtual Cards table
CREATE TABLE IF NOT EXISTS public.virtual_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    card_name TEXT NOT NULL,
    card_type card_type DEFAULT 'standard',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP 6: CREATE MARKETPLACE TABLES
-- ===========================================

-- Marketplace Listings table
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    full_description TEXT,
    listing_type marketplace_listing_type NOT NULL,
    total_funding_goal DECIMAL(15,2) NOT NULL,
    current_funding DECIMAL(15,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'SOL',
    status marketplace_listing_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace Investments table
CREATE TABLE IF NOT EXISTS public.marketplace_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    investment_amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'SOL',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP 7: CREATE DAO SYSTEM TABLES
-- ===========================================

-- DAO Organizations table
CREATE TABLE IF NOT EXISTS public.dao_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    discord_url TEXT,
    twitter_url TEXT,
    github_url TEXT,
    governance_token_address TEXT,
    governance_token_symbol TEXT NOT NULL,
    governance_token_decimals INTEGER NOT NULL DEFAULT 9,
    min_proposal_threshold NUMERIC NOT NULL DEFAULT 0,
    voting_period_days INTEGER NOT NULL DEFAULT 7,
    execution_delay_hours INTEGER NOT NULL DEFAULT 24,
    quorum_percentage NUMERIC NOT NULL DEFAULT 10.0,
    super_majority_threshold NUMERIC NOT NULL DEFAULT 66.67,
    treasury_address TEXT,
    created_by UUID REFERENCES public.profiles(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DAO Members table
CREATE TABLE IF NOT EXISTS public.dao_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_address TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    governance_tokens NUMERIC NOT NULL DEFAULT 0,
    voting_power NUMERIC NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    user_email TEXT,
    user_full_name TEXT,
    user_avatar_url TEXT
);

-- DAO Proposals table
CREATE TABLE IF NOT EXISTS public.dao_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
    proposer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    full_description TEXT,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('governance', 'treasury', 'technical', 'community', 'partnership', 'marketing', 'rewards', 'general')),
    voting_type TEXT NOT NULL DEFAULT 'simple_majority' CHECK (voting_type IN ('simple_majority', 'super_majority', 'unanimous', 'weighted', 'quadratic')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'executed', 'expired')),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    execution_time TIMESTAMPTZ,
    total_votes INTEGER NOT NULL DEFAULT 0,
    yes_votes INTEGER NOT NULL DEFAULT 0,
    no_votes INTEGER NOT NULL DEFAULT 0,
    abstain_votes INTEGER NOT NULL DEFAULT 0,
    participation_rate NUMERIC NOT NULL DEFAULT 0,
    treasury_impact_amount NUMERIC NOT NULL DEFAULT 0,
    treasury_impact_currency TEXT NOT NULL DEFAULT 'SOL',
    tags TEXT[] DEFAULT '{}',
    external_links JSONB,
    attachments JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

-- DAO Votes table
CREATE TABLE IF NOT EXISTS public.dao_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    choice TEXT NOT NULL CHECK (choice IN ('yes', 'no', 'abstain')),
    voting_power NUMERIC NOT NULL,
    voting_weight NUMERIC NOT NULL,
    reason TEXT,
    transaction_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    voter_email TEXT,
    voter_avatar_url TEXT,
    UNIQUE(proposal_id, voter_id)
);

-- ===========================================
-- STEP 8: CREATE ADVANCED FEATURE TABLES
-- ===========================================

-- User Wallets table
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL UNIQUE,
    seed_phrase_encrypted TEXT,
    is_custodial BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty Networks table
CREATE TABLE IF NOT EXISTS public.loyalty_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    conversion_rate DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    minimum_conversion INTEGER NOT NULL DEFAULT 100,
    maximum_conversion INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    requires_mobile_verification BOOLEAN NOT NULL DEFAULT TRUE,
    supported_countries TEXT[] DEFAULT '{}',
    api_endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Initiatives table
CREATE TABLE IF NOT EXISTS public.asset_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('environmental', 'social', 'economic', 'health')),
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Asset Selections table
CREATE TABLE IF NOT EXISTS public.user_asset_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset_initiative_id UUID NOT NULL REFERENCES public.asset_initiatives(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ===========================================
-- STEP 9: CREATE INDEXES FOR PERFORMANCE
-- ===========================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON public.merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON public.merchants(status);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_user_id ON public.user_loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_loyalty_number ON public.user_loyalty_cards(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_merchant_id ON public.loyalty_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON public.loyalty_transactions(created_at);

-- Referral system indexes
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer_id ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred_user_id ON public.user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_campaign_id ON public.user_referrals(campaign_id);

-- DAO system indexes
CREATE INDEX IF NOT EXISTS idx_dao_members_dao_id ON public.dao_members(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_user_id ON public.dao_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_dao_id ON public.dao_proposals(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON public.dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal_id ON public.dao_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_voter_id ON public.dao_votes(voter_id);

-- Marketplace indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_type ON public.marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_user_id ON public.marketplace_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_listing_id ON public.marketplace_investments(listing_id);

-- ===========================================
-- STEP 10: ENABLE ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_asset_selections ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- STEP 11: CREATE BASIC RLS POLICIES
-- ===========================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Merchants policies
DROP POLICY IF EXISTS "Users can view their own merchants" ON public.merchants;
DROP POLICY IF EXISTS "Users can create their own merchants" ON public.merchants;
DROP POLICY IF EXISTS "Users can update their own merchants" ON public.merchants;
CREATE POLICY "Users can view their own merchants" ON public.merchants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own merchants" ON public.merchants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own merchants" ON public.merchants FOR UPDATE USING (auth.uid() = user_id);

-- User loyalty cards policies
DROP POLICY IF EXISTS "Users can view their own loyalty cards" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can create their own loyalty cards" ON public.user_loyalty_cards;
CREATE POLICY "Users can view their own loyalty cards" ON public.user_loyalty_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own loyalty cards" ON public.user_loyalty_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User points policies
DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);

-- Loyalty transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions FOR SELECT USING (auth.uid() = user_id);

-- DAO policies
DROP POLICY IF EXISTS "Anyone can view active DAOs" ON public.dao_organizations;
DROP POLICY IF EXISTS "Users can view their own DAO memberships" ON public.dao_members;
DROP POLICY IF EXISTS "Users can view proposals for their DAOs" ON public.dao_proposals;
DROP POLICY IF EXISTS "Users can view their own votes" ON public.dao_votes;
CREATE POLICY "Anyone can view active DAOs" ON public.dao_organizations FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view their own DAO memberships" ON public.dao_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view proposals for their DAOs" ON public.dao_proposals FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.dao_members WHERE dao_id = dao_proposals.dao_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view their own votes" ON public.dao_votes FOR SELECT USING (auth.uid() = voter_id);

-- Marketplace policies
DROP POLICY IF EXISTS "Anyone can view active marketplace listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can view their own investments" ON public.marketplace_investments;
DROP POLICY IF EXISTS "Users can create their own investments" ON public.marketplace_investments;
CREATE POLICY "Anyone can view active marketplace listings" ON public.marketplace_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Users can view their own investments" ON public.marketplace_investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own investments" ON public.marketplace_investments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- STEP 12: CREATE HELPFUL FUNCTIONS
-- ===========================================

-- Function to generate loyalty numbers
CREATE OR REPLACE FUNCTION public.generate_loyalty_number(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    first_char TEXT;
    counter INTEGER;
    result_loyalty_number TEXT;
BEGIN
    -- Get first character of email
    first_char := UPPER(LEFT(user_email, 1));
    
    -- Get next counter value
    SELECT COALESCE(MAX(CAST(SUBSTRING(ulc.loyalty_number FROM 2) AS INTEGER)), 0) + 1
    INTO counter
    FROM public.user_loyalty_cards ulc
    WHERE ulc.loyalty_number LIKE first_char || '%';
    
    -- Format as 8-character string
    result_loyalty_number := first_char || LPAD(counter::TEXT, 7, '0');
    
    RETURN result_loyalty_number;
END;
$$;

-- Function to get valid subscription plans
CREATE OR REPLACE FUNCTION public.get_valid_subscription_plans()
RETURNS TABLE (
    id UUID,
    plan_name TEXT,
    display_name TEXT,
    description TEXT,
    price DECIMAL,
    currency TEXT,
    billing_cycle TEXT,
    max_transactions INTEGER,
    max_points_distribution INTEGER,
    features TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        id,
        plan_name,
        display_name,
        description,
        price,
        currency,
        billing_cycle,
        max_transactions,
        max_points_distribution,
        features
    FROM public.merchant_subscription_plans
    WHERE is_active = true
    ORDER BY price ASC;
$$;

-- ===========================================
-- STEP 13: COMPLETION MESSAGE
-- ===========================================

SELECT '✅ SCHEMA SYNCHRONIZATION COMPLETED!' as message;

-- Show schema summary
SELECT 
    'Total Tables Created:' as info,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

SELECT 
    'Total Indexes Created:' as info,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public';

SELECT 
    'Total Functions Created:' as info,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.prokind = 'f';

SELECT '🎯 READY FOR DATA MIGRATION!' as next_step;
SELECT 'Next: Run 04_data_export_local.sql' as instruction;
