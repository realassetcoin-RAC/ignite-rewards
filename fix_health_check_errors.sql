-- Comprehensive Fix for Health Check Errors
-- This script resolves all three critical health check errors:
-- 1. DAO System - Missing dao_organizations table
-- 2. User DAO Access - Missing dao_proposals table  
-- 3. Merchant Reward Generator - Missing transaction_type column

-- =====================================================
-- 1. CREATE DAO ORGANIZATIONS TABLE IN API SCHEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS api.dao_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    discord_url TEXT,
    twitter_url TEXT,
    github_url TEXT,
    governance_token_address TEXT,
    governance_token_symbol VARCHAR(20),
    governance_token_decimals INTEGER DEFAULT 9,
    min_proposal_threshold BIGINT DEFAULT 1000,
    voting_period_days INTEGER DEFAULT 7,
    execution_delay_hours INTEGER DEFAULT 24,
    quorum_percentage DECIMAL(5,2) DEFAULT 10.0,
    super_majority_threshold DECIMAL(5,2) DEFAULT 66.67,
    treasury_address TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- 2. CREATE DAO PROPOSALS TABLE IN API SCHEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS api.dao_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES api.dao_organizations(id) ON DELETE CASCADE,
    proposer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    voting_type VARCHAR(50) DEFAULT 'simple_majority',
    status VARCHAR(50) DEFAULT 'draft',
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    execution_time TIMESTAMP WITH TIME ZONE,
    total_votes BIGINT DEFAULT 0,
    yes_votes BIGINT DEFAULT 0,
    no_votes BIGINT DEFAULT 0,
    abstain_votes BIGINT DEFAULT 0,
    participation_rate DECIMAL(5,2) DEFAULT 0.0,
    treasury_impact_amount DECIMAL(20,8) DEFAULT 0.0,
    treasury_impact_currency VARCHAR(10) DEFAULT 'SOL',
    tags TEXT[],
    external_links JSONB,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_voting_period CHECK (end_time > start_time),
    CONSTRAINT valid_execution_time CHECK (execution_time >= end_time)
);

-- =====================================================
-- 3. ADD TRANSACTION_TYPE COLUMN TO LOYALTY_TRANSACTIONS
-- =====================================================

-- First, check if the column exists and add it if missing
DO $$
BEGIN
    -- Check if transaction_type column exists in public.loyalty_transactions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'loyalty_transactions' 
        AND column_name = 'transaction_type'
    ) THEN
        ALTER TABLE public.loyalty_transactions 
        ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'purchase' 
        CHECK (transaction_type IN ('purchase', 'refund', 'cancellation', 'manual_entry', 'bonus', 'adjustment'));
        
        RAISE NOTICE 'Added transaction_type column to public.loyalty_transactions';
    ELSE
        RAISE NOTICE 'transaction_type column already exists in public.loyalty_transactions';
    END IF;
    
    -- Also check and add to api.loyalty_transactions if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' 
        AND table_name = 'loyalty_transactions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'api' 
            AND table_name = 'loyalty_transactions' 
            AND column_name = 'transaction_type'
        ) THEN
            ALTER TABLE api.loyalty_transactions 
            ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'purchase' 
            CHECK (transaction_type IN ('purchase', 'refund', 'cancellation', 'manual_entry', 'bonus', 'adjustment'));
            
            RAISE NOTICE 'Added transaction_type column to api.loyalty_transactions';
        ELSE
            RAISE NOTICE 'transaction_type column already exists in api.loyalty_transactions';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on DAO tables
ALTER TABLE api.dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.dao_proposals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES FOR DAO TABLES
-- =====================================================

-- DAO Organizations policies
DROP POLICY IF EXISTS "Anyone can view active DAOs" ON api.dao_organizations;
CREATE POLICY "Anyone can view active DAOs" ON api.dao_organizations
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can create DAOs" ON api.dao_organizations;
CREATE POLICY "Authenticated users can create DAOs" ON api.dao_organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "DAO creators can update their DAOs" ON api.dao_organizations;
CREATE POLICY "DAO creators can update their DAOs" ON api.dao_organizations
    FOR UPDATE USING (auth.uid() = created_by);

-- DAO Proposals policies
DROP POLICY IF EXISTS "Anyone can view active proposals" ON api.dao_proposals;
CREATE POLICY "Anyone can view active proposals" ON api.dao_proposals
    FOR SELECT USING (status != 'draft' OR auth.uid() = proposer_id);

DROP POLICY IF EXISTS "DAO members can create proposals" ON api.dao_proposals;
CREATE POLICY "DAO members can create proposals" ON api.dao_proposals
    FOR INSERT WITH CHECK (auth.uid() = proposer_id);

DROP POLICY IF EXISTS "Proposal creators can update their proposals" ON api.dao_proposals;
CREATE POLICY "Proposal creators can update their proposals" ON api.dao_proposals
    FOR UPDATE USING (auth.uid() = proposer_id);

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for DAO tables
GRANT ALL ON api.dao_organizations TO authenticated;
GRANT ALL ON api.dao_organizations TO service_role;
GRANT ALL ON api.dao_proposals TO authenticated;
GRANT ALL ON api.dao_proposals TO service_role;

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- DAO Organizations indexes
CREATE INDEX IF NOT EXISTS idx_dao_organizations_active ON api.dao_organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_dao_organizations_created_by ON api.dao_organizations(created_by);

-- DAO Proposals indexes
CREATE INDEX IF NOT EXISTS idx_dao_proposals_dao_id ON api.dao_proposals(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_proposer_id ON api.dao_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON api.dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_start_time ON api.dao_proposals(start_time);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_end_time ON api.dao_proposals(end_time);

-- =====================================================
-- 8. INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert a sample DAO organization if none exists
INSERT INTO api.dao_organizations (
    name, 
    description, 
    governance_token_symbol,
    min_proposal_threshold,
    voting_period_days,
    quorum_percentage
) 
SELECT 
    'Ignite Rewards DAO',
    'Decentralized governance for the Ignite Rewards platform',
    'IGNITE',
    1000,
    7,
    10.0
WHERE NOT EXISTS (SELECT 1 FROM api.dao_organizations LIMIT 1);

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Verify the fixes
DO $$
BEGIN
    RAISE NOTICE '=== HEALTH CHECK FIXES VERIFICATION ===';
    
    -- Check DAO Organizations table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'dao_organizations') THEN
        RAISE NOTICE '✅ api.dao_organizations table exists';
    ELSE
        RAISE NOTICE '❌ api.dao_organizations table missing';
    END IF;
    
    -- Check DAO Proposals table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'dao_proposals') THEN
        RAISE NOTICE '✅ api.dao_proposals table exists';
    ELSE
        RAISE NOTICE '❌ api.dao_proposals table missing';
    END IF;
    
    -- Check transaction_type column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'loyalty_transactions' 
        AND column_name = 'transaction_type'
    ) THEN
        RAISE NOTICE '✅ transaction_type column exists in public.loyalty_transactions';
    ELSE
        RAISE NOTICE '❌ transaction_type column missing in public.loyalty_transactions';
    END IF;
    
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;
