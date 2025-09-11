-- Part 2: Create DAO Proposals Table
-- This is the second part of the health check fix

-- =====================================================
-- CREATE DAO PROPOSALS TABLE IN API SCHEMA
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

-- Enable RLS
ALTER TABLE api.dao_proposals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Anyone can view active proposals" ON api.dao_proposals;
CREATE POLICY "Anyone can view active proposals" ON api.dao_proposals
    FOR SELECT USING (status != 'draft' OR auth.uid() = proposer_id);

DROP POLICY IF EXISTS "DAO members can create proposals" ON api.dao_proposals;
CREATE POLICY "DAO members can create proposals" ON api.dao_proposals
    FOR INSERT WITH CHECK (auth.uid() = proposer_id);

DROP POLICY IF EXISTS "Proposal creators can update their proposals" ON api.dao_proposals;
CREATE POLICY "Proposal creators can update their proposals" ON api.dao_proposals
    FOR UPDATE USING (auth.uid() = proposer_id);

-- Grant permissions
GRANT ALL ON api.dao_proposals TO authenticated;
GRANT ALL ON api.dao_proposals TO service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dao_proposals_dao_id ON api.dao_proposals(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_proposer_id ON api.dao_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON api.dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_start_time ON api.dao_proposals(start_time);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_end_time ON api.dao_proposals(end_time);
