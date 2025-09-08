-- Create config_proposals table for DAO approval workflow
-- This table stores configuration change proposals that require DAO approval

CREATE TABLE IF NOT EXISTS api.config_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_id VARCHAR(255) NOT NULL,
    proposed_distribution_interval INTEGER NOT NULL,
    proposed_max_rewards_per_user INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
    proposer_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    implemented_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    approved_by VARCHAR(255),
    implemented_by VARCHAR(255)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_config_proposals_status ON api.config_proposals(status);
CREATE INDEX IF NOT EXISTS idx_config_proposals_config_id ON api.config_proposals(config_id);
CREATE INDEX IF NOT EXISTS idx_config_proposals_created_at ON api.config_proposals(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE api.config_proposals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow admins to create, read, and update proposals
CREATE POLICY "Admins can manage config proposals" ON api.config_proposals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow users to read approved proposals
CREATE POLICY "Users can read approved proposals" ON api.config_proposals
    FOR SELECT USING (status = 'approved');

-- Allow DAO members to vote on proposals (read and update status)
CREATE POLICY "DAO members can vote on proposals" ON api.config_proposals
    FOR SELECT USING (status = 'pending');

-- Grant necessary permissions
GRANT ALL ON api.config_proposals TO authenticated;
GRANT ALL ON api.config_proposals TO service_role;

-- Insert a sample pending proposal for testing (optional)
-- INSERT INTO api.config_proposals (
--     config_id,
--     proposed_distribution_interval,
--     proposed_max_rewards_per_user,
--     status,
--     proposer_id
-- ) VALUES (
--     'default',
--     86400,
--     2000000,
--     'pending',
--     'admin'
-- );

COMMENT ON TABLE api.config_proposals IS 'Stores configuration change proposals that require DAO approval before implementation';
COMMENT ON COLUMN api.config_proposals.status IS 'Proposal status: pending, approved, rejected, or implemented';
COMMENT ON COLUMN api.config_proposals.proposed_distribution_interval IS 'Proposed distribution interval in seconds';
COMMENT ON COLUMN api.config_proposals.proposed_max_rewards_per_user IS 'Proposed maximum rewards per user';
