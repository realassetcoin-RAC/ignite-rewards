-- COMPREHENSIVE SCHEMA MIGRATION SCRIPT
-- This script standardizes all tables to the public schema and removes duplicates
-- CRITICAL: Backup your database before running this script!

-- ==============================================
-- PHASE 1: SCHEMA STANDARDIZATION
-- ==============================================

-- Step 1: Move all tables from api schema to public schema
-- (Only if they exist in api schema)

-- Move profiles table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'profiles') THEN
        ALTER TABLE api.profiles SET SCHEMA public;
        RAISE NOTICE 'Moved api.profiles to public.profiles';
    END IF;
END $$;

-- Move merchants table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchants') THEN
        ALTER TABLE api.merchants SET SCHEMA public;
        RAISE NOTICE 'Moved api.merchants to public.merchants';
    END IF;
END $$;

-- Move virtual_cards table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'virtual_cards') THEN
        ALTER TABLE api.virtual_cards SET SCHEMA public;
        RAISE NOTICE 'Moved api.virtual_cards to public.virtual_cards';
    END IF;
END $$;

-- Move merchant_subscriptions table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchant_subscriptions') THEN
        ALTER TABLE api.merchant_subscriptions SET SCHEMA public;
        RAISE NOTICE 'Moved api.merchant_subscriptions to public.merchant_subscriptions';
    END IF;
END $$;

-- Move merchant_cards table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchant_cards') THEN
        ALTER TABLE api.merchant_cards SET SCHEMA public;
        RAISE NOTICE 'Moved api.merchant_cards to public.merchant_cards';
    END IF;
END $$;

-- Move subscribers table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'subscribers') THEN
        ALTER TABLE api.subscribers SET SCHEMA public;
        RAISE NOTICE 'Moved api.subscribers to public.subscribers';
    END IF;
END $$;

-- ==============================================
-- PHASE 2: REMOVE DUPLICATE TABLES
-- ==============================================

-- Step 2: Remove duplicate tables (keep only public schema versions)
-- This is done automatically when moving tables above

-- ==============================================
-- PHASE 3: ENSURE ALL REQUIRED TABLES EXIST
-- ==============================================

-- Step 3: Create any missing tables in public schema

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create merchants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create virtual_cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.virtual_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number VARCHAR(16) UNIQUE NOT NULL,
  card_type VARCHAR(50) DEFAULT 'visa',
  balance DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create merchant_subscription_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.merchant_subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2) DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  monthly_transactions INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  popular BOOLEAN DEFAULT false,
  plan_number INTEGER,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_referrals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  reward_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Create user_wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solana_address TEXT NOT NULL UNIQUE,
  encrypted_seed_phrase TEXT NOT NULL,
  wallet_type TEXT DEFAULT 'generated',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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

-- Create DAO tables if they don't exist
CREATE TABLE IF NOT EXISTS public.dao_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  governance_token_symbol text NOT NULL,
  governance_token_decimals int NOT NULL DEFAULT 9,
  min_proposal_threshold numeric NOT NULL DEFAULT 0,
  voting_period_days int NOT NULL DEFAULT 7,
  execution_delay_hours int NOT NULL DEFAULT 24,
  quorum_percentage numeric NOT NULL DEFAULT 10.0,
  super_majority_threshold numeric NOT NULL DEFAULT 66.67,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dao_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id uuid REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  wallet_address text,
  role text NOT NULL DEFAULT 'member',
  governance_tokens numeric NOT NULL DEFAULT 0,
  voting_power numeric NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  user_email text,
  user_full_name text
);

CREATE TABLE IF NOT EXISTS public.dao_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id uuid REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
  proposer_id uuid,
  title text NOT NULL,
  description text,
  full_description text,
  category text,
  voting_type text NOT NULL DEFAULT 'simple_majority',
  status text NOT NULL DEFAULT 'draft',
  start_time timestamptz,
  end_time timestamptz,
  execution_time timestamptz,
  total_votes int NOT NULL DEFAULT 0,
  yes_votes int NOT NULL DEFAULT 0,
  no_votes int NOT NULL DEFAULT 0,
  abstain_votes int NOT NULL DEFAULT 0,
  participation_rate numeric NOT NULL DEFAULT 0,
  treasury_impact_amount numeric DEFAULT 0,
  treasury_impact_currency text DEFAULT 'SOL',
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dao_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  choice text NOT NULL,
  voting_power numeric NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create marketplace_listings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  category VARCHAR(100),
  condition VARCHAR(50),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create loyalty_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  amount DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  description TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==============================================
-- PHASE 4: ENABLE ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PHASE 5: CREATE RLS POLICIES
-- ==============================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Merchants policies
DROP POLICY IF EXISTS "Anyone can view active merchants" ON public.merchants;
CREATE POLICY "Anyone can view active merchants" ON public.merchants
  FOR SELECT USING (is_active = true);

