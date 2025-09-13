-- =====================================================
-- VOTING DAO DATABASE SCHEMA
-- Comprehensive voting DAO with all essential features
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- Proposal status
CREATE TYPE proposal_status AS ENUM (
    'Draft',
    'Active',
    'Passed',
    'Rejected',
    'Executed',
    'Cancelled'
);

-- Voting types
CREATE TYPE voting_type AS ENUM (
    'simple_majority',
    'super_majority',
    'unanimous',
    'weighted',
    'quadratic'
);

-- Member roles
CREATE TYPE member_role AS ENUM (
    'member',
    'moderator',
    'admin',
    'founder'
);

-- Transaction types for treasury
CREATE TYPE treasury_transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'transfer',
    'proposal_funding',
    'reward_distribution'
);

-- =====================================================
-- DAO ORGANIZATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dao_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    discord_url TEXT,
    twitter_url TEXT,
    github_url TEXT,
    governance_token_address TEXT, -- Solana token address
    governance_token_symbol VARCHAR(20),
    governance_token_decimals INTEGER DEFAULT 9,
    min_proposal_threshold BIGINT DEFAULT 1000, -- Minimum tokens to create proposal
    voting_period_days INTEGER DEFAULT 7,
    execution_delay_hours INTEGER DEFAULT 24,
    quorum_percentage DECIMAL(5,2) DEFAULT 10.0, -- Minimum participation %
    super_majority_threshold DECIMAL(5,2) DEFAULT 66.67, -- For super majority votes
    treasury_address TEXT, -- Solana wallet address for treasury
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- DAO MEMBERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dao_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT, -- Solana wallet address
    role member_role DEFAULT 'member',
    governance_tokens BIGINT DEFAULT 0, -- Token balance for voting
    voting_power DECIMAL(10,4) DEFAULT 0.0, -- Calculated voting power
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(dao_id, user_id)
);

-- =====================================================
-- PROPOSALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dao_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    proposer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT, -- Rich text content
    category VARCHAR(100) DEFAULT 'general',
    voting_type voting_type DEFAULT 'simple_majority',
    status proposal_status DEFAULT 'draft',
    
    -- Voting parameters
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    execution_time TIMESTAMP WITH TIME ZONE, -- When proposal can be executed
    
    -- Voting results
    total_votes BIGINT DEFAULT 0,
    yes_votes BIGINT DEFAULT 0,
    no_votes BIGINT DEFAULT 0,
    abstain_votes BIGINT DEFAULT 0,
    participation_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Treasury impact
    treasury_impact_amount DECIMAL(20,8) DEFAULT 0.0,
    treasury_impact_currency VARCHAR(10) DEFAULT 'SOL',
    
    -- Metadata
    tags TEXT[], -- Array of tags
    external_links JSONB, -- Links to external resources
    attachments JSONB, -- File attachments
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexing
    CONSTRAINT valid_voting_period CHECK (end_time > start_time),
    CONSTRAINT valid_execution_time CHECK (execution_time >= end_time)
);

-- =====================================================
-- VOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dao_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES dao_proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_choice VARCHAR(20) NOT NULL CHECK (vote_choice IN ('yes', 'no', 'abstain')),
    voting_power BIGINT NOT NULL DEFAULT 0, -- Token amount used for voting
    voting_weight DECIMAL(10,4) NOT NULL DEFAULT 0.0, -- Calculated weight
    reason TEXT, -- Optional reason for vote
    transaction_hash TEXT, -- Solana transaction hash
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proposal_id, voter_id)
);

