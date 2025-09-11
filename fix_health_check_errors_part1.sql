-- Part 1: Create DAO Organizations Table
-- This is the first part of the health check fix

-- =====================================================
-- CREATE DAO ORGANIZATIONS TABLE IN API SCHEMA
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

-- Enable RLS
ALTER TABLE api.dao_organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Anyone can view active DAOs" ON api.dao_organizations;
CREATE POLICY "Anyone can view active DAOs" ON api.dao_organizations
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can create DAOs" ON api.dao_organizations;
CREATE POLICY "Authenticated users can create DAOs" ON api.dao_organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "DAO creators can update their DAOs" ON api.dao_organizations;
CREATE POLICY "DAO creators can update their DAOs" ON api.dao_organizations
    FOR UPDATE USING (auth.uid() = created_by);

-- Grant permissions
GRANT ALL ON api.dao_organizations TO authenticated;
GRANT ALL ON api.dao_organizations TO service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dao_organizations_active ON api.dao_organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_dao_organizations_created_by ON api.dao_organizations(created_by);

-- Insert sample data
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