-- Virtual cards policies
DROP POLICY IF EXISTS "Users can view their own cards" ON public.virtual_cards;
CREATE POLICY "Users can view their own cards" ON public.virtual_cards
  FOR SELECT USING (auth.uid() = user_id);

-- Subscription plans policies
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.merchant_subscription_plans;
CREATE POLICY "Anyone can view active plans" ON public.merchant_subscription_plans
  FOR SELECT USING (is_active = true);

-- User referrals policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.user_referrals;
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- User wallets policies
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.user_wallets;
CREATE POLICY "Users can view their own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Referral campaigns policies
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.referral_campaigns;
CREATE POLICY "Anyone can view active campaigns" ON public.referral_campaigns
  FOR SELECT USING (is_active = true);

-- DAO policies
DROP POLICY IF EXISTS "Users can read all DAO organizations" ON public.dao_organizations;
CREATE POLICY "Users can read all DAO organizations" ON public.dao_organizations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can read all DAO members" ON public.dao_members;
CREATE POLICY "Users can read all DAO members" ON public.dao_members
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can read all DAO proposals" ON public.dao_proposals;
CREATE POLICY "Users can read all DAO proposals" ON public.dao_proposals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert their own votes" ON public.dao_votes;
CREATE POLICY "Users can insert their own votes" ON public.dao_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = voter_id);

-- Marketplace policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.marketplace_listings;
CREATE POLICY "Anyone can view active listings" ON public.marketplace_listings
  FOR SELECT USING (is_active = true);

-- Loyalty transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ==============================================
-- PHASE 6: CREATE INDEXES
-- ==============================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_merchants_active ON public.merchants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_virtual_cards_user ON public.virtual_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_active ON public.virtual_cards(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON public.merchant_subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON public.user_referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON public.user_referrals(status);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_active ON public.referral_campaigns(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dao_organizations_active ON public.dao_organizations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dao_members_dao ON public.dao_members(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_user ON public.dao_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_active ON public.dao_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dao_proposals_dao ON public.dao_proposals(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON public.dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal ON public.dao_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_voter ON public.dao_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_active ON public.marketplace_listings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_merchant ON public.loyalty_transactions(merchant_id);

-- ==============================================
-- PHASE 7: UPDATE RPC FUNCTIONS
-- ==============================================

-- Update get_valid_subscription_plans function
CREATE OR REPLACE FUNCTION public.get_valid_subscription_plans()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  monthly_points INTEGER,
  monthly_transactions INTEGER,
  features JSONB,
  trial_days INTEGER,
  is_active BOOLEAN,
  popular BOOLEAN,
  plan_number INTEGER,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    id,
    name,
    description,
    price_monthly,
    price_yearly,
    monthly_points,
    monthly_transactions,
    features,
    trial_days,
    is_active,
    popular,
    plan_number,
    valid_from,
    valid_until,
    created_at,
    updated_at
  FROM public.merchant_subscription_plans
  WHERE is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
  ORDER BY plan_number ASC;
$$;

-- ==============================================
-- PHASE 8: CLEAN UP API SCHEMA
-- ==============================================

-- Drop api schema if it exists and is empty
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'api') THEN
        -- Check if api schema has any remaining objects
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_schema = 'api'
            UNION
            SELECT 1 FROM information_schema.routines WHERE routine_schema = 'api'
            UNION
            SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'api'
        ) THEN
            DROP SCHEMA api CASCADE;
            RAISE NOTICE 'Dropped empty api schema';
        ELSE
            RAISE NOTICE 'Api schema still contains objects, not dropping';
        END IF;
    END IF;
END $$;

-- ==============================================
-- PHASE 9: VACUUM AND ANALYZE
-- ==============================================

-- Optimize all tables
VACUUM ANALYZE public.profiles;
VACUUM ANALYZE public.merchants;
VACUUM ANALYZE public.virtual_cards;
VACUUM ANALYZE public.merchant_subscription_plans;
VACUUM ANALYZE public.user_referrals;
VACUUM ANALYZE public.user_wallets;
VACUUM ANALYZE public.referral_campaigns;
VACUUM ANALYZE public.dao_organizations;
VACUUM ANALYZE public.dao_members;
VACUUM ANALYZE public.dao_proposals;
VACUUM ANALYZE public.dao_votes;
VACUUM ANALYZE public.marketplace_listings;
VACUUM ANALYZE public.loyalty_transactions;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check all tables are in public schema
SELECT 
    table_schema,
    table_name,
    pg_size_pretty(pg_total_relation_size(table_schema||'.'||table_name)) as size
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_schema||'.'||table_name) DESC;

-- Check RPC functions
SELECT routine_name, routine_schema 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