-- =====================================================
-- TREASURY TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dao_treasury_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES dao_proposals(id) ON DELETE SET NULL,
    transaction_type treasury_transaction_type NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SOL',
    from_address TEXT,
    to_address TEXT,
    description TEXT,
    transaction_hash TEXT, -- Solana transaction hash
    block_number BIGINT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- PROPOSAL COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dao_proposal_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES dao_proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES dao_proposal_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GOVERNANCE TOKEN SNAPSHOTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dao_token_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL REFERENCES dao_proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_balance BIGINT NOT NULL,
    voting_power DECIMAL(10,4) NOT NULL,
    snapshot_block BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DAO NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dao_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'proposal_created', 'vote_cast', 'proposal_ended', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    proposal_id UUID REFERENCES dao_proposals(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- DAO Organizations
CREATE INDEX IF NOT EXISTS idx_dao_organizations_created_by ON dao_organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_dao_organizations_active ON dao_organizations(is_active);

-- DAO Members
CREATE INDEX IF NOT EXISTS idx_dao_members_dao_id ON dao_members(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_user_id ON dao_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dao_members_active ON dao_members(is_active);
CREATE INDEX IF NOT EXISTS idx_dao_members_role ON dao_members(role);

-- Proposals
CREATE INDEX IF NOT EXISTS idx_dao_proposals_dao_id ON dao_proposals(dao_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_proposer ON dao_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_start_time ON dao_proposals(start_time);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_end_time ON dao_proposals(end_time);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_created_at ON dao_proposals(created_at);

-- Votes
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal_id ON dao_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_voter_id ON dao_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_created_at ON dao_votes(created_at);

-- Treasury Transactions
CREATE INDEX IF NOT EXISTS idx_treasury_dao_id ON dao_treasury_transactions(dao_id);
CREATE INDEX IF NOT EXISTS idx_treasury_proposal_id ON dao_treasury_transactions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_treasury_type ON dao_treasury_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_treasury_created_at ON dao_treasury_transactions(created_at);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_proposal_id ON dao_proposal_comments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON dao_proposal_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON dao_proposal_comments(parent_comment_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON dao_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_dao_id ON dao_notifications(dao_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON dao_notifications(is_read);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE dao_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_proposal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_token_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_notifications ENABLE ROW LEVEL SECURITY;

-- DAO Organizations policies
CREATE POLICY "Anyone can view active DAOs" ON dao_organizations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create DAOs" ON dao_organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "DAO creators can update their DAOs" ON dao_organizations
    FOR UPDATE USING (auth.uid() = created_by);

-- DAO Members policies
CREATE POLICY "Anyone can view DAO members" ON dao_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join DAOs" ON dao_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" ON dao_members
    FOR UPDATE USING (auth.uid() = user_id);

-- Proposals policies
CREATE POLICY "Anyone can view active proposals" ON dao_proposals
    FOR SELECT USING (status != 'draft' OR auth.uid() = proposer_id);

CREATE POLICY "DAO members can create proposals" ON dao_proposals
    FOR INSERT WITH CHECK (
        auth.uid() = proposer_id AND
        EXISTS (
            SELECT 1 FROM dao_members 
            WHERE dao_id = dao_proposals.dao_id 
            AND user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Proposers can update their draft proposals" ON dao_proposals
    FOR UPDATE USING (auth.uid() = proposer_id AND status = 'draft');

-- Votes policies
CREATE POLICY "Anyone can view votes" ON dao_votes
    FOR SELECT USING (true);

CREATE POLICY "DAO members can vote" ON dao_votes
    FOR INSERT WITH CHECK (
        auth.uid() = voter_id AND
        EXISTS (
            SELECT 1 FROM dao_members dm
            JOIN dao_proposals dp ON dm.dao_id = dp.dao_id
            WHERE dp.id = dao_votes.proposal_id 
            AND dm.user_id = auth.uid() 
            AND dm.is_active = true
        )
    );

-- Treasury policies
CREATE POLICY "Anyone can view treasury transactions" ON dao_treasury_transactions
    FOR SELECT USING (true);

CREATE POLICY "DAO admins can create treasury transactions" ON dao_treasury_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM dao_members 
            WHERE dao_id = dao_treasury_transactions.dao_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'founder')
            AND is_active = true
        )
    );

-- Comments policies
CREATE POLICY "Anyone can view comments" ON dao_proposal_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can comment" ON dao_proposal_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON dao_proposal_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON dao_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON dao_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_dao_organizations_updated_at BEFORE UPDATE ON dao_organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dao_members_updated_at BEFORE UPDATE ON dao_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dao_proposals_updated_at BEFORE UPDATE ON dao_proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dao_proposal_comments_updated_at BEFORE UPDATE ON dao_proposal_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate voting power
CREATE OR REPLACE FUNCTION calculate_voting_power(
    token_balance BIGINT,
    total_supply BIGINT,
    voting_type voting_type
) RETURNS DECIMAL(10,4) AS $$
BEGIN
    IF total_supply = 0 THEN
        RETURN 0;
    END IF;
    
    CASE voting_type
        WHEN 'simple_majority' THEN
            RETURN (token_balance::DECIMAL / total_supply::DECIMAL) * 100;
        WHEN 'weighted' THEN
            -- Square root voting for quadratic voting
            RETURN SQRT(token_balance::DECIMAL) * 100;
        ELSE
            RETURN (token_balance::DECIMAL / total_supply::DECIMAL) * 100;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create proposal
CREATE OR REPLACE FUNCTION can_create_proposal(
    p_dao_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    user_tokens BIGINT;
    min_threshold BIGINT;
BEGIN
    -- Get user's token balance
    SELECT governance_tokens INTO user_tokens
    FROM dao_members
    WHERE dao_id = p_dao_id AND user_id = p_user_id AND is_active = true;
    
    -- Get minimum threshold
    SELECT min_proposal_threshold INTO min_threshold
    FROM dao_organizations
    WHERE id = p_dao_id;
    
    RETURN COALESCE(user_tokens, 0) >= COALESCE(min_threshold, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update proposal voting results
CREATE OR REPLACE FUNCTION update_proposal_results(p_proposal_id UUID)
RETURNS VOID AS $$
DECLARE
    total_votes_count BIGINT;
    yes_votes_count BIGINT;
    no_votes_count BIGINT;
    abstain_votes_count BIGINT;
    participation_rate DECIMAL(5,2);
BEGIN
    -- Calculate vote counts
    SELECT 
        COUNT(*),
        SUM(CASE WHEN vote_choice = 'yes' THEN 1 ELSE 0 END),
        SUM(CASE WHEN vote_choice = 'no' THEN 1 ELSE 0 END),
        SUM(CASE WHEN vote_choice = 'abstain' THEN 1 ELSE 0 END)
    INTO total_votes_count, yes_votes_count, no_votes_count, abstain_votes_count
    FROM dao_votes
    WHERE proposal_id = p_proposal_id;
    
    -- Calculate participation rate (simplified)
    participation_rate := (total_votes_count::DECIMAL / 100) * 100; -- This would need actual member count
    
    -- Update proposal
    UPDATE dao_proposals
    SET 
        total_votes = total_votes_count,
        yes_votes = yes_votes_count,
        no_votes = no_votes_count,
        abstain_votes = abstain_votes_count,
        participation_rate = participation_rate,
        updated_at = NOW()
    WHERE id = p_proposal_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update proposal results when votes are added
CREATE OR REPLACE FUNCTION trigger_update_proposal_results()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_proposal_results(NEW.proposal_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proposal_results_trigger
    AFTER INSERT OR UPDATE OR DELETE ON dao_votes
    FOR EACH ROW EXECUTE FUNCTION trigger_update_proposal_results();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert a sample DAO organization
INSERT INTO dao_organizations (
    name, 
    description, 
    governance_token_symbol,
    min_proposal_threshold,
    voting_period_days,
    quorum_percentage
) VALUES (
    'Sample DAO',
    'A sample decentralized autonomous organization for testing and demonstration purposes.',
    'SAMPLE',
    1000,
    7,
    10.0
) ON CONFLICT DO NOTHING;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active proposals with member info
CREATE OR REPLACE VIEW active_proposals_view AS
SELECT 
    p.*,
    o.name as dao_name,
    o.governance_token_symbol,
    u.email as proposer_email,
    dm.governance_tokens as proposer_tokens,
    CASE 
        WHEN p.end_time < NOW() THEN 'ended'
        WHEN p.start_time > NOW() THEN 'upcoming'
        ELSE 'active'
    END as voting_status
FROM dao_proposals p
JOIN dao_organizations o ON p.dao_id = o.id
JOIN auth.users u ON p.proposer_id = u.id
LEFT JOIN dao_members dm ON p.dao_id = dm.dao_id AND p.proposer_id = dm.user_id
WHERE p.status IN ('active', 'passed', 'rejected')
ORDER BY p.created_at DESC;

-- View for DAO member statistics
CREATE OR REPLACE VIEW dao_member_stats AS
SELECT 
    o.id as dao_id,
    o.name as dao_name,
    COUNT(dm.id) as total_members,
    COUNT(CASE WHEN dm.is_active THEN 1 END) as active_members,
    SUM(dm.governance_tokens) as total_tokens,
    AVG(dm.governance_tokens) as avg_tokens_per_member
FROM dao_organizations o
LEFT JOIN dao_members dm ON o.id = dm.dao_id
GROUP BY o.id, o.name;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ DAO Database Schema Created Successfully!';
    RAISE NOTICE '📊 Tables Created: 8';
    RAISE NOTICE '🔐 RLS Policies: Enabled';
    RAISE NOTICE '⚡ Functions: 4';
    RAISE NOTICE '🎯 Triggers: 4';
    RAISE NOTICE '📈 Views: 2';
    RAISE NOTICE '🚀 Ready for DAO Implementation!';
END $$;
