-- ===========================================
-- DAO TABLES CREATION FINAL (HANDLES EXISTING POLICIES)
-- ===========================================
-- This script creates missing DAO tables and handles existing policies gracefully

-- ===========================================
-- 1. CREATE MISSING ENUMS
-- ===========================================

-- Create enum types safely
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

-- ===========================================
-- 2. CREATE MISSING TABLES
-- ===========================================

-- Create virtual_cards table if it doesn't exist
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

-- Create marketplace_investments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    investment_amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'SOL',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create passive_income_distributions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.passive_income_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    distribution_amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'SOL',
    distribution_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_passive_earnings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_passive_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES public.marketplace_investments(id),
    distribution_id UUID REFERENCES public.passive_income_distributions(id),
    earning_amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'SOL',
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 3. CREATE DAO TABLES
-- ===========================================

-- Create DAO organizations table
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
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create DAO members table
CREATE TABLE IF NOT EXISTS public.dao_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create DAO proposals table
CREATE TABLE IF NOT EXISTS public.dao_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID REFERENCES public.dao_organizations(id) ON DELETE CASCADE,
    proposer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create DAO votes table
CREATE TABLE IF NOT EXISTS public.dao_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
-- 4. ENABLE ROW LEVEL SECURITY ON NEW TABLES
-- ===========================================

-- Enable RLS on new tables
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passive_income_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passive_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 5. CREATE BASIC RLS POLICIES FOR NEW TABLES (WITH CONFLICT HANDLING)
-- ===========================================

-- Virtual cards policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own virtual cards' AND tablename = 'virtual_cards') THEN
        CREATE POLICY "Users can view their own virtual cards" ON public.virtual_cards FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.merchants WHERE id = virtual_cards.merchant_id AND user_id = auth.uid())
        );
    END IF;
END $$;

-- Marketplace investments policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own investments' AND tablename = 'marketplace_investments') THEN
        CREATE POLICY "Users can view their own investments" ON public.marketplace_investments FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own investments' AND tablename = 'marketplace_investments') THEN
        CREATE POLICY "Users can create their own investments" ON public.marketplace_investments FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Passive income policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own earnings' AND tablename = 'user_passive_earnings') THEN
        CREATE POLICY "Users can view their own earnings" ON public.user_passive_earnings FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- DAO policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view active DAOs' AND tablename = 'dao_organizations') THEN
        CREATE POLICY "Anyone can view active DAOs" ON public.dao_organizations FOR SELECT USING (is_active = true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own DAO memberships' AND tablename = 'dao_members') THEN
        CREATE POLICY "Users can view their own DAO memberships" ON public.dao_members FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view proposals for their DAOs' AND tablename = 'dao_proposals') THEN
        CREATE POLICY "Users can view proposals for their DAOs" ON public.dao_proposals FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.dao_members WHERE dao_id = dao_proposals.dao_id AND user_id = auth.uid())
        );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own votes' AND tablename = 'dao_votes') THEN
        CREATE POLICY "Users can view their own votes" ON public.dao_votes FOR SELECT USING (auth.uid() = voter_id);
    END IF;
END $$;

-- ===========================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ===========================================

-- Virtual cards indexes
CREATE INDEX IF NOT EXISTS idx_virtual_cards_merchant_id ON public.virtual_cards(merchant_id);

-- Marketplace indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_user_id ON public.marketplace_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_investments_listing_id ON public.marketplace_investments(listing_id);

-- DAO indexes
CREATE INDEX IF NOT EXISTS idx_dao_members_dao_id ON public.dao_members(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_user_id ON public.dao_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_dao_id ON public.dao_proposals(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON public.dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal_id ON public.dao_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_voter_id ON public.dao_votes(voter_id);

-- ===========================================
-- 7. CREATE HELPFUL FUNCTIONS
-- ===========================================

-- Function to get all tables with their relationships
CREATE OR REPLACE FUNCTION public.get_database_schema()
RETURNS TABLE (
    table_name TEXT,
    column_name TEXT,
    data_type TEXT,
    is_nullable TEXT,
    column_default TEXT,
    foreign_key TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        COALESCE(c.column_default::TEXT, '')::TEXT,
        COALESCE(
            (SELECT 
                tc.table_name || '(' || kcu.column_name || ')'
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu 
                 ON tc.constraint_name = kcu.constraint_name
             WHERE tc.constraint_type = 'FOREIGN KEY'
                 AND tc.table_name = t.table_name
                 AND kcu.column_name = c.column_name
             LIMIT 1
            ), ''
        )::TEXT as foreign_key
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table relationships
CREATE OR REPLACE FUNCTION public.get_table_relationships()
RETURNS TABLE (
    source_table TEXT,
    source_column TEXT,
    target_table TEXT,
    target_column TEXT,
    constraint_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.table_name::TEXT as source_table,
        kcu.column_name::TEXT as source_column,
        ccu.table_name::TEXT as target_table,
        ccu.column_name::TEXT as target_column,
        tc.constraint_name::TEXT
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 8. SUCCESS MESSAGE AND SUMMARY
-- ===========================================

SELECT '✅ DAO TABLES CREATION COMPLETED SUCCESSFULLY!' as message;

-- Show database summary
SELECT 
    'Total Tables in Database' as info,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'DAO Organizations Created' as info,
    COUNT(*) as count
FROM public.dao_organizations 
WHERE is_active = true

UNION ALL

SELECT 
    'NFT Types Available' as info,
    COUNT(*) as count
FROM public.nft_types 
WHERE is_active = true

UNION ALL

SELECT 
    'Subscription Plans Available' as info,
    COUNT(*) as count
FROM public.merchant_subscription_plans 
WHERE is_active = true;

-- Show table relationships
SELECT '📊 TABLE RELATIONSHIPS:' as info;
SELECT * FROM public.get_table_relationships();

-- Show complete schema
SELECT '🗄️ COMPLETE DATABASE SCHEMA:' as info;
SELECT * FROM public.get_database_schema() ORDER BY table_name, column_name;
